// viewer 출입구: 이미지·캔버스를 보여주는 뷰어 부품이 들어옵니다(설계서 §6).
export { EvidenceImage, type EvidenceImageProps, type EvidenceLook } from "./EvidenceImage"
export { SoleThumb, type SoleThumbProps, type SoleThumbSize } from "./SoleThumb"
export { PatternIcon, type PatternIconProps, type PatternIconSize } from "./PatternIcon"
export { ZoneBands, type ZoneBand, type ZoneBandsProps } from "./ZoneBands"
export { CompareView, type CompareMode, type CompareViewProps } from "./CompareView"
export { PointPairs, type PointPairBox, type PointPairsProps } from "./PointPairs"
export { HeatOverlay, type HeatOverlayProps, type HeatVariant } from "./HeatOverlay"
// 공용 확대경 · 보기 조정 · 크게 살펴보기(11/17 — 문양 코드 · 검색 결과 · 정밀 대조 · 신발 DB 가 함께 쓴다)
export { LensBox, type LensBoxProps, type LensSpot } from "./LensBox"
// 확대 보기 칸(11/17 — 확대경이 보는 자리를 고정 칸에 같은 배율로)
export { LensView, type LensViewProps } from "./LensView"
export { ViewControls, type ViewControlsProps } from "./ViewControls"
export { InspectFrame, type InspectFrameProps } from "./InspectFrame"
export {
  DEFAULT_LENS,
  DEFAULT_VIEW_TUNE,
  GAMMA_VALUE,
  isViewTuned,
  LENS_DEFAULT,
  LENS_MAX,
  LENS_MIN,
  LENS_STEP,
  LENS_ZOOMS,
  lensOffset,
  rotateTune,
  stepLens,
  stepTune,
  viewTuneClass,
  viewTuneLabels,
  type LensSettings,
  type LensZoom,
  type TuneRotate,
  type TuneStep,
  type ViewTune,
} from "./view-tune"
