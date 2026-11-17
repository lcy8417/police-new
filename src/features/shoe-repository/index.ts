// 신발 검수 · 분업(B 단계 묶음 ④) — 문양 입력(J6) · 승인(J7) · AI 문양 추출 · 밑창 그림 읽기/돌리기 · 문양 사전
export { approveShoe, saveShoePatterns } from "./api/shoe-duty-api"
export type { ShoeApproveResult, ShoeZoneNames } from "./api/shoe-duty-api"
export {
  SHOE_EXTRACT_LINE_YS,
  SHOE_EXTRACT_RENDER_SIZE,
  extractShoePatterns,
  normalizeShoeExtract,
  shoeExtractImage,
} from "./api/extract-shoe-patterns"
export type { ShoeExtractResult, ShoeExtractZone } from "./api/extract-shoe-patterns"
export { readSoleFile, rotateSoleImage } from "./lib/sole-image"
export { SHOE_PATTERN_LIBRARY, buildPatternLibrary } from "./model/pattern-library"
