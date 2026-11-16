import * as React from "react"
import { toast } from "sonner"

import { toKstIso, type ThresholdMode } from "@/shared/lib"
import {
  CropFrame,
  Crosshair,
  DEFAULT_VIEW_ADJUSTMENTS,
  FourPoints,
  ImageEditScreen,
  Loupe,
  MeasureLines,
  Minimap,
  PolygonMask,
  RotateHandle,
  type DenoiseState,
  type ImageEditHistoryEntry,
  type ImageEditTool,
  type PctPoint,
  type ViewAdjustments,
} from "@/widgets/image-edit"

import {
  DevScreenFrame,
  SCREEN_CASES,
  devScreen,
  useDevCase,
  useDevNavigate,
  useDevPlus,
  useDevViewer,
  type DevGo,
} from "../frame"
import { FakePhoto } from "../mock-assets/FakePhoto"
import { hasSamplePhotos, samplePhotoUrl, sampleSoleUrl } from "../mock-assets/sample-images"
import {
  S03_AI_SUGGESTIONS,
  S03_APRTHNG_NO,
  S03_CANVAS_TAGS,
  S03_CROP_LABEL,
  S03_CROP_LABEL_CM,
  S03_FOUND_LABEL,
  S03_HASH,
  S03_MEASURE_CM,
  S03_MOCK,
  S03_ORIGINAL_SIZE,
  S03_TILT,
  S03_VIEWER_LABEL,
  type S03Case,
} from "./mock-cases"

/** 동작이 아직 없는 신규 버튼(spec §13-4) */
const notReady = (label: string) => toast("시안 — 기능 준비 중", { description: label })
/** 각도 글자 — 음수는 시안처럼 − */
const deg = (n: number) => `${n}°`.replace("-", "−")
/** 지금 시각 「시:분:초」(KST) */
const nowKst = () => toKstIso().slice(11, 19)

const info = devScreen("s03")

const CALIBRATE_POINTS: [PctPoint, PctPoint, PctPoint, PctPoint] = [
  { x: 18, y: 6 },
  { x: 82, y: 4 },
  { x: 86, y: 95 },
  { x: 14, y: 97 },
]
const SOLE_OUTLINE: PctPoint[] = [
  { x: 32, y: 5 },
  { x: 68, y: 5 },
  { x: 76, y: 30 },
  { x: 70, y: 60 },
  { x: 72, y: 92 },
  { x: 50, y: 97 },
  { x: 30, y: 92 },
  { x: 30, y: 60 },
  { x: 24, y: 30 },
]
const OBSTACLE: PctPoint[] = [
  { x: 56, y: 40 },
  { x: 70, y: 41 },
  { x: 69, y: 50 },
  { x: 55, y: 49 },
]

/**
 * 좌표 캔버스 자리에 넣는 가짜 그림 + 시안 도구 모양(고정 장식, pointer-events-none).
 * 캔버스 화면이라 사진을 잘리지 않게(meet) 담는다(layout.md 「좌표 민감 영역」).
 */
function FakeCanvas({
  tool,
  rotate,
  photoSrc,
  binarySrc,
  plus,
}: {
  tool: ImageEditTool | null
  rotate: number
  photoSrc: string
  /** 실제 현장 사진의 이진화본(표본 사진이 있을 때만 — 없으면 가짜 그림이 스스로 이진화 모양을 그린다) */
  binarySrc: string
  /** 신규 켜기 — 자 인식 뒤라 자르기 틀 크기에 cm 를 덧붙인다(시안 핀 3) */
  plus: boolean
}) {
  return (
    <>
      <div className="absolute top-[58px] bottom-[34px] left-1/2 aspect-[2/3] -translate-x-1/2">
        {hasSamplePhotos ? (
          <img src={tool === "threshold" ? binarySrc : photoSrc} alt="" className="block size-full object-contain" />
        ) : (
          <FakePhoto rotate={rotate} look={tool === "threshold" ? "binary" : "raw"} preserveAspectRatio="xMidYMid meet" />
        )}
        {tool === "crop" ? (
          <CropFrame rect={{ left: 21, right: 21, top: 3, bottom: 3 }} sizeLabel={plus ? S03_CROP_LABEL_CM : S03_CROP_LABEL}>
            <RotateHandle label={`${deg(rotate)} → 0°`} />
          </CropFrame>
        ) : null}
        {tool === "calibrate" ? (
          <>
            <FourPoints points={CALIBRATE_POINTS} />
            <Loupe src={photoSrc} at={CALIBRATE_POINTS[0]} />
          </>
        ) : null}
        {tool === "measure" ? (
          <>
            <MeasureLines
              reference={[
                { x: 6, y: 10 },
                { x: 6, y: 14 },
              ]}
              measure={[
                { x: 50, y: 5 },
                { x: 50, y: 96 },
              ]}
            />
            <Crosshair at={{ x: 50, y: 96 }} />
          </>
        ) : null}
        {tool === "background" ? <PolygonMask points={SOLE_OUTLINE} tone="keep" /> : null}
        {tool === "inpaint" ? <PolygonMask points={OBSTACLE} tone="remove" /> : null}
      </div>
      <Minimap src={photoSrc} view={{ left: 18, right: 14, top: 8, bottom: 8 }} />
    </>
  )
}

