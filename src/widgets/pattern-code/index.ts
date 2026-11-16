// S04 문양 코딩 · 검색 조건 위젯 배럴 — 진열 페이지와 나중 운영 페이지가 함께 가져온다.
export { PatternCodeScreen } from "./ui/PatternCodeScreen"
export { HISTORY_COLUMNS, filterHistory } from "./model/history-view"
export { MATCH_OPTIONS, PALETTE_KINDS, PATTERN_COUNTS, patternName, ZONE_ROWS } from "./model/constants"
// 좌표 캔버스(PatternCanvas 자리)에 얹는 고정 장식(pointer-events-none, 공용 부품 아님 — spec §6-1)
export { BoundaryLines, PriceTagBox, RoiBox, ZoneConfidenceTags, type ZoneConfidenceTag } from "./ui/decorations"
// 문양 가중치 룰베이스 · 문양 점수(spec 2026-11-17-pattern-weight-rule-design) — 진열 페이지의 가짜 검색도 같은 식을 쓴다
export { patternWeights, WEIGHT_LABEL, WEIGHT_VALUE, type PatternWeight, type PatternWeightMap } from "./model/weight-rules"
export {
  patternScore,
  queryOfRun,
  rankShoes,
  runSnapshot,
  scoreOf,
  searchQuery,
  type PatternScoreResult,
  type QueryPattern,
  type ShoePatterns,
} from "./model/match-score"
export type {
  SearchRun,
  SearchRunHit,
  SearchRunPattern,
  WeightLevel,
  WeightOverrideMap,
  CrimePatternTuple,
  CrimeZones,
  ExtractedPatternView,
  ExtractState,
  FunnelStep,
  ImageCodingStatus,
  ImageProgress,
  MatchConditionValues,
  PaletteKind,
  PatternCardMeta,
  PatternCardStatus,
  PatternCodeScreenProps,
  PatternCount,
  PatternMetaMap,
  ResearchState,
  SearchHistoryRow,
  SearchImageSource,
  SearchMethod,
} from "./model/types"
