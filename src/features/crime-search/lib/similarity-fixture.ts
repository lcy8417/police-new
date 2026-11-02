/**
 * 아티팩트 계약 예시 기반 목 `SimilarityResponse`. 백엔드 강화 스키마가 미배포라
 * 개발·검증용으로 쓴다. 실이미지 대신 작은 인라인 SVG data-uri로 족적/신발 이미지와
 * 줌 패치를 흉내낸다(핀·연결선·패치·IoU 미터가 실제로 렌더되는지 확인용).
 *
 * ⚠ **프로덕션 경로엔 절대 새지 않게** 한다 — 이 모듈은 오직 `MatchViewer`에 prop으로
 * 명시 주입될 때만 쓰이고, 실서버 응답이 우선한다(→ `MatchViewer.tsx`의 fixture 주입은
 * dev 편의용 opt-in). 실호출(`fetchSimilarity`)이 항상 우선.
 */

import type { SimilarityMatch, SimilarityResponse } from "../model/similarity"

/** SVG 문자열 → data-uri(외부 자산 없이 인라인 렌더). */
function svg(w: number, h: number, inner: string): string {
  const raw = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>`
  return `data:image/svg+xml,${encodeURIComponent(raw)}`
}

// 족적(질의): 세로형 컬러 실루엣 + 특징 도형 3개(대응점 자리). 200x400.
const QUERY_W = 200
const QUERY_H = 400
const queryImage = svg(
  QUERY_W,
  QUERY_H,
  `<rect width="${QUERY_W}" height="${QUERY_H}" fill="#0B121D"/>` +
    `<rect x="34" y="18" width="132" height="364" rx="60" fill="#122033" stroke="#24405e" stroke-width="2"/>` +
    `<circle cx="80" cy="90" r="16" fill="#3d6fa8"/>` +
    `<rect x="108" y="176" width="40" height="40" rx="6" fill="#3d6fa8" transform="rotate(18 128 196)"/>` +
    `<path d="M70 300 l30 -18 l30 18 l-30 18 z" fill="#3d6fa8"/>`
)

// 신발(참조): Shoerinsics 이진 톤. 살짝 다른 크기 180x360(상이 크기 검증용).
const REF_W = 180
const REF_H = 360
const refImage = svg(
  REF_W,
  REF_H,
  `<rect width="${REF_W}" height="${REF_H}" fill="#05080D"/>` +
    `<rect x="28" y="14" width="124" height="332" rx="56" fill="#0d1622" stroke="#1E2A3C" stroke-width="2"/>` +
    `<circle cx="72" cy="80" r="15" fill="#cbd5e1"/>` +
    `<rect x="96" y="158" width="38" height="38" rx="6" fill="#cbd5e1" transform="rotate(18 115 177)"/>` +
    `<path d="M62 268 l28 -17 l28 17 l-28 17 z" fill="#cbd5e1"/>`
)

/** 작은 줌 패치(64x64) — 도형 + 배경. */
function patch(bg: string, shape: string): string {
  return svg(64, 64, `<rect width="64" height="64" fill="${bg}"/>${shape}`)
}
/** 에지(Canny) 패치 — 검정 배경 + 흰 외곽선. */
function edgePatch(shape: string): string {
  return svg(64, 64, `<rect width="64" height="64" fill="#000"/>${shape}`)
}
/** 정렬 겹침 패치 — 빨(query)·초(ref)·노랑(일치). */
function overlay(qShape: string, rShape: string, matchShape: string): string {
  return svg(
    64,
    64,
    `<rect width="64" height="64" fill="#05080D"/>` +
      `<g opacity="0.85">${qShape}</g><g opacity="0.85">${rShape}</g>${matchShape}`
  )
}

const matches: SimilarityMatch[] = [
  {
    index: 1,
    score: 0.91,
    query_point: [80, 90],
    ref_point: [72, 80],
    query_bbox: [56, 66, 48, 48],
    ref_bbox: [50, 58, 44, 44],
    query_patch: patch("#122033", `<circle cx="32" cy="32" r="18" fill="#4A9EFF"/>`),
    ref_patch: patch("#0d1622", `<circle cx="32" cy="32" r="17" fill="#cbd5e1"/>`),
    query_patch_edge: edgePatch(`<circle cx="32" cy="32" r="18" fill="none" stroke="#fff" stroke-width="2"/>`),
    ref_patch_edge: edgePatch(`<circle cx="32" cy="32" r="17" fill="none" stroke="#fff" stroke-width="2"/>`),
    align_overlay: overlay(
      `<circle cx="30" cy="32" r="18" fill="#EF4444"/>`,
      `<circle cx="34" cy="32" r="17" fill="#22C55E"/>`,
      `<circle cx="32" cy="32" r="12" fill="#FDE047"/>`
    ),
    structural_iou: 0.82,
    structural_iou_naive: 0.61,
    align_scale: 1.04,
    ref_components: 1,
    query_fg: 0.42,
    ref_fg: 0.4,
    ref_largest_frac: 0.96,
    informative: true,
    uninformative_reasons: [],
  },
  {
    index: 2,
    score: 0.76,
    query_point: [128, 196],
    ref_point: [115, 177],
    query_bbox: [104, 172, 48, 48],
    ref_bbox: [92, 154, 44, 44],
    query_patch: patch("#122033", `<rect x="16" y="16" width="32" height="32" rx="5" fill="#4A9EFF" transform="rotate(18 32 32)"/>`),
    ref_patch: patch("#0d1622", `<rect x="16" y="16" width="32" height="32" rx="5" fill="#cbd5e1" transform="rotate(18 32 32)"/>`),
    query_patch_edge: edgePatch(`<rect x="16" y="16" width="32" height="32" rx="5" fill="none" stroke="#fff" stroke-width="2" transform="rotate(18 32 32)"/>`),
    ref_patch_edge: edgePatch(`<rect x="16" y="16" width="32" height="32" rx="5" fill="none" stroke="#fff" stroke-width="2" transform="rotate(18 32 32)"/>`),
    align_overlay: overlay(
      `<rect x="14" y="16" width="32" height="32" rx="5" fill="#EF4444" transform="rotate(18 30 32)"/>`,
      `<rect x="18" y="16" width="32" height="32" rx="5" fill="#22C55E" transform="rotate(18 34 32)"/>`,
      `<rect x="20" y="20" width="24" height="24" rx="4" fill="#FDE047" transform="rotate(18 32 32)"/>`
    ),
    structural_iou: 0.58,
    structural_iou_naive: 0.44,
    align_scale: 0.97,
    ref_components: 1,
    query_fg: 0.36,
    ref_fg: 0.35,
    ref_largest_frac: 0.9,
    informative: true,
    uninformative_reasons: [],
  },
  {
    index: 3,
    score: 0.39,
    query_point: [100, 300],
    ref_point: [90, 268],
    query_bbox: [76, 276, 48, 48],
    ref_bbox: [66, 244, 44, 44],
    query_patch: patch("#122033", `<path d="M14 40 l18 -12 l18 12 l-18 12 z" fill="#4A9EFF"/>`),
    ref_patch: patch("#0d1622", `<path d="M14 40 l18 -12 l18 12 l-18 12 z" fill="#cbd5e1"/>`),
    query_patch_edge: edgePatch(`<path d="M14 40 l18 -12 l18 12 l-18 12 z" fill="none" stroke="#fff" stroke-width="2"/>`),
    ref_patch_edge: edgePatch(`<path d="M14 40 l18 -12 l18 12 l-18 12 z" fill="none" stroke="#fff" stroke-width="2"/>`),
    align_overlay: overlay(
      `<path d="M12 40 l18 -12 l18 12 l-18 12 z" fill="#EF4444"/>`,
      `<path d="M16 40 l18 -12 l18 12 l-18 12 z" fill="#22C55E"/>`,
      `<path d="M22 38 l10 -7 l10 7 l-10 7 z" fill="#FDE047"/>`
    ),
    structural_iou: 0.21,
    structural_iou_naive: 0.18,
    align_scale: 1.12,
    ref_components: 4,
    query_fg: 0.19,
    ref_fg: 0.52,
    ref_largest_frac: 0.31,
    informative: false,
    uninformative_reasons: ["참조 조각 과다(연결요소 4개)", "구조 IoU 낮음"],
  },
]

/** 아티팩트 계약 예시 기반 목 응답(3 대응, 마지막은 비유효). */
export const SIMILARITY_FIXTURE: SimilarityResponse = {
  query: { image: queryImage, size: [QUERY_H, QUERY_W] },
  ref: { image: refImage, size: [REF_H, REF_W] },
  matches,
}
