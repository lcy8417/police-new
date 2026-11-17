import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { editFileUrl, editHistoryKeys, useCrimeStore, useEditHistory, type Crime, type EditHistory } from "@/entities/crime"
import {
  PolygonCaptureCanvas,
  flipImage,
  revertTargetOf,
  shortHash,
  toHistoryRows,
  undoTargetNo,
  useImageEdit,
  useRevertEdit,
  useSaveEditStep,
  type EditStepOp,
  type FlipAxis,
} from "@/features/crime-edit"
import { rotateArbitrary, useImageEditor } from "@/features/crime-register"
import { ApiError } from "@/shared/api"
import { resolveImageToDataUrl, toKstIso } from "@/shared/lib"
import {
  DEFAULT_VIEW_ADJUSTMENTS,
  ImageEditScreen,
  type DenoiseState,
  type ImageEditTool,
  type ViewAdjustments,
} from "@/widgets/image-edit"

import type { TabViewer } from "./model/use-viewer"
import { useRejudgeConfirm } from "./RejudgeConfirm"

/** 위젯 도구 중 `useImageEditor`(자르기 · 4점 보정 · 길이 측정)가 맡는 것 → 그 훅의 모드 이름 */
const EDITOR_MODE = { crop: "crop", calibrate: "calibration", measure: "measure" } as const
type EditorTool = keyof typeof EDITOR_MODE

const isEditorTool = (tool: ImageEditTool | null): tool is EditorTool =>
  tool === "crop" || tool === "calibrate" || tool === "measure"

/** 조회 실패 시각 「시:분」(KST) */
const kstClock = (ms: number) => toKstIso(new Date(ms)).slice(11, 16)

/** 서버 거절 문구(한국어 detail) 그대로, 없으면 기본 문구 */
const errorText = (e: unknown, fallback: string) => (e instanceof ApiError && e.detail ? e.detail : fallback)

const MSG_SUPERSEDED = "확정 판정이 있던 이미지라 판정이 「다시 판정」 상태가 되었습니다."

export interface EditTabProps {
  viewer: TabViewer
  image: Crime
  /** SCAS 「취소」 — 편집을 버리고 사건 정보로 */
  onCancel: () => void
  /** 판정이 확정된 장(A2 `aprthng_sttus` CONFIRMED) — 저장 전에 「다시 판정」 확인 */
  judged?: boolean
}

/**
 * 「이미지 편집」 탭 — 1차 편집(결정 §3-2). **도구 「확인」 1번 = 서버 편집 이력 한 단계(B4)**(잠금 §1-③):
 *   배경제거 · 접합장애물제거 · 이진화 · 노이즈제거 = `features/crime-edit` `useImageEdit`(서버 처리 결과를 `onStep` 으로 B4 저장 뒤 반영)
 *   자르기 · 4점 각도 보정 · 길이 측정 = `features/crime-register` `useImageEditor`, 회전 = 보기 회전 → 확인 때 픽셀에 굽기(B4)
 *   좌우 · 상하반전 = 캔버스 뒤집기(B4)
 * 편집 이력 · 단계 그림 · 원본 해시는 B3(`useEditHistory`), 되돌리기 · 여기까지 되돌리기 · 처음상태 = B5(새 줄 — 지움 없음).
 * 「그새 다른 편집」 409 는 알림 + 이력 다시 읽기 + 서버의 지금 편집본으로 바꿔 놓음.
 */
