import { insertPatternPath } from "@/entities/pattern"
import type { ImageSearchResultItem, SearchInsight, SearchTarget } from "@/widgets/search-result"

import type { Zone, ZoneTriple } from "../mock-assets/fake-art"

// S05 검색 결과 진열용 가짜 값. 숫자는 시안 예시(857건 · 이미지번호 00001-25-0646_1)에 맞춘다.
// 유사도는 imageSearch 응답처럼 퍼센트(0~100), 한 건은 문자열로 온다(서버가 문자열로 줄 수도 있음).

export const S05_IMAGE_NO = "00001-25-0646_1"
export const S05_TOTAL = 857
export const S05_PAGE_SIZE = 20
export const S05_ERROR_AT = "17:41"
/** 시안 본 위치(136위 · 07-24 17:52)와 초점 카드(137위) */
export const S05_SEEN_UP_TO = 136
export const S05_SEEN_AT = "07-24 17:52"
export const S05_FOCUS_RANK = 137

/** 1쪽 고정 결과: 1위 00758(앞자리 0) · 2위 69.99(→ 70%) · 8자 신발 ID(긴 값) · 문자열 유사도 */
const FIRST_PAGE: readonly { ftwrId: string; similarity: number | string }[] = [
  { ftwrId: "00758", similarity: 84.12 },
  { ftwrId: "305659", similarity: 69.99 },
  { ftwrId: "281904", similarity: 66.4 },
  { ftwrId: "274466", similarity: 64.0 },
  { ftwrId: "SH-20251", similarity: 61.2 },
  { ftwrId: "301122", similarity: 61.0 },
  { ftwrId: "290318", similarity: 60.8 },
  { ftwrId: "288741", similarity: 60.7 },
  { ftwrId: "299310", similarity: 60.1 },
  { ftwrId: "306012", similarity: 59.9 },
  { ftwrId: "283377", similarity: 59.6 },
  { ftwrId: "00412", similarity: 59.0 },
  { ftwrId: "305102", similarity: 58.4 },
  { ftwrId: "288410", similarity: "58.1" },
  { ftwrId: "301877", similarity: 57.9 },
  { ftwrId: "02219", similarity: 57.6 },
  { ftwrId: "296450", similarity: 57.2 },
  { ftwrId: "303318", similarity: 57.0 },
  { ftwrId: "284905", similarity: 56.8 },
  { ftwrId: "300761", similarity: 56.5 },
]

/** r2: 시안 S05 빠른 비교 · 상세조회가 가리키는 137위(305102 · 58.4%) */
const FIXED_RANKS: Readonly<Record<number, { ftwrId: string; similarity: number }>> = {
  137: { ftwrId: "305102", similarity: 58.4 },
}

/** r3 빠른 찾기용 가짜 상표명(순위마다 돌려 씀 — 3 · 8 · 13 · 18위 = 크록스) */
export const MOCK_BRANDS = ["나이키", "아디다스", "크록스", "뉴발란스", "○○스포츠"] as const

/** 한 순위의 결과 */
function resultAt(rank: number, imageFor: (rank: number) => string): ImageSearchResultItem {
  const fixed = FIRST_PAGE[rank - 1] ?? FIXED_RANKS[rank]
  const ftwrId = fixed ? fixed.ftwrId : String((rank * 37) % 100000).padStart(5, "0")
  const similarity = fixed ? fixed.similarity : Math.round((56.5 - (rank - 20) * 0.018) * 100) / 100
  return { ftwrId, similarity, image: imageFor(rank), brandNm: MOCK_BRANDS[(rank - 1) % MOCK_BRANDS.length] }
}

/** 쪽(1부터)의 결과. 이미지 URL 은 rank 로 고른 그림을 받는 함수가 정한다 */
export function makeResults(page: number, imageFor: (rank: number) => string): ImageSearchResultItem[] {
  const first = (page - 1) * S05_PAGE_SIZE + 1
  const last = Math.min(S05_TOTAL, first + S05_PAGE_SIZE - 1)
  const out: ImageSearchResultItem[] = []
  for (let rank = first; rank <= last; rank++) out.push(resultAt(rank, imageFor))
  return out
}

