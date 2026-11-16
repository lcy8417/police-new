import type { EssentialFlag, PatternZone } from "@/entities/pattern"
import type {
  ExtractState,
  FunnelStep,
  ImageCodingStatus,
  MatchConditionValues,
  PaletteKind,
  PatternMetaMap,
  SearchHistoryRow,
} from "@/widgets/pattern-code"

import type { SCREEN_CASES } from "../frame/dev-screens"

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

/** SCAS 「코드 설명」 가짜 글(긴 값 — 가로 넘침 확인용, Review Focus 3) */
export const S04_CODE_NOTES: Record<string, string> = {
  n32_04:
    "내부선 › 단선 — 밑창 안쪽을 가로지르는 짧은 홈이 한 줄로 일정한 간격을 두고 반복되는 무늬(헤링본처럼 꺾이지 않고 곧게 이어짐)",
}
export const DEFAULT_CODE_NOTE = "이 문양의 설명은 아직 없습니다(진열용 가짜 설명)."
