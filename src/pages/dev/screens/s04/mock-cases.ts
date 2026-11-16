import type { EssentialFlag, PatternZone } from "@/entities/pattern"
import {
  patternWeights,
  rankShoes,
  runSnapshot,
  searchQuery,
  type ExtractState,
  type FunnelStep,
  type ImageCodingStatus,
  type MatchConditionValues,
  type PaletteKind,
  type PatternMetaMap,
  type SearchHistoryRow,
  type SearchImageSource,
  type SearchRun,
  type ShoePatterns,
  type WeightOverrideMap,
} from "@/widgets/pattern-code"

import type { SCREEN_CASES } from "../frame/dev-screens"
import { fakeSoleUrl } from "../mock-assets/FakeSole"

/** 신발 ID → 가짜 밑창 그림(검색 이력 썸네일 — 같은 ID 는 같은 그림, 한 번만 만든다) */
const SOLE_CACHE = new Map<string, string>()
const soleOf = (ftwrId: string) => {
  let url = SOLE_CACHE.get(ftwrId)
  if (!url) {
    url = fakeSoleUrl({ kind: "shoe", seed: (Number.parseInt(ftwrId, 10) % 7) + 1 })
    SOLE_CACHE.set(ftwrId, url)
  }
  return url
}

// S04 문양 코딩 · 검색 조건 진열 케이스. 숫자는 시안 예시값(감정물 00001-25-0649_2, 상 · 중 n32_04 필수, 점수 0.93 · 0.61 · 0.42 · 0.71).
// 서버처럼 문양은 「이름」으로 들고 있고, 진열 페이지가 insertPatternPath 로 경로를 붙여 위젯에 넘긴다(docs/pattern-data-model.md §3).
// 케이스 이름의 단일 출처는 frame/dev-screens.ts 의 SCREEN_CASES.
export type S04Case = (typeof SCREEN_CASES.s04)[number]

/** 서버 모양 그대로의 사건 문양 — `[이름, 필수 0/1]` */
export type NamedZones = Record<PatternZone, (readonly [string, EssentialFlag])[]>

export interface S04Mock {
  status: "ready" | "loading" | "error" | "empty"
  errorAt?: string
  extractState: ExtractState
  zones: NamedZones
  /** AI 통합 추출 결과(이름 · 점수) — services/api.js patternsExtract 응답 모양 */
  extracted: { code: string; score: number }[]
  history: SearchHistoryRow[]
  /** 문양 카드 덧붙임(AI · 제안 · 수동 · 확신도 · 개수) — 시안 r2 */
  meta: PatternMetaMap
}

// 시안 r3 문양 행 그대로: 상 n32_04(AI·확인, 필수, 0.93, 9개) · n21_05(제안 0.61) / 중 n32_04(AI·확인, 필수, 0.88) · s81b(제안? 0.42)
// / 하 n32_04(제안 0.71, 8개) / 윤곽 s10c(수동)
const READY_ZONES: NamedZones = {
  top: [
    ["n32_04", 1],
    ["n21_05", 0],
  ],
  mid: [
    ["n32_04", 1],
    ["s81b", 0],
  ],
  bottom: [["n32_04", 0]],
  outline: [["s10c", 0]],
}
const READY_META: PatternMetaMap = {
  top: {
    n32_04: { status: "ai", confidence: 0.93, count: "9" },
    n21_05: { status: "suggested", confidence: 0.61, count: "1" },
  },
  mid: {
    n32_04: { status: "ai", confidence: 0.88, count: "9" },
    s81b: { status: "suggested", confidence: 0.42, count: "1", doubtful: true },
  },
  bottom: { n32_04: { status: "suggested", confidence: 0.71, count: "8" } },
  outline: { s10c: { status: "manual", count: "1" } },
}
const EMPTY_ZONES: NamedZones = { top: [], mid: [], bottom: [], outline: [] }