// ── 사건 창(11/17) — 1위부터 이어진 한 목록 · 부위 일치 · 고른 문양 ─────────────

/** 사건 창 목록 처음 길이 · 한 번에 더 붙이는 길이(이어 보기 137위 · 확인대상 140위가 처음부터 들게) */
export const S05_WINDOW_FIRST = 160
export const S05_WINDOW_STEP = 80

/** 진열 그림 무늬 → 문양 이름(가짜 대응 — 빠른 비교 문양 줄용) */
const ART_PATTERN: Record<Zone, string> = {
  herring: "n32_04",
  grid: "n51_03",
  blocks: "n52_01",
  lines: "n31_02",
  dots: "n71_01",
  wave: "n21_05",
  tri: "n41_01",
}

/** 문양 코드 탭에서 고른 문양(S04 ready 와 같은 값 — 상 · 중 n32_04 필수) — 이름 · 필수 */
export const S05_QUERY_PATTERNS: readonly { zone: string; patterns: readonly (readonly [string, boolean])[] }[] = [
  { zone: "상", patterns: [["n32_04", true], ["n21_05", false]] },
  { zone: "중", patterns: [["n32_04", true], ["s81b", false]] },
  { zone: "하", patterns: [["n32_04", false]] },
]

const WHY_HIT = ["주기 · 각도 비슷", "간격 일치 · 가장자리 마모", "배열 · 굵기 비슷"]
const WHY_MISS = ["문양 종류 다름", "간격 차이 큼", "마모로 판단 어려움"]

/** 순위 · 그림 무늬로 부위 점수와 후보 문양(가짜 — 고른 문양과 겹치면 일치 점수가 높다) */
export function zoneInfo(rank: number, zones: ZoneTriple): Pick<ImageSearchResultItem, "zoneScores" | "zonePatterns"> {
  const names = ["상", "중", "하"] as const
  return {
    zoneScores: names.map((zone, i) => {
      const cand = ART_PATTERN[zones[i]]
      const hit = S05_QUERY_PATTERNS[i].patterns.some(([n]) => n === cand)
      const wobble = ((rank * 7 + i * 13) % 17) - 8
      const score = Math.max(12, Math.min(96, (hit ? 74 : 38) + wobble - Math.floor(rank / 60)))
      return { zone, score, why: `${hit ? WHY_HIT[(rank + i) % 3] : WHY_MISS[(rank + i) % 3]}` }
    }),
    zonePatterns: names.map((zone, i) => ({ zone, name: ART_PATTERN[zones[i]] })).map(({ zone, name }) => ({
      zone,
      patterns: [{ name, src: insertPatternPath(name) as string }],
    })),
  }
}

/** 사건 창 목록: 1위부터 count 위까지(그림 · 부위 무늬는 순위로 고른다) */
export function makeRange(
  count: number,
  imageFor: (rank: number) => string,
  zonesFor: (rank: number) => ZoneTriple,
): ImageSearchResultItem[] {
  const out: ImageSearchResultItem[] = []
  for (let rank = 1; rank <= Math.min(count, S05_TOTAL); rank++) out.push({ ...resultAt(rank, imageFor), ...zoneInfo(rank, zonesFor(rank)) })
  return out
}

// ── r2 +α(시안 r3) 가짜 값 ─────────────────────────────────────────────

