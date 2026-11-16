// S04 문양 코딩 · 검색 조건 위젯 배럴 — 진열 페이지와 나중 운영 페이지가 함께 가져온다.
export { PatternCodeScreen } from "./ui/PatternCodeScreen"
export { PALETTE_KINDS, ZONE_ROWS } from "./model/constants"
// 좌표 캔버스(PatternCanvas 자리)에 얹는 고정 장식(pointer-events-none, 공용 부품 아님 — spec §6-1)
export { BoundaryLines, RoiBox } from "./ui/decorations"
export type {
  CrimePatternTuple,
  CrimeZones,
  ExtractedPatternView,
  ExtractState,
  PaletteKind,
  PatternCodeScreenProps,
  SearchImageSource,
} from "./model/types"