const EXTRACTED = [
  { code: "n32_04", score: 0.93 },
  { code: "n21_05", score: 0.61 },
  { code: "n51_03", score: 0.71 },
  { code: "s81b", score: 0.42 },
]

// 이력: 시안 SCAS 열 값(검색번호 · 결과건수 · 검색방법 · 검색일 07-24) + 지금 기능 순위 · 매칭 신발.
// 신발 ID 는 문자열(앞자리 0 보존 — 00758), 매칭 없이 저장한 줄(null) 포함
const HISTORY: SearchHistoryRow[] = [
  { searchNo: 572433, frstRegistDt: "2025-07-24 10:12:05", ranking: 3, mtchgId: "00758", resultCount: 312, method: "이미지검색" },
  { searchNo: 572420, frstRegistDt: "2025-07-24 09:58:41", ranking: 12, mtchgId: "305659", resultCount: 512, method: "현장문양검색" },
  { searchNo: 572419, frstRegistDt: "2025-07-24 09:41:30", ranking: 0, mtchgId: null, resultCount: 869, method: "인공지능" },
]

export const S04_MOCK: Record<S04Case, S04Mock> = {
  ready: { status: "ready", extractState: "done", zones: READY_ZONES, extracted: EXTRACTED, history: HISTORY, meta: READY_META },
  running: { status: "ready", extractState: "running", zones: READY_ZONES, extracted: [], history: HISTORY, meta: READY_META },
  loading: { status: "loading", extractState: "idle", zones: EMPTY_ZONES, extracted: [], history: [], meta: {} },
  error: { status: "error", errorAt: "09:41", extractState: "idle", zones: EMPTY_ZONES, extracted: [], history: [], meta: {} },
  empty: { status: "empty", extractState: "idle", zones: EMPTY_ZONES, extracted: [], history: [], meta: {} },
}

/** 시안 이미지 목록 상태(_1 확인완료 · _2 검색 중 · _5 삭제(중복) · 나머지 미코딩) */
export const S04_IMAGE_STATUSES: Record<string, ImageCodingStatus> = {
  "00001-25-0649_1": "done",
  "00001-25-0649_2": "searching",
  "00001-25-0649_3": "uncoded",
  "00001-25-0649_4": "uncoded",
  "00001-25-0649_5": "duplicate",
  "00001-25-0649_6": "uncoded",
}
/** 시안 「12장 중 1장 완료」 · 「… _7 – _12」 */
export const S04_IMAGE_TOTAL = 12
export const S04_IMAGE_REST = "… _7 – _12"

/** 시안 영역별 AI 확신도(상 0.93 · 중 0.88 · 하 0.71) */
export const S04_ZONE_CONFIDENCE = { top: 0.93, mid: 0.88, bottom: 0.71 }

/** 시안 검색 전 미리보기 깔때기 */
export const S04_FUNNEL: { steps: FunnelStep[]; note: string } = {
  steps: [
    { label: "신발 DB", value: "128,406", ratio: 100 },
    { label: "매칭 조건 통과", value: "121,930", ratio: 95 },
    { label: "필수 문양 상·중 헤링본", value: "857", ratio: 34 },
    { label: "먼저 볼 후보(AI 순위)", value: "Top 10", ratio: 12 },
  ],
  note: "필수를 하나 더 걸면 857 → 312건. 너무 좁히면 정답이 빠질 수 있어 개수를 먼저 보여 줍니다.",
}

/** 시안 팔레트 「최근 사용」 줄 */
export const S04_RECENT = ["n32_04", "n21_05", "s10c", "n21_02", "n73_01"]

/** SCAS 「매칭 조건」 가짜 값(시안 등록기간 2000-01-01 ~ 2025-07-24) */
export const S04_MATCH_CONDITIONS: MatchConditionValues = {
  searchKind: "현장문양",
  periodFrom: "2000-01-01",
  periodTo: "2025-07-24",
  gender: "전체",
  heel: "전체",
}

