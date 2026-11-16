import type {
  CaseListAiPrep,
  CaseListFilters,
  CaseListRow,
  CaseListRowSummary,
  CaseListTasks,
} from "@/widgets/case-list"

import { fakeSoleUrl } from "../mock-assets/FakeSole"

// S01 가짜 데이터. 숫자 · 이름은 시안(s01-case-list.js) 예시값과 맞춘다(감정번호 00001-25-0646 등, 이름은 가림).
export const S01_TOTAL = 116
export const S01_PAGE_SIZE = 20

export const EMPTY_FILTERS: CaseListFilters = {
  aprthngNo: "",
  docNo: "",
  caseName: "",
  registeredFrom: "2025-06-25",
  registeredTo: "2025-07-24",
  victim: "",
  kind: "all",
  place: "",
  arrested: "",
  author: "",
  processOffice: "경찰청",
  requestOffice: "",
  occurOffice: "",
  caseResult: "",
  awaitingResult: false,
  otherOrg: "",
}

type Seed = Omit<CaseListRow, "thumbSrc" | "processOffice" | "confirmedAt" | "caseResult" | "receiver" | "author">

const SEEDS: Seed[] = [
  { aprthngNo: "00001-25-0649", docNo: "SCAS수사부-871", caseName: "주거침입", requestOffice: "대구청", scasNo: "2025-03321", occurOffice: "동부서", kind: "현장", shoeCount: 12, tireCount: 0, suspect: "무", registeredAt: "2025-07-24", results: { found: 1, missed: 0, unable: 0 }, progress: { registered: 9, searched: 2, confirmed: 1 } },
  { aprthngNo: "00001-25-0647", docNo: "SCAS수사부-2951", caseName: "절도", requestOffice: "경북청", scasNo: "2025-11707", occurOffice: "포항남부서", kind: "현장", shoeCount: 2, tireCount: 0, suspect: "무", registeredAt: "2025-07-24", results: { found: 0, missed: 0, unable: 0 }, progress: { registered: 0, searched: 2, confirmed: 0 } },
  { aprthngNo: "00001-25-0646", docNo: "SCAS수사부-2944", caseName: "주거침입", requestOffice: "대구청", scasNo: "2025-03318", occurOffice: "수성서", kind: "현장", shoeCount: 3, tireCount: 0, suspect: "유", registeredAt: "2025-07-23", results: { found: 1, missed: 1, unable: 1 }, progress: { registered: 0, searched: 0, confirmed: 3 } },
  { aprthngNo: "00001-25-0640", docNo: "SCAS수사부-2911", caseName: "절도", requestOffice: "부산청", scasNo: "2025-09120", occurOffice: "해운대서", kind: "대조", shoeCount: 1, tireCount: 0, suspect: "유", registeredAt: "2025-07-22", results: { found: 1, missed: 0, unable: 0 }, progress: { registered: 0, searched: 0, confirmed: 1 } },
  { aprthngNo: "00001-25-0633", docNo: "SCAS수사부-2870", caseName: "강도", requestOffice: "서울청", scasNo: "2025-20114", occurOffice: "강서서", kind: "현장", shoeCount: 4, tireCount: 0, suspect: "무", registeredAt: "2025-07-21", results: { found: 0, missed: 3, unable: 1 }, progress: { registered: 0, searched: 0, confirmed: 4 } },
  { aprthngNo: "00001-25-0621", docNo: "SCAS수사부-2802", caseName: "기타", requestOffice: "경기남부청", scasNo: "2025-07731", occurOffice: "화성동탄서", kind: "현장", shoeCount: 1, tireCount: 1, suspect: "무", registeredAt: "2025-07-18", results: { found: 0, missed: 0, unable: 2 }, progress: { registered: 0, searched: 0, confirmed: 2 } },
  { aprthngNo: "00001-25-0612", docNo: "", caseName: "절도", requestOffice: "인천청", scasNo: "", occurOffice: "미추홀서", kind: "현장", shoeCount: 2, tireCount: 0, suspect: "유", registeredAt: "2025-07-16", results: { found: 2, missed: 0, unable: 0 }, progress: { registered: 0, searched: 0, confirmed: 2 } },
]

/** 긴 사건명 40자(가로 넘침 확인용) */
export const LONG_CASE_NAME = "주거침입 및 야간 건조물 침입 절도 미수 연쇄 사건 합동 수사 건 (대구 동구 일대 다발)"

