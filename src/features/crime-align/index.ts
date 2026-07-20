export { AlignmentCaptureCanvas } from "./ui/AlignmentCaptureCanvas"
export { AlignmentGate } from "./ui/AlignmentGate"
export { useAlignment } from "./model/use-alignment"
export type { AlignmentPhase, ArrowStep, DrawMode, UseAlignment } from "./model/use-alignment"
export {
  ARROW_POINTS,
  MIN_POLYGON_POINTS,
  computeScale,
  isAlignmentComplete,
  isArrowComplete,
  isPolygonClosable,
  moveVertex,
  serializePoints,
  toDisplayFromSaved,
  toDisplayPoint,
  toDisplayPolygon,
  toSavedPoint,
  toSavedPolygon,
  translatePolygon,
} from "./lib/alignment-geometry"
export type { Point, RectLike } from "./lib/alignment-geometry"
export { sceneImageUrl } from "./lib/scene-image-url"
export { createSoleTemplatePolygon } from "./lib/sole-template"