/** 필수 문양을 바꾼 뒤 재검색이 끝나기까지(진열용, 지금 앱 디바운스 300ms와 같음) */
export const S04_RESEARCH_MS = 300

export const S04_APRTHNG_NO = "00001-25-0649_2"
export const S04_IMAGES = Array.from({ length: 6 }, (_, i) => `00001-25-0649_${i + 1}`)

/** 팔레트 종류별 문양 이름(src/assets/Patterns/<폴더> 앞쪽 일부). 「윤곽」 종류는 폴더 `윤곽선` */
export const S04_PALETTE: Record<PaletteKind, string[]> = {
  무늬: ["n21_01", "n21_02", "n21_03", "n21_05", "n21_06", "n21_07", "n21_10", "n21_11", "n21_12", "n21_13", "n21_15", "n21_16"],
  선: ["n21_20", "n31_01", "n31_02", "n31_03", "n31_04", "n32_02", "n32_03", "n32_04", "n32_05", "n32_06", "n32_07", "n32_09"],
  윤곽: ["n10_01", "n10_03", "s10a", "s10b", "s10c", "s10d", "s10e", "s10f", "s10g", "s10h"],
  다각: ["n61_01", "n61_02", "n62_02", "n62_03", "n62_04", "n62_05", "n62_06", "n62_07", "n62_08", "n73_01"],
  삼각: ["n41_01", "n41_02", "n41_03", "n41_04", "n42_01", "n42_02", "n42_03", "s41a", "s41b", "s41c"],
  사각: ["n51_01", "n51_02", "n51_03", "n51_04", "n51_05", "n51_06", "n51_08", "n51_09", "n51_10", "n52_01"],
  원: ["n71_01", "n71_02", "n71_04", "n72_01", "n72_02", "n72_05", "n73_02", "n73_03", "s71a", "s71b"],
  항목: ["s81a", "s81b", "s81c", "s81d", "s81e", "s82a"],
}

// ── 사건 창(11/17) — 전체 문양 목록 · 가중치 · 검색 이력 ──

/** 팔레트 종류 → 폴더 이름(docs/pattern-data-model.md §3 — 「윤곽」 종류만 폴더가 `윤곽선`) */
const KIND_FOLDER: Record<PaletteKind, string> = { 무늬: "무늬", 선: "선", 윤곽: "윤곽선", 다각: "다각", 삼각: "삼각", 사각: "사각", 원: "원", 항목: "항목" }

// 문양 그림 폴더의 파일 이름만 읽는다(불러오지 않음 — 진열 전용, 프로덕션 빌드에는 안 들어감)
const PATTERN_FILES = Object.keys(import.meta.glob("/src/assets/Patterns/*/*.png"))

/** 종류별 전체 문양 이름(폴더 그대로 · 이름순) — 사건 창 「문양 목록」 */
export const S04_LIBRARY: Record<PaletteKind, string[]> = Object.fromEntries(
  (Object.keys(KIND_FOLDER) as PaletteKind[]).map((kind) => [
    kind,
    PATTERN_FILES.filter((f) => f.split("/").at(-2) === KIND_FOLDER[kind])
      .map((f) => (f.split("/").at(-1) ?? "").replace(/\.png$/, ""))
      .sort(),
  ]),
) as Record<PaletteKind, string[]>

/** 문양 이름 → 종류(가중치 규칙 R2). 이름 앞자리로 짐작하지 않고 폴더로 정한다 */
export const S04_KINDS: Record<string, PaletteKind> = Object.fromEntries(
  (Object.entries(S04_LIBRARY) as [PaletteKind, string[]][]).flatMap(([kind, names]) => names.map((n) => [n, kind])),
)

