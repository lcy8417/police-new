// S04 문양 코딩 · 검색 조건 위젯 배럴 — 진열 페이지와 나중 운영 페이지가 함께 가져온다.
export { PatternCodeScreen } from "./ui/PatternCodeScreen"
export { HISTORY_COLUMNS, filterHistory } from "./model/history-view"
export { MATCH_OPTIONS, PALETTE_KINDS, PATTERN_COUNTS, patternName, ZONE_ROWS } from "./model/constants"
// 좌표 캔버스(PatternCanvas 자리)에 얹는 고정 장식(pointer-events-none, 공용 부품 아님 — spec §6-1)
export { BoundaryLines, PriceTagBox, RoiBox, ZoneConfidenceTags, type ZoneConfidenceTag } from "./ui/decorations"
export type {
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
