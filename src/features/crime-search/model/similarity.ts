/**
 * 강화된 `POST /crime/:crimeNumber/similarity` 응답 계약(족적↔신발 국소 대응).
 *
 * ⚠ 이미지 처리 API(`services/api.js`)는 camelCase 변환을 하지 않으므로(→
 * `docs/api-communication.md` §2B), 이 응답의 필드는 **서버 원형 snake_case를 그대로**
 * 유지한다(기존 `query_attn_map`과 일관). 좌표 계약은 아래 §좌표 주석 참조 — 순수
 * 스케일 함수는 `../lib/match-geometry.ts`에 격리해 vitest로 검증한다.
 */

/** 한 이미지(족적 질의 / 신발 참조)의 data-uri + 원본 픽셀 크기. `size=[height, width]` 순서. */
export interface SimilarityImage {
  /** base64 data-uri(예 `data:image/png;base64,...`). */
  image: string
  /** 원본 픽셀 크기 `[height, width]`. 좌표 스케일의 분모라 순서가 치명적이다. */
  size: [number, number]
}

/**
 * 국소 대응 한 건. `query_*`는 `query.size`, `ref_*`는 `ref.size` 기준 픽셀 좌표다.
 * 두 이미지 크기가 다를 수 있어, 화면에서 높이를 맞추면 좌표도 같은 배율로 스케일해야
 * 핀이 어긋나지 않는다(→ `scalePoint`/`scaleBbox`).
 */
export interface SimilarityMatch {
  /** 1-based 대응 번호(핀·배지·색 인덱스). */
  index: number
  /** 코사인 유사도(0~1). 선 굵기·불투명도·배지에 쓰인다. IoU와 합산 금지. */
  score: number
  /** 족적(query.size) 위 대응점 `[x, y]`. */
  query_point: [number, number]
  /** 신발(ref.size) 위 대응점 `[x, y]`. */
  ref_point: [number, number]
  /** 족적 줌 크롭 영역 `[x, y, w, h]`(query.size 기준). */
  query_bbox: [number, number, number, number]
  /** 신발 줌 크롭 영역 `[x, y, w, h]`(ref.size 기준). */
  ref_bbox: [number, number, number, number]
  /** 족적 줌 패치(data-uri). */
  query_patch: string
  /** 신발 줌 패치(data-uri). */
  ref_patch: string
  /** 족적 Canny 에지 패치(edge=true일 때). */
  query_patch_edge?: string
  /** 신발 Canny 에지 패치(edge=true일 때). */
  ref_patch_edge?: string
  /** 족적 국소 이진 패치. */
  query_patch_binary?: string
  /** 정렬 겹침(verify=true): 빨=query·초=ref·노랑=일치. */
  align_overlay?: string
  /** 구조적 IoU(0~1). 코사인 score와 별개 축으로 병기(합산 금지). */
  structural_iou?: number
  /** 정렬 전 단순 IoU(참고). */
  structural_iou_naive?: number
  /** 정렬 스케일 배율. */
  align_scale?: number
  /** 참조 연결요소 수. */
  ref_components?: number
  /** 족적 전경 픽셀 비율. */
  query_fg?: number
  /** 참조 전경 픽셀 비율. */
  ref_fg?: number
  /** 참조 최대 연결요소 면적 비율. */
  ref_largest_frac?: number
  /** 유효(정보성) 대응 여부. false면 회색·"검토 필요" 처리. */
  informative?: boolean
  /** 비유효 사유 목록(있으면 검토 필요 배지에 노출). */
  uninformative_reasons?: string[]
}

/**
 * `/similarity` 강화 응답. `matches`가 없거나 비면 폴백(구버전 attn_map 히트맵 또는
 * 원본 이미지)로 안전하게 렌더한다.
 */
export interface SimilarityResponse {
  /** 족적(질의) 컬러 이미지. */
  query?: SimilarityImage
  /** 신발(참조) 이진 이미지. */
  ref?: SimilarityImage
  /** score 내림차순 국소 대응 목록. */
  matches?: SimilarityMatch[]
  /** 구버전 응답 호환: 질의 어텐션 히트맵. */
  query_attn_map?: string | null
  /** 구버전 응답 호환: 참조 어텐션 히트맵. */
  ref_attn_map?: string | null
}

/**
 * 대응 번호(index)별 강조 색 팔레트 — 좌우 핀·연결선·행 배지가 같은 색을 공유해
 * "이 핀이 이 행" 임을 색으로 잇는다. forensic 다크 톤에서 서로 판별 가능한 6색으로
 * 고르되, 필수 문양 레드(`#EF4444`)와는 겹치지 않게 했다.
 */
export const MATCH_COLORS = [
  "#4A9EFF", // blue
  "#2DD4BF", // teal
  "#F59E0B", // amber
  "#A78BFA", // violet
  "#F472B6", // pink
  "#4ADE80", // green
] as const

/** 1-based 대응 번호를 팔레트 색으로 매핑(6색 순환). */
export function matchColor(index: number): string {
  const n = Math.max(1, Math.round(index || 1))
  return MATCH_COLORS[(n - 1) % MATCH_COLORS.length]
}