/** 결정적 가짜 난수(같은 시드 = 같은 신발 DB) */
function lcg(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

/** 진열용 가짜 신발 DB(1,200켤레) — 바탕 무늬 · 드문 마크 · 윤곽을 섞어 가중치 차이가 보이게. 신발 ID 는 문자열(앞자리 0) */
export const S04_FAKE_SHOES: ShoePatterns[] = (() => {
  const rnd = lcg(649)
  const pick = <T>(xs: readonly T[]) => xs[Math.floor(rnd() * xs.length)]
  const BASE = ["n32_04", "n32_04", "n32_04", "n21_05", "n21_05", "n31_02", "n21_02", "n51_03", "n71_01", "n32_06"]
  const EXTRA = ["n21_05", "n31_02", "n51_03", "n41_01", "n72_01", "n32_06"]
  const MARK = ["s81b", "s81a", "n62_02", "n73_01"]
  const OUTLINE = ["s10a", "s10b", "s10c", "s10d", "s10e", "n10_01"]
  return Array.from({ length: 1200 }, (_, i) => {
    const base = pick(BASE)
    const with2 = (p: number, more: readonly string[]) => (rnd() < p ? [base, pick(more)] : [base])
    return {
      ftwrId: String(700 + i).padStart(5, "0"),
      zones: {
        top: with2(0.35, EXTRA),
        mid: rnd() < 0.7 ? with2(0.18, MARK) : rnd() < 0.5 ? [pick(MARK)] : [],
        bottom: rnd() < 0.8 ? [base] : [pick(EXTRA)],
        outline: rnd() < 0.6 ? [pick(OUTLINE)] : [],
      },
    }
  })
})()

/** 검색 한 번(진열 가짜 계산 — spec §4 식 그대로) */
export function fakeSearchRun(args: {
  searchNo: number
  at: string
  source: SearchImageSource
  zones: NamedZones
  meta: PatternMetaMap
  overrides: WeightOverrideMap
  conditions: MatchConditionValues
}): SearchRun {
  const weights = patternWeights(args.zones, args.meta, S04_KINDS, args.overrides)
  const query = searchQuery(args.zones, args.meta, weights)
  const ranked = rankShoes(query, S04_FAKE_SHOES)
  return {
    searchNo: args.searchNo,
    at: args.at,
    source: args.source,
    zones: runSnapshot(query, weights),
    conditions: args.conditions,
    resultCount: ranked.length,
    top: ranked.slice(0, 5).map((h) => ({ ...h, src: soleOf(h.ftwrId) })),
  }
}

/** 처음 보이는 검색 이력 두 줄(최신이 앞) — 상 · 중 헤링본 필수만(원본) → 윤곽 · 마크까지 넣고 마크를 높음으로(편집본) */
export const S04_RUNS: SearchRun[] = [
  fakeSearchRun({
    searchNo: 572433,
    at: "2025-07-24 10:12:05",
    source: "edited",
    zones: { top: [["n32_04", 1]], mid: [["n32_04", 1], ["s81b", 0]], bottom: [], outline: [["s10c", 0]] },
    meta: { mid: { s81b: { status: "ai", confidence: 0.42 } } },
    overrides: { mid: { s81b: "high" } },
    conditions: S04_MATCH_CONDITIONS,
  }),
  fakeSearchRun({
    searchNo: 572419,
    at: "2025-07-24 09:41:30",
    source: "original",
    zones: { top: [["n32_04", 1]], mid: [["n32_04", 1]], bottom: [], outline: [] },
    meta: {},
    overrides: {},
    conditions: S04_MATCH_CONDITIONS,
  }),
]

/** SCAS 「코드 설명」 가짜 글(긴 값 — 가로 넘침 확인용, Review Focus 3) */
export const S04_CODE_NOTES: Record<string, string> = {
  n32_04:
    "내부선 › 단선 — 밑창 안쪽을 가로지르는 짧은 홈이 한 줄로 일정한 간격을 두고 반복되는 무늬(헤링본처럼 꺾이지 않고 곧게 이어짐)",
}
export const DEFAULT_CODE_NOTE = "이 문양의 설명은 아직 없습니다(진열용 가짜 설명)."