const THUMB_ZONES = [
  ["dots", "grid", "herring"],
  ["tri", "wave", "blocks"],
  ["grid", "grid", "lines"],
] as const

let thumbs: string[] | null = null
function thumbFor(i: number): string {
  thumbs ??= THUMB_ZONES.map((z) => fakeSoleUrl({ kind: "scene", zones: [...z] }))
  return thumbs[i % thumbs.length]
}

// 시안 r3 +α 값: 사건 진행 단계(cs) · 들어온 길(src). 시안 CASES 순서와 같다.
const STAGES = [-1, -1, 1, 2, 3, 4, 4]

let binThumbs: string[] | null = null
function binFor(i: number): string {
  binThumbs ??= THUMB_ZONES.map((z) => fakeSoleUrl({ kind: "bin", zones: [...z] }))
  return binThumbs[i % binThumbs.length]
}

/** 시안 0646 펼침: 이미지별 현장 → 이진화 → 1위 후보 */
function makeSummary(i: number): CaseListRowSummary {
  const sole = (kind: "scene" | "bin" | "shoe", k: number) =>
    fakeSoleUrl({ kind, zones: [...THUMB_ZONES[k]] })
  return {
    defaultOpen: i === 2,
    confirmedAt: "07-24 17:35",
    crossReviewer: "김○○ 경위",
    images: [
      { seq: "_1", result: "발견", searchNo: "572420", target: "2 / 500", sceneSrc: sole("scene", 0), binSrc: sole("bin", 0), shoeSrc: sole("shoe", 0), topCandidate: "305659", similarity: "60.8" },
      { seq: "_2", result: "불발견", searchNo: "572356", target: "0 / 1,204", sceneSrc: sole("scene", 1), binSrc: sole("bin", 1), note: "끝까지 봄" },
      { seq: "_3", result: "감정불능", searchNo: "—", target: "검색 안 함", sceneSrc: sole("scene", 2), binSrc: sole("bin", 2), note: "족적 30%만 남음" },
    ],
  }
}

/** (+α) 「AI 사전 처리」 타일: 방금 접수된 0649 */
export const S01_AI_PREP: CaseListAiPrep = {
  aprthngNo: "00001-25-0649",
  receivedAt: "09:12",
  imageCount: 12,
  binarized: 12,
  suggested: 9,
  top10: 7,
}

/** (+α) 역할별 할 일 타일 숫자(시안 그대로) */
export const S01_TASKS: CaseListTasks = {
  awaitingResult: { cases: 14, imagesTotal: 98, imagesChecked: 57 },
  unsearched: { images: 9, ready: 7, waiting: 2 },
  crossRequest: { count: 1, detail: "00001-25-0646 · 김○○ → 나" },
  approval: { count: 3, detail: "가장 오래된 것 2일" },
  ours: { count: 22, detail: "진행 중 6 · 결재완료 16" },
}

export const S01_LIVE_AT = "09:12"

/** 시안 7건을 돌려 가며 전체 116건을 만든다. 감정번호는 0649 에서 하나씩 내려간다. */
export function makeCaseRows(): CaseListRow[] {
  return Array.from({ length: S01_TOTAL }, (_, i) => {
    const k = i % SEEDS.length
    const s = SEEDS[k]
    const confirmed = s.progress.confirmed > 0
    return {
      ...s,
      stackSrc: s.shoeCount + s.tireCount > 1 ? binFor(i) : undefined,
      source: k === 6 ? "manual" : "auto",
      isNew: i === 0,
      ai: i === 0 ? { state: "running", ready: 7, total: 12 } : { state: "done", ready: s.shoeCount, total: s.shoeCount },
      stage: STAGES[k],
      crossReviewer: k === 2 ? "김○○ 경위" : undefined,
      summary: k === 2 ? makeSummary(i) : undefined,
      // 첫 7건은 시안 감정번호(0649 · 0647 · 0646 …) 그대로, 그 뒤는 겹치지 않게 0583 에서 내려간다
      aprthngNo: i < SEEDS.length ? s.aprthngNo : `00001-25-${String(590 - i).padStart(4, "0")}`,
      caseName: i === 5 ? LONG_CASE_NAME : s.caseName,
      processOffice: "경찰청 범죄분석과",
      confirmedAt: confirmed ? s.registeredAt : "",
      caseResult: s.results.found > 0 ? "발견" : confirmed ? "불발견" : "",
      receiver: "박○○",
      author: "박○○",
      thumbSrc: thumbFor(i),
    }
  })
}