export function EditTab({ viewer, image, onCancel, judged = false }: EditTabProps) {
  const aprthngNo = image.aprthngNo ?? ""
  const queryClient = useQueryClient()
  const setCrimeData = useCrimeStore((s) => s.setCrimeData)
  const historyQuery = useEditHistory(aprthngNo)
  const history = historyQuery.data
  const saveStep = useSaveEditStep(aprthngNo)
  const revert = useRevertEdit(aprthngNo)

  // B4 · B5 의 srcFileId — 서버 응답으로 바로 옮긴다(이력 다시 읽기를 기다리지 않고 다음 단계가 맞는 파일을 보게)
  const currentRef = React.useRef<number | null>(null)
  React.useEffect(() => {
    if (history) currentRef.current = history.currentFileId
  }, [history])

  // 받은 원본(0번 줄) 그림 = 작업본 파일, 옛 감정물(작업본 없음)은 장면 이미지
  const baseSrc = history?.workingFileId != null ? editFileUrl(history.workingFileId) : image.image
  // 편집 시작 그림 = 서버의 지금 편집본. 옛 감정물은 옛 편집본(없으면 장면) — 첫 저장 때 서버가 장면을 작업본으로 소급 등록
  const seedImage = history
    ? history.currentFileId !== null
      ? editFileUrl(history.currentFileId)
      : (image.editImage ?? image.image)
    : undefined

  /** 옛 화면(통합 커맨드센터 · 문양 탭)이 아직 전역 store 의 editImage 를 읽어 — 지금 편집본을 같이 넣어 둔다(전환 기간) */
  const mirrorToStore = React.useCallback(
    (img: string) => {
      void resolveImageToDataUrl(img)
        .then((dataUrl) =>
          setCrimeData((prev) => prev.map((item) => (item.aprthngNo === aprthngNo ? { ...item, editImage: dataUrl } : item)))
        )
        .catch(() => undefined)
    },
    [aprthngNo, setCrimeData]
  )

  // 409 등으로 화면이 서버와 어긋나면 서버의 지금 편집본으로(다시 읽은 이력 기준)
  const editRef = React.useRef<ReturnType<typeof useImageEdit> | null>(null)
  const syncToServer = React.useCallback(() => {
    const fresh = queryClient.getQueryData<EditHistory>(editHistoryKeys.list(aprthngNo))
    if (fresh?.currentFileId == null) return
    currentRef.current = fresh.currentFileId
    editRef.current?.resetTo(editFileUrl(fresh.currentFileId))
  }, [queryClient, aprthngNo])

  // 판정이 확정된 장이면 첫 저장 전에 「다시 판정 상태가 됩니다」 확인(취소 = 그 단계를 버림)
  const rejudge = useRejudgeConfirm(judged)
  const onStep = async (img: string, op: EditStepOp) => {
    if (!(await rejudge.confirm())) throw new Error("다시 판정 확인 취소")
    try {
      const res = await saveStep.mutateAsync({ srcFileId: currentRef.current, image: img, ops: [op] })
      currentRef.current = res.resultFileId
      mirrorToStore(img)
      if (res.supersededExamId !== null) toast(MSG_SUPERSEDED)
    } catch (e) {
      toast.error(errorText(e, "편집 단계를 저장하지 못했습니다. 다시 시도해 주세요."))
      if (e instanceof ApiError && e.status === 409) syncToServer()
      throw e
    }
  }

  const edit = useImageEdit({ aprthngNo, seedImage, originalImage: baseSrc, onStep })
  editRef.current = edit
  // 자르기 · 4점 보정이 결과를 넘길 때 어느 도구였나(onApply 시점의 모드)
  const editorModeRef = React.useRef<string>("none")
  const editor = useImageEditor(edit.workingImage || null, (next: string) => {
    void edit.applyImage(next, { op: editorModeRef.current === "calibration" ? "calibrate" : "crop" })
  })
  editorModeRef.current = editor.mode

  const [zoom, setZoom] = React.useState(100)
  const [rotateStep, setRotateStep] = React.useState(1)
  // 아직 굽지 않은 보기 회전(도)
  const [rotation, setRotation] = React.useState(0)
  const [size, setSize] = React.useState({ width: 0, height: 0 })
  const [denoiseState, setDenoiseState] = React.useState<DenoiseState>("idle")
  const [adjustments, setAdjustments] = React.useState<ViewAdjustments>(DEFAULT_VIEW_ADJUSTMENTS)

  const workingRef = React.useRef(edit.workingImage)
  workingRef.current = edit.workingImage

  /** 보기 회전을 픽셀에 굽는다(편집 한 단계 = B4). 저장이 실패하면 회전을 그대로 둔다 */
  const commitRotation = React.useCallback(async () => {
    if (rotation === 0 || !workingRef.current) return true
    const rotated = await rotateArbitrary(workingRef.current, rotation)
    const ok = await edit.applyImage(rotated, { op: "rotate", deg: rotation })
    if (ok) setRotation(0)
    return ok
  }, [rotation, edit])

  /** 자르기 · 보정 · 측정 모드를 적용 없이 끈다 */
  const exitEditor = () => {
    if (editor.mode === "calibration") editor.toggleCalibration()
    else if (editor.mode === "measure") editor.toggleMeasure()
    else if (editor.mode === "crop") {
      // 자르기 토글은 「적용 + 종료」라, 측정 모드를 두 번 오가서 적용 없이 끈다
      editor.toggleMeasure()
      editor.toggleMeasure()
    }
  }

  const activeTool: ImageEditTool | null =
    editor.mode === "crop" ? "crop" : editor.mode === "calibration" ? "calibrate" : editor.mode === "measure" ? "measure" : edit.activeTool

  const handleToolChange = async (tool: ImageEditTool | null) => {
    if (tool === null) {
      exitEditor()
      edit.setActiveTool(null)
      return
    }
    if (!(await commitRotation())) return
    if (isEditorTool(tool)) {
      edit.setActiveTool(null)
      if (editor.mode === EDITOR_MODE[tool]) return
      if (tool === "crop") {
        if (editor.mode !== "none") exitEditor()
        void editor.toggleCrop()
      } else if (tool === "calibrate") editor.toggleCalibration()
      else editor.toggleMeasure()
      return
    }
    exitEditor()
    edit.setActiveTool(tool)
  }

  /**
   * 도구 줄 「취소」 = 지금 고른 도구 · 확인 안 한 보기 회전 · 이진화 미리보기 · 찍은 점을 버린다. 탭은 그대로
   * ([버그] 옛 단독 편집 화면의 「나가기」 뜻이 남아 사건 정보 탭으로 가던 것 — 탭 이동은 위 작업 탭으로)
   */
  const handleCancel = () => {
    exitEditor()
    setRotation(0)
    edit.setActiveTool(null)
  }

  const handleConfirm = async () => {
    if (editor.mode === "crop") {
      await editor.toggleCrop()
      return
    }
    if (rotation !== 0) {
      await commitRotation()
      return
    }
    toast("확정할 자르기 · 회전이 없습니다.")
  }

  const handleDenoise = async () => {
    if (!(await commitRotation())) return
    const before = workingRef.current
    setDenoiseState("running")
    await edit.runDenoise()
    // runDenoise 는 실패를 안에서 알리고 이미지를 그대로 둔다 — 바뀌었으면 끝, 아니면 실패
    setDenoiseState(workingRef.current !== before ? "done" : "failed")
  }

  const handleFlip = async (axis: FlipAxis) => {
    if (!(await commitRotation()) || !workingRef.current) return
    try {
      const flipped = await flipImage(workingRef.current, axis)
      await edit.applyImage(flipped, { op: "flip", axis })
    } catch {
      toast.error("이미지를 뒤집지 못했습니다.")
    }
  }

  /** 「편집 저장」 — 단계마다 이미 저장되므로, 확인 안 한 결과(굽지 않은 회전 · 이진화 미리보기)가 있을 때만 한 단계로 저장 */
  const handleSave = async () => {
    if (rotation !== 0) {
      await commitRotation()
      return
    }
    if (edit.activeTool === "threshold") {
      await edit.applyThreshold()
      return
    }
    toast("편집은 도구 「확인」마다 한 단계씩 저장되었습니다.")
  }

  /** 편집 이력 n 번 줄 상태로 되돌린다(0 = 받은 원본 = 작업본) — B5 새 줄 */
  const revertTo = async (no: number) => {
    if (!history) return
    const target = revertTargetOf(history, no)
    const src = currentRef.current
    if (!target || target.fileId === null || src === null) {
      toast("되돌릴 편집이 없습니다.")
      return
    }
    if (target.fileId === src) {
      toast(no === 0 ? "이미 받은 원본 상태입니다." : "이미 그 단계입니다.")
      return
    }
    if (!(await rejudge.confirm())) return
    setRotation(0)
    exitEditor()
    try {
      const res = await revert.mutateAsync({ srcFileId: src, toEditId: target.toEditId })
      currentRef.current = res.resultFileId
      const next = editFileUrl(res.resultFileId)
      edit.resetTo(next)
      mirrorToStore(next)
      if (res.supersededExamId !== null) toast(MSG_SUPERSEDED)
    } catch (e) {
      toast.error(errorText(e, "되돌리지 못했습니다. 다시 시도해 주세요."))
      if (e instanceof ApiError && e.status === 409) syncToServer()
    }
  }

  const rows = React.useMemo(() => (history ? toHistoryRows(history, editFileUrl) : []), [history])
  const undoNo = history ? undoTargetNo(history) : null
  const busy = revert.isPending || saveStep.isPending

  const polygonActive = edit.activeTool === "background" || edit.activeTool === "inpaint"
  const canvasSlot = (
    <div className="absolute inset-0 overflow-auto">
      <div className="grid size-full place-items-[safe_center] p-[8px]">
        {/* 확대율 = 칸 높이에 대한 그림 높이(100 = 칸에 맞춤). 런타임 계산 크기라 인라인 height 예외 */}
        <div className="relative" style={{ height: `${zoom}%` }}>
          <div ref={editor.containerRef} className="relative h-full w-fit">
            {edit.displayImage ? (
              <img
                ref={editor.imgRef}
                src={edit.displayImage}
                alt={`${aprthngNo} 편집 이미지`}
                draggable={false}
                onLoad={(e) => {
                  setSize({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })
                  editor.recomputeOverlay()
                }}
                className="block h-full w-auto object-contain select-none"
                // 굽기 전 보기 회전(런타임 각도) — 도구에 들어가기 전에 굽기 때문에 좌표 캔버스와 겹치지 않는다
                style={rotation ? { transform: `rotate(${rotation}deg)` } : undefined}
              />
            ) : null}
            {editor.mode !== "none" && editor.overlayRect ? (
              <canvas
                ref={editor.overlayRef}
                onMouseDown={editor.onOverlayMouseDown}
                onMouseMove={editor.onOverlayMouseMove}
                onMouseUp={editor.onOverlayMouseUp}
                onMouseLeave={editor.onOverlayMouseUp}
                onClick={editor.onOverlayClick}
                className="absolute cursor-crosshair"
                style={{
                  left: editor.overlayRect.left,
                  top: editor.overlayRect.top,
                  width: editor.overlayRect.width,
                  height: editor.overlayRect.height,
                }}
              />
            ) : null}
            {polygonActive || edit.isProcessing ? (
              <PolygonCaptureCanvas
                activeTool={edit.activeTool}
                points={edit.points}
                onAddPoint={edit.addPoint}
                onSubmitPolygon={(rect) => void edit.submitPolygon(rect)}
                isProcessing={edit.isProcessing}
                processingLabel={edit.processingLabel}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
    {rejudge.dialog}
    <ImageEditScreen
      status={historyQuery.isError ? "error" : history ? "ready" : "loading"}
      errorAt={historyQuery.isError ? kstClock(historyQuery.errorUpdatedAt) : undefined}
      onRetry={() => void historyQuery.refetch()}
      isAdmin={viewer.isAdmin}
      features={viewer.features}
      showPlus={false}
      inWindow
      aprthngNo={aprthngNo}
      originalSize={size}
      canvasSlot={canvasSlot}
      zoom={zoom}
      onZoomChange={(z) => setZoom(Math.min(400, Math.max(10, Math.round(z))))}
      rotateStep={rotateStep}
      onRotateStepChange={setRotateStep}
      onRotate={(dir) => setRotation((r) => Number((r + (dir === "left" ? -rotateStep : rotateStep)).toFixed(1)))}
      onFit={() => setZoom(100)}
      onActualSize={() => setZoom(100)}
      activeTool={activeTool}
      onToolChange={(tool) => void handleToolChange(tool)}
      thresholdMode={edit.thresholdMode}
      onThresholdModeChange={edit.setThresholdMode}
      threshold={edit.threshold}
      onThresholdChange={edit.setThreshold}
      onApplyThreshold={() => void edit.applyThreshold()}
      onApplyCalibration={() =>
        toast(editor.pointCount < 4 ? `네 모서리 점을 찍으면 바로 폅니다(${editor.pointCount} / 4).` : "각도 보정 중입니다.")
      }
      onApplyPolygon={() => {
        const rect = editor.containerRef.current?.getBoundingClientRect()
        if (rect) void edit.submitPolygon(rect)
      }}
      measureCm={null}
      denoiseState={denoiseState}
      onRunDenoise={() => void handleDenoise()}
      canUndo={!busy && (rotation !== 0 || undoNo !== null)}
      onUndo={() => (rotation !== 0 ? setRotation(0) : undoNo !== null ? void revertTo(undoNo) : undefined)}
      onUndoTo={(no) => void revertTo(no)}
      onRestore={() => void revertTo(0)}
      onFlip={(axis) => void handleFlip(axis)}
      onCancel={handleCancel}
      onConfirm={() => void handleConfirm()}
      onSave={() => void handleSave()}
      viewerImage={{ src: edit.displayImage, alt: `${aprthngNo} 사건 이미지` }}
      adjustments={adjustments}
      onAdjustmentsChange={setAdjustments}
      onClose={onCancel}
      editHistory={rows}
      beforeAfter={baseSrc ? { original: baseSrc, edited: seedImage ?? baseSrc } : undefined}
      originalHash={history?.original ? shortHash(history.original.sha256) : undefined}
      originalMissing={history ? history.original === null : undefined}
    />
    </>
  )
}
