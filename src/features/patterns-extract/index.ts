export { usePatternManager } from "./model/use-pattern-manager";
export { PatternCanvas } from "./ui/PatternCanvas";
export { PatternZones } from "./ui/PatternZones";
export { PatternPalette } from "./ui/PatternPalette";
export {
  ExtractedPatternList,
  type ExtractedPatternItem,
} from "./ui/ExtractedPatternList";
// B 단계 묶음 ① — 실행 번호 헤더 추출(C3) · 문양 메타 저장(C2) · 이름 기준 문양 조작
export {
  ExtractError,
  extractCrimeWithRun,
  extractShoeWithRun,
  runIdOf,
} from "./api/extract-with-run";
export type { CrimeExtractResult, ExtractedItem, ShoeExtractResult, ShoeExtractZones } from "./api/extract-with-run";
export { savePatterns, useSavePatterns } from "./api/use-save-patterns";
export type { CardMetaBody, SavePatternsBody, SavePatternsResult } from "./api/use-save-patterns";
export {
  PATTERN_ZONES,
  hasPattern,
  insertPattern,
  nameOf,
  removePattern,
  toggleEssential,
  type CrimeTuple,
  type CrimeZoneMap,
} from "./model/pattern-ops";
export {
  LINE_HIT_THRESHOLD,
  isNearAnyLine,
  moveLine,
  pickDraggableLine,
} from "./lib/line-geometry";