/** 시안 TOP 10(AI가 먼저 보라는 10건) — 순위 · 신발 ID · 유사도 · 무늬 · 근거 · 본 것 */
export const AI_TOP: readonly { rank: number; ftwrId: string; similarity: number; zones: ZoneTriple; why: string; seen: boolean }[] = [
  { rank: 1, ftwrId: "305657", similarity: 61.2, zones: ["dots", "herring", "grid"], why: "상·중 헤링본 주기 일치", seen: true },
  { rank: 2, ftwrId: "281904", similarity: 61.0, zones: ["herring", "lines", "blocks"], why: "중 헤링본 · 하 다름", seen: true },
  { rank: 3, ftwrId: "305659", similarity: 60.8, zones: ["herring", "herring", "grid"], why: "상·중·하 모두 비슷", seen: true },
  { rank: 4, ftwrId: "274466", similarity: 60.7, zones: ["tri", "herring", "grid"], why: "중 헤링본 · 윤곽 일치", seen: true },
  { rank: 5, ftwrId: "301122", similarity: 60.1, zones: ["herring", "dots", "herring"], why: "상 헤링본 각도 차이", seen: true },
  { rank: 6, ftwrId: "290318", similarity: 59.9, zones: ["grid", "herring", "blocks"], why: "중만 일치", seen: false },
  { rank: 7, ftwrId: "288741", similarity: 59.6, zones: ["herring", "grid", "herring"], why: "상·하 헤링본", seen: false },
  { rank: 8, ftwrId: "299310", similarity: 59.0, zones: ["wave", "herring", "grid"], why: "중 헤링본 · 하 격자", seen: false },
  { rank: 9, ftwrId: "306012", similarity: 58.9, zones: ["herring", "herring", "lines"], why: "상·중 일치 · 하 마모", seen: false },
  { rank: 10, ftwrId: "283377", similarity: 58.7, zones: ["blocks", "herring", "herring"], why: "중·하 헤링본", seen: false },
]

/** 시안 유사도 분포(순위 1–857 을 43칸으로): 앞은 높고 뒤로 갈수록 낮다 */
export function distributionBins(n = 43): number[] {
  return Array.from({ length: n }, (_, i) => 72 - 22 * Math.pow(i / (n - 1), 0.55) - (i < 2 ? 0 : 3 * Math.sin(i * 1.7) * (i / n)))
}

/** 처음 확인대상: 시안 「3위 305659 · 140위 305102」 → 이 진열의 1쪽 데이터에서 305659 는 2위라 그 순위로, 140위는 그 자리 신발 */
export const INITIAL_TARGETS: readonly SearchTarget[] = [
  { rank: 2, ftwrId: "305659" },
  { rank: 140, ftwrId: "05180" },
]

/** 상세조회 칸 신발정보(시안 S05 info) */
export const DETAIL_INFO: readonly (readonly [string, string])[] = [
  ["화류번호", "305102"],
  ["제조사", "(주)○○"],
  ["상표명", "기타"],
  ["모델번호", "—"],
  ["화종", "구두"],
  ["수집년도", "2021"],
  ["그룹명", "G-1182"],
]

/** +α 값 묶음. 그림 URL 은 진열 페이지가 만든다 */
export function makeInsight(img: {
  scene: string
  shoe: string
  side: string
  aiTop: (zones: ZoneTriple) => string
}): SearchInsight {
  return {
    searchNo: "572433",
    searchMethod: "이미지 검색",
    essentialSummary: "필수 문양 상·중 헤링본",
    searchedAt: "07-24 17:41",
    seenUpTo: S05_SEEN_UP_TO,
    seenAt: S05_SEEN_AT,
    focusRank: S05_FOCUS_RANK,
    rerankUp: { 130: 4, 138: 11, 142: 2 },
    distribution: distributionBins(),
    topSimilarity: 72,
    bottomSimilarity: 41,
    tailFrom: 300,
    aiTop: AI_TOP.map((t) => ({
      rank: t.rank,
      ftwrId: t.ftwrId,
      similarity: t.similarity,
      image: img.aiTop(t.zones),
      why: t.why,
      seen: t.seen,
      heat: t.rank <= 3,
    })),
    peek: {
      sceneImage: img.scene,
      zones: [
        { zone: "상", score: 71, why: "헤링본 각도·간격 비슷" },
        { zone: "중", score: 64, why: "헤링본 · 가장자리 마모" },
        { zone: "하", score: 39, why: "격자 vs 헤링본 — 다름" },
      ],
      caution: "하 부위 다름 → 확인대상 신중",
    },
    detail: {
      rank: 137,
      ftwrId: "305102",
      similarity: 58.4,
      crimeImage: img.scene,
      shoeImage: img.shoe,
      sideImage: img.side,
      info: DETAIL_INFO,
    },
    queryPatterns: S05_QUERY_PATTERNS.map(({ zone, patterns }) => ({
      zone,
      patterns: patterns.map(([name, essential]) => ({ name, src: insertPatternPath(name) as string, essential })),
    })),
  }
}