function S03Stage({ caseName, imageNo, go: goProp, inWindow }: { caseName: S03Case; imageNo: string; go?: DevGo; inWindow?: boolean }) {
  const mock = S03_MOCK[caseName]
  const viewer = useDevViewer()
  const plus = useDevPlus()
  const nav = useDevNavigate()
  const go = goProp ?? nav

  const [zoom, setZoom] = React.useState(100)
  const [rotation, setRotation] = React.useState(S03_TILT)
  const [rotateStep, setRotateStep] = React.useState(1)
  const [activeTool, setActiveTool] = React.useState<ImageEditTool | null>(mock.activeTool)
  const [thresholdMode, setThresholdMode] = React.useState<ThresholdMode>("standard")
  const [threshold, setThreshold] = React.useState(127)
  const [denoiseState, setDenoiseState] = React.useState<DenoiseState>(mock.denoiseState)
  const [history, setHistory] = React.useState<ImageEditHistoryEntry[]>(mock.history)
  const [adjustments, setAdjustments] = React.useState<ViewAdjustments>(DEFAULT_VIEW_ADJUSTMENTS)

  // 표본 사진이 있으면 이 이미지 번호(감정번호_n)의 실제 사진 — 같은 사건 · 같은 장은 어느 탭에서나 같은 사진
  const photoSrc = React.useMemo(() => samplePhotoUrl(imageNo, { rotate: S03_TILT, tag: "" }), [imageNo])
  const viewerSrc = React.useMemo(() => samplePhotoUrl(imageNo, { rotate: 0, flip: true, tag: "" }), [imageNo])
  const binarySrc = React.useMemo(() => samplePhotoUrl(imageNo, { look: "binary" }), [imageNo])
  const foundSrc = React.useMemo(() => sampleSoleUrl("305659", { kind: "shoe", zones: ["dots", "herring", "grid"] }), [])
  const fakeNote = hasSamplePhotos ? "" : "(가짜 예시)"

  // 진열용: 노이즈제거를 누르면 잠시 뒤 끝난 모양으로(running 케이스는 계속 도는 모양을 보여 준다)
  React.useEffect(() => {
    if (denoiseState !== "running" || caseName === "running") return
    const t = window.setTimeout(() => setDenoiseState("done"), 2000)
    return () => window.clearTimeout(t)
  }, [denoiseState, caseName])

  /** 편집 한 단계 — 이력 끝에 한 줄 더하고 알림 */
  const edited = (message: string, label: string) => {
    setHistory((h) => [...h, { no: h.length + 1, label, at: nowKst() }])
    toast.success(message)
  }

  return (
    <ImageEditScreen
      status={mock.status}
      errorAt={mock.errorAt}
      onRetry={() => go("/dev/s03", { case: "ready" })}
      isAdmin={viewer.isAdmin}
      features={viewer.features}
      showPlus={plus}
      inWindow={inWindow}
      onPlusAction={notReady}
      aprthngNo={imageNo}
      originalSize={S03_ORIGINAL_SIZE}
      canvasSlot={<FakeCanvas tool={activeTool} rotate={rotation} photoSrc={photoSrc} binarySrc={binarySrc} plus={plus} />}
      zoom={zoom}
      onZoomChange={setZoom}
      rotateStep={rotateStep}
      onRotateStepChange={setRotateStep}
      onRotate={(dir) => setRotation((r) => Number((r + (dir === "left" ? -rotateStep : rotateStep)).toFixed(1)))}
      onFit={() => setZoom(25)}
      onActualSize={() => setZoom(100)}
      activeTool={activeTool}
      onToolChange={setActiveTool}
      thresholdMode={thresholdMode}
      onThresholdModeChange={setThresholdMode}
      threshold={threshold}
      onThresholdChange={setThreshold}
      onApplyThreshold={() => edited(`이진화를 적용했습니다(임계값 ${threshold}).`, `이진화(임계값 ${threshold})`)}
      onApplyCalibration={() => edited("4점 각도보정을 적용했습니다.", "4점 각도 보정")}
      onApplyPolygon={(tool) =>
        tool === "background" ? edited("배경을 지웠습니다.", "배경제거") : edited("장애물을 지웠습니다.", "접합장애물제거")
      }
      measureCm={S03_MEASURE_CM}
      denoiseState={denoiseState}
      onRunDenoise={() => {
        setDenoiseState("running")
        toast("노이즈제거를 시작했습니다(진열용).")
      }}
      canUndo={history.length > 0}
      onUndo={() => {
        setHistory((h) => h.slice(0, -1))
        toast("한 단계 되돌렸습니다.")
      }}
      onUndoTo={(no) => {
        setHistory((h) => h.filter((e) => e.no <= no))
        toast(no === 0 ? "받은 원본까지 되돌렸습니다." : `${no}단계까지 되돌렸습니다.`)
      }}
      onRestore={() => {
        setRotation(S03_TILT)
        setHistory([])
        toast("원본으로 되돌렸습니다.")
      }}
      onCancel={() => go("/dev/s02")}
      onConfirm={() => {
        setRotation(0)
        edited("자르기 · 회전을 확정했습니다.", "자르기 · 회전 확정")
      }}
      onSave={() => {
        toast.success("편집 이미지를 저장했습니다.")
        go("/dev/s04")
      }}
      viewerImage={{ src: viewerSrc, alt: `${imageNo} 사건 이미지${fakeNote}` }}
      adjustments={adjustments}
      onAdjustmentsChange={setAdjustments}
      onClose={() => go("/dev/s02")}
      // ── 시안 r2 신규(+α) ──
      canvasTags={S03_CANVAS_TAGS}
      recommendFlip
      aiSuggestions={S03_AI_SUGGESTIONS}
      onApplyAiSuggestion={(id) => {
        if (id !== "tilt") return notReady(S03_AI_SUGGESTIONS.find((s) => s.id === id)?.title ?? id)
        edited("AI 제안대로 기울기를 맞췄습니다.", `기울기 맞추기 ${deg(rotation)} → 0°`)
        setRotation(0)
      }}
      // 실제 사진이면 편집본 = 이진화본(가짜 그림은 뒤집은 그림으로 차이를 보였다)
      beforeAfter={{ original: photoSrc, edited: hasSamplePhotos ? binarySrc : viewerSrc }}
      editHistory={history}
      originalHash={S03_HASH}
      viewerLabel={S03_VIEWER_LABEL}
      foundImage={{ src: foundSrc, alt: "발견 이미지 305659 밑창", label: S03_FOUND_LABEL }}
      onReextractFromView={() => {
        toast("보이는 그대로 AI 문양 추출을 다시 돌립니다(진열용 — 저장 안 함).")
        go("/dev/s04")
      }}
    />
  )
}

