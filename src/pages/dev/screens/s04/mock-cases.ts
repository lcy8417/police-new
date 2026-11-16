import type { CrimeHistoryRow } from "@/entities/crime"
import type { EssentialFlag, PatternZone } from "@/entities/pattern"
import type { ExtractState, MatchConditionValues, PaletteKind } from "@/widgets/pattern-code"

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
  history: CrimeHistoryRow[]
}

const READY_ZONES: NamedZones = {
  top: [
    ["n32_04", 1],
    ["n21_05", 0],
  ],
  mid: [["n32_04", 1]],
  bottom: [["n32_04", 0]],
  outline: [["s10c", 0]],
}
const EMPTY_ZONES: NamedZones = { top: [], mid: [], bottom: [], outline: [] }

const EXTRACTED = [
  { code: "n32_04", score: 0.93 },
  { code: "n21_05", score: 0.61 },
  { code: "n51_03", score: 0.71 },
  { code: "s81b", score: 0.42 },
]

// 이력: 신발 ID 는 문자열(앞자리 0 보존 — 00758), 매칭 없이 저장한 줄(null) 포함
const HISTORY: CrimeHistoryRow[] = [
  { searchNo: 572433, frstRegistDt: "2025-07-24 10:12:05", ranking: 3, mtchgId: "00758" },
  { searchNo: 572420, frstRegistDt: "2025-07-24 09:58:41", ranking: 12, mtchgId: "305659" },
  { searchNo: 572419, frstRegistDt: "2025-07-24 09:41:30", ranking: 0, mtchgId: null },
]

export const S04_MOCK: Record<S04Case, S04Mock> = {
  ready: { status: "ready", extractState: "done", zones: READY_ZONES, extracted: EXTRACTED, history: HISTORY },
  running: { status: "ready", extractState: "running", zones: READY_ZONES, extracted: [], history: HISTORY },
  loading: { status: "loading", extractState: "idle", zones: EMPTY_ZONES, extracted: [], history: [] },
  error: { status: "error", errorAt: "09:41", extractState: "idle", zones: EMPTY_ZONES, extracted: [], history: [] },
  empty: { status: "empty", extractState: "idle", zones: EMPTY_ZONES, extracted: [], history: [] },
}

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
