import * as React from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import type { ThresholdMode } from "@/shared/lib"
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
  type ImageEditTool,
  type PctPoint,
  type ViewAdjustments,
} from "@/widgets/image-edit"

import { DEV_SCREENS, DevScreenFrame, useDevCase, useDevViewer } from "../frame"
import { FakePhoto, fakePhotoUrl } from "../mock-assets/FakePhoto"
import {
  S03_APRTHNG_NO,
  S03_CASES,
  S03_CROP_LABEL,
  S03_MEASURE_CM,
  S03_MOCK,
  S03_ORIGINAL_SIZE,
  S03_TILT,
  type S03Case,
} from "./mock-cases"

const info = DEV_SCREENS.find((s) => s.id === "s03")!

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
function FakeCanvas({ tool, rotate, photoSrc }: { tool: ImageEditTool | null; rotate: number; photoSrc: string }) {
  return (
    <>
      <div className="absolute top-[58px] bottom-[34px] left-1/2 aspect-[2/3] -translate-x-1/2">
        <FakePhoto rotate={rotate} look={tool === "threshold" ? "binary" : "raw"} preserveAspectRatio="xMidYMid meet" />
        {tool === "crop" ? (
          <CropFrame rect={{ left: 21, right: 21, top: 3, bottom: 3 }} sizeLabel={S03_CROP_LABEL}>
            <RotateHandle label={`${rotate}° → 0°`.replace("-", "−")} />
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

function S03Stage({ caseName }: { caseName: S03Case }) {
  const mock = S03_MOCK[caseName]
  const viewer = useDevViewer()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const as = params.get("as")
  const go = (path: string, extra: Record<string, string> = {}) => {
    const q = new URLSearchParams(extra)
    if (as) q.set("as", as)
    const s = q.toString()
    navigate(s ? `${path}?${s}` : path)
  }

  const [zoom, setZoom] = React.useState(100)
  const [rotation, setRotation] = React.useState(S03_TILT)
  const [rotateStep, setRotateStep] = React.useState(1)
  const [activeTool, setActiveTool] = React.useState<ImageEditTool | null>(mock.activeTool)
  const [thresholdMode, setThresholdMode] = React.useState<ThresholdMode>("standard")
  const [threshold, setThreshold] = React.useState(127)
  const [denoiseState, setDenoiseState] = React.useState<DenoiseState>(mock.denoiseState)
  const [undoCount, setUndoCount] = React.useState(mock.undoCount)
  const [adjustments, setAdjustments] = React.useState<ViewAdjustments>(DEFAULT_VIEW_ADJUSTMENTS)

  const photoSrc = React.useMemo(() => fakePhotoUrl({ rotate: S03_TILT, tag: "" }), [])
  const viewerSrc = React.useMemo(() => fakePhotoUrl({ rotate: 0, flip: true, tag: "" }), [])

  // 진열용: 노이즈제거를 누르면 잠시 뒤 끝난 모양으로(running 케이스는 계속 도는 모양을 보여 준다)
  React.useEffect(() => {
    if (denoiseState !== "running" || caseName === "running") return
    const t = window.setTimeout(() => setDenoiseState("done"), 2000)
    return () => window.clearTimeout(t)
  }, [denoiseState, caseName])

  const edited = (message: string) => {
    setUndoCount((n) => n + 1)
    toast.success(message)
  }

  return (
    <ImageEditScreen
      status={mock.status}
      errorAt={mock.errorAt}
      onRetry={() => go("/dev/s03", { case: "ready" })}
      isAdmin={viewer.isAdmin}
      features={viewer.features}
      aprthngNo={S03_APRTHNG_NO}
      originalSize={S03_ORIGINAL_SIZE}
      canvasSlot={<FakeCanvas tool={activeTool} rotate={rotation} photoSrc={photoSrc} />}
      zoom={zoom}
      onZoomChange={setZoom}
      rotateStep={rotateStep}
      onRotateStepChange={setRotateStep}
      onRotate={(dir) => setRotation((r) => r + (dir === "left" ? -rotateStep : rotateStep))}
      onFit={() => setZoom(25)}
      onActualSize={() => setZoom(100)}
      activeTool={activeTool}
      onToolChange={setActiveTool}
      thresholdMode={thresholdMode}
      onThresholdModeChange={setThresholdMode}
      threshold={threshold}
      onThresholdChange={setThreshold}
      onApplyThreshold={() => edited(`이진화를 적용했습니다(임계값 ${threshold}).`)}
      onApplyCalibration={() => edited("4점 각도보정을 적용했습니다.")}
      onApplyPolygon={(tool) => edited(tool === "background" ? "배경을 지웠습니다." : "장애물을 지웠습니다.")}
      measureCm={S03_MEASURE_CM}
      denoiseState={denoiseState}
      onRunDenoise={() => {
        setDenoiseState("running")
        toast("노이즈제거를 시작했습니다(진열용).")
      }}
      canUndo={undoCount > 0}
      onUndo={() => {
        setUndoCount((n) => Math.max(0, n - 1))
        toast("한 단계 되돌렸습니다.")
      }}
      onRestore={() => {
        setRotation(S03_TILT)
        setUndoCount(0)
        toast("원본으로 되돌렸습니다.")
      }}
      onCancel={() => go("/dev/s02")}
      onConfirm={() => {
        setRotation(0)
        edited("자르기 · 회전을 확정했습니다.")
      }}
      onSave={() => {
        toast.success("편집 이미지를 저장했습니다.")
        go("/dev/s04")
      }}
      viewerImage={{ src: viewerSrc, alt: `${S03_APRTHNG_NO} 사건 이미지(가짜 예시)` }}
      adjustments={adjustments}
      onAdjustmentsChange={setAdjustments}
      onClose={() => go("/dev/s02")}
    />
  )
}

// S03 이미지 편집 진열 페이지 — 정본 위젯에 가짜 값 · 이동 콜백만 넘긴다.
export function S03DevPage() {
  const caseName = useDevCase(S03_CASES, "ready")
  return (
    <DevScreenFrame screen={info.screen} title={info.title} cases={S03_CASES}>
      <S03Stage key={caseName} caseName={caseName} />
    </DevScreenFrame>
  )
}