export interface S03ContentProps {
  devCase: S03Case
  /** 편집하는 이미지 번호(`<감정번호>_<n>`, 없으면 시안 값) */
  imageNo?: string
  /** 화면 옮기기(없으면 진열 주소 이동) — 사건 창은 탭 바꾸기로 받는다 */
  go?: DevGo
  /** 사건 창 안(11/17) — 1차 편집만 · 높이 꽉 · 겹치는 제목 줄 없음(위젯 `inWindow`) */
  inWindow?: boolean
}

/** S03 틀 없는 내용 — 진열 페이지와 사건 창(「이미지 편집」 탭)이 같이 쓴다 */
export function S03Content({ devCase, imageNo = S03_APRTHNG_NO, go, inWindow }: S03ContentProps) {
  return <S03Stage key={devCase} caseName={devCase} imageNo={imageNo} go={go} inWindow={inWindow} />
}

// S03 이미지 편집 진열 페이지 — 정본 위젯에 가짜 값 · 이동 콜백만 넘긴다.
export function S03DevPage() {
  const caseName = useDevCase(SCREEN_CASES.s03, "ready")
  return (
    <DevScreenFrame screen={info.screen} title={info.title} cases={info.cases}>
      <S03Content devCase={caseName} />
    </DevScreenFrame>
  )
}
