import * as React from "react"
import { toast } from "sonner"

import { useCrimeStore, type Crime } from "@/entities/crime"
import { PolygonCaptureCanvas, useImageEdit } from "@/features/crime-edit"
import { rotateArbitrary, useImageEditor } from "@/features/crime-register"
import {
  DEFAULT_VIEW_ADJUSTMENTS,
  ImageEditScreen,
  type DenoiseState,
  type ImageEditTool,
  type ViewAdjustments,
} from "@/widgets/image-edit"

import type { TabViewer } from "./model/use-viewer"

/** 위젯 도구 중 `useImageEditor`(자르기 · 4점 보정 · 길이 측정)가 맡는 것 → 그 훅의 모드 이름 */
const EDITOR_MODE = { crop: "crop", calibrate: "calibration", measure: "measure" } as const
type EditorTool = keyof typeof EDITOR_MODE

const isEditorTool = (tool: ImageEditTool | null): tool is EditorTool =>
  tool === "crop" || tool === "calibrate" || tool === "measure"

export interface EditTabProps {
  viewer: TabViewer
  image: Crime
  /** SCAS 「취소」 — 편집을 버리고 사건 정보로 */
  onCancel: () => void
}

/**
 * 「이미지 편집」 탭 — 1차 편집(결정 §3-2)을 실제 편집 훅으로:
 *   배경제거 · 접합장애물제거 · 이진화 · 노이즈제거 · 되돌리기 · 원본 복원 · 저장 = `features/crime-edit` `useImageEdit`(서버 처리 · `PUT /crime/edit_image`)
 *   자르기 · 4점 각도 보정(`/crime/demo/perspective`) · 길이 측정 = `features/crime-register` `useImageEditor`(등록 화면과 같은 훅)
 *   회전 = 보기 회전(미리보기) → 확인 · 도구 진입 · 저장 때 `rotateArbitrary` 로 픽셀에 굽기
 * 편집 결과는 모두 `useImageEdit` 한 스택에 쌓여 되돌리기가 이어진다. 편집 이력 단계 그림(B3 · B4)은 서버 API 가 없어 그리지 않는다.
 */
export function EditTab({ viewer, image, onCancel }: EditTabProps) {
  const aprthngNo = image.aprthngNo ?? ""
  const setCrimeData = useCrimeStore((s) => s.setCrimeData)
  const edit = useImageEdit({
    aprthngNo,
    seedImage: image.editImage ?? image.image,
    originalImage: image.image,
  })
  const editor = useImageEditor(edit.workingImage || null, edit.applyImage)

  const [zoom, setZoom] = React.useState(100)
  const [rotateStep, setRotateStep] = React.useState(1)
  // 아직 굽지 않은 보기 회전(도)
  const [rotation, setRotation] = React.useState(0)
  const [size, setSize] = React.useState({ width: 0, height: 0 })
  const [denoiseState, setDenoiseState] = React.useState<DenoiseState>("idle")
  const [adjustments, setAdjustments] = React.useState<ViewAdjustments>(DEFAULT_VIEW_ADJUSTMENTS)

  const workingRef = React.useRef(edit.workingImage)
  workingRef.current = edit.workingImage

  /** 보기 회전을 픽셀에 굽는다(편집 한 단계) */
  const commitRotation = React.useCallback(async () => {
    if (rotation === 0 || !workingRef.current) return
    const rotated = await rotateArbitrary(workingRef.current, rotation)
    edit.applyImage(rotated)
    setRotation(0)
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
    await commitRotation()
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
    await commitRotation()
    const before = workingRef.current
    setDenoiseState("running")
    await edit.runDenoise()
    // runDenoise 는 실패를 안에서 알리고 이미지를 그대로 둔다 — 바뀌었으면 끝, 아니면 실패
    setDenoiseState(workingRef.current !== before ? "done" : "failed")
  }

  const handleSave = async () => {
    try {
      await commitRotation()
      await edit.save((finalImage) => {
        // 지금 앱(CrimeDetailPage handleEditSaved)과 같이 store editImage 만 낙관적으로 바꾼다 — 목록 GET 이 편집본을 보장하지 않아 refetch 하지 않음
        setCrimeData((prev) => prev.map((item) => (item.aprthngNo === aprthngNo ? { ...item, editImage: finalImage } : item)))
        toast.success("편집 이미지가 저장되었습니다.")
      })
    } catch {
      // 실패 안내는 save 안의 알림
    }
  }

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
    <ImageEditScreen
      status="ready"
      onRetry={() => undefined}
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
      canUndo={edit.canUndo || rotation !== 0}
      onUndo={() => (rotation !== 0 ? setRotation(0) : edit.undo())}
      onRestore={() => {
        setRotation(0)
        exitEditor()
        edit.restoreOriginal()
      }}
      onCancel={onCancel}
      onConfirm={() => void handleConfirm()}
      onSave={() => void handleSave()}
      viewerImage={{ src: edit.displayImage, alt: `${aprthngNo} 사건 이미지` }}
      adjustments={adjustments}
      onAdjustmentsChange={setAdjustments}
      onClose={onCancel}
    />
  )
}
