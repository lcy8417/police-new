export {
  PATTERNS_ROOT,
  insertPatternPath,
  stripPatternPath,
} from "./model/pattern";
export type { EssentialFlag, PatternEntry, PatternZone } from "./model/pattern";

// 문양 표시 부품(11/17 — 문양 코드 탭 · 신발 편집이 같이 쓴다). 값 · 콜백만 받는다
export {
  PATTERN_DRAG_AI_FORMAT,
  PATTERN_DRAG_FORMAT,
  dropOrigin,
  PATTERN_WEIGHT_LEVELS,
  PATTERN_ZONES,
} from "./model/view";
export type {
  PatternInsertOrigin,
  PatternCardStatus,
  PatternCardView,
  PatternLibraryItem,
  PatternLibraryTab,
  PatternWeightLevel,
  PatternWeightView,
  PatternZoneCards,
} from "./model/view";
export { PatternZoneBoard, type PatternZoneBoardProps } from "./ui/PatternZoneBoard";
export { PatternLibrary, type PatternLibraryProps } from "./ui/PatternLibrary";
export { PatternPeek, type PatternPeekLens, type PatternPeekProps } from "./ui/PatternPeek";
