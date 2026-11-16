import type { CaseListFilters, CaseListRow, CaseListRowSummary } from "@/widgets/case-list"
import type { CaseImageStatus, CaseWindowImage } from "@/widgets/case-window"
import type { ConfirmRow, Judgement } from "@/widgets/result-confirm"

import { fakeSoleUrl } from "../mock-assets/FakeSole"
import { samplePhotoUrl, sampleSoleUrl } from "../mock-assets/sample-images"
import type { ZoneTriple } from "../mock-assets/fake-art"

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

/** 시안 0646 펼침: 이미지별 현장 → 이진화 → 1위 후보(표본 사진이 있으면 그 사건 _1 · _2 · _3 의 실제 사진 · 이진화본) */
function makeSummary(i: number, aprthngNo: string): CaseListRowSummary {
  const fake = (kind: "scene" | "bin" | "shoe", k: number) => fakeSoleUrl({ kind, zones: [...THUMB_ZONES[k]] })
  const scene = (k: number) => samplePhotoUrl(`${aprthngNo}_${k + 1}`, {}, () => fake("scene", k))
  const bin = (k: number) => samplePhotoUrl(`${aprthngNo}_${k + 1}`, { look: "binary" }, () => fake("bin", k))
  return {
    defaultOpen: i === 2,
    confirmedAt: "07-24 17:35",
    crossReviewer: "김○○ 경위",
    images: [
      { seq: "_1", result: "발견", searchNo: "572420", target: "2 / 500", sceneSrc: scene(0), binSrc: bin(0), shoeSrc: sampleSoleUrl("305659", { kind: "shoe" }, () => fake("shoe", 0)), topCandidate: "305659", similarity: "60.8" },
      { seq: "_2", result: "불발견", searchNo: "572356", target: "0 / 1,204", sceneSrc: scene(1), binSrc: bin(1), note: "끝까지 봄" },
      { seq: "_3", result: "감정불능", searchNo: "—", target: "검색 안 함", sceneSrc: scene(2), binSrc: bin(2), note: "족적 30%만 남음" },
    ],
  }
}

// r4: 「AI 사전 처리」 · 역할별 할 일 타일(KPI)은 사용자 결정(2026-11-16 「kpi 부분은 없애자」)으로 지웠다.
// 결과 확인 전 · 이미지 미검색 · 교차 검증은 S01DevPage 의 「빠른 보기」 칩이 이 데이터에서 직접 센다.

export const S01_LIVE_AT = "09:12"

/**
 * 사건 창 왼쪽 목록(현장 이미지 _1 … _n)의 가짜 값 — 목록 행의 숫자에서 만들어 서로 맞게 한다.
 * 장수 = 신발 + 타이어(신발이 앞 번호). 확인된 장이 앞 번호부터: 결과(발견 → 불발견 → 감정불능) 수만큼 그 결과, 남은 확인 장은 「확인」.
 * 그다음 검색된 장 「검색됨」, 나머지 「등록」. 예 0649 = 12장: 발견 1 · 검색됨 2 · 등록 9.
 */
export function makeCaseImages(row: CaseListRow): CaseWindowImage[] {
  const total = row.shoeCount + row.tireCount
  const { found, missed, unable } = row.results
  const { confirmed, searched } = row.progress
  const statusAt = (i: number): CaseImageStatus => {
    if (i < confirmed) {
      if (i < found) return "발견"
      if (i < found + missed) return "불발견"
      if (i < found + missed + unable) return "감정불능"
      return "확인"
    }
    return i < confirmed + searched ? "검색됨" : "등록"
  }
  return Array.from({ length: total }, (_, i) => ({
    no: String(i + 1),
    imageNo: `${row.aprthngNo}_${i + 1}`,
    kind: i < row.shoeCount ? "신발" : "타이어",
    status: statusAt(i),
    // 표본 사진이 있으면 그 사건 · 그 장의 실제 사진(어느 탭에서나 같은 사진), 없으면 가짜 그림
    thumbSrc: samplePhotoUrl(`${row.aprthngNo}_${i + 1}`, {}, () => thumbFor(i)),
  }))
}

/** 사건 진행 단계 이름(목록 「사건 진행」 열과 같은 말 — 결재 없음: 옛 3 · 4 단계는 감정서 · 완료) */
export function stageLabel(stage: number | undefined): string {
  if (stage === undefined || stage < 0) return "이미지 확인 중"
  return ["검증요청", "교차 검증", "감정서", "감정서", "완료"][stage] ?? "이미지 확인 중"
}

/** 결과 확인 탭의 확인대상 · 1위 후보 신발(검색 결과 탭 가짜 값과 같은 번호) */
const CONFIRM_SHOES: readonly { ftwrId: string; zones: ZoneTriple }[] = [
  { ftwrId: "00758", zones: ["herring", "grid", "tri"] },
  { ftwrId: "305659", zones: ["grid", "grid", "lines"] },
  { ftwrId: "281904", zones: ["wave", "grid", "blocks"] },
  { ftwrId: "274466", zones: ["dots", "grid", "herring"] },
  { ftwrId: "SH-20251", zones: ["tri", "wave", "blocks"] },
]

let confirmShoeThumbs: string[] | null = null

/**
 * 사건 창 「결과 확인」 탭 판정 줄 — 그 사건의 이미지 목록(makeCaseImages) 상태에서 만든다.
 * 발견 = 확인대상 신발 · 점수, 불발견 · 확인 = 검색했고 매칭 없음, 감정불능 = 검색 안 함, 검색됨 = 판정 전(1위 후보), 등록 = 검색 전.
 */
export function makeConfirmRows(row: CaseListRow): ConfirmRow[] {
  confirmShoeThumbs ??= CONFIRM_SHOES.map((s) => sampleSoleUrl(s.ftwrId, { kind: "shoe", zones: [...s.zones] }))
  const thumbsOf = confirmShoeThumbs
  return makeCaseImages(row).map((img, i) => {
    const k = (i + Number(row.aprthngNo.slice(-2))) % CONFIRM_SHOES.length
    const shoe = { ftwrId: CONFIRM_SHOES[k].ftwrId, image: thumbsOf[k], score: Math.round((84.1 - i * 2.7) * 10) / 10, ranking: 1 + (i % 3) }
    const searchNo = String(572420 - i * 37)
    const judgement: Judgement | null =
      img.status === "발견" ? "found" : img.status === "불발견" || img.status === "확인" ? "notFound" : img.status === "감정불능" ? "unable" : null
    const searched = img.status !== "등록" && img.status !== "감정불능"
    return {
      no: img.no,
      imageNo: img.imageNo,
      kind: img.kind,
      thumb: img.thumbSrc ?? thumbFor(i),
      searchNo: searched ? searchNo : null,
      judgement,
      shoe: img.status === "발견" || img.status === "검색됨" ? shoe : null,
    }
  })
}

/** 시안 7건을 돌려 가며 전체 116건을 만든다. 감정번호는 0649 에서 하나씩 내려간다. */
export function makeCaseRows(): CaseListRow[] {
  return Array.from({ length: S01_TOTAL }, (_, i) => {
    const k = i % SEEDS.length
    const s = SEEDS[k]
    const confirmed = s.progress.confirmed > 0
    // 첫 7건은 시안 감정번호(0649 · 0647 · 0646 …) 그대로, 그 뒤는 겹치지 않게 0583 에서 내려간다
    const aprthngNo = i < SEEDS.length ? s.aprthngNo : `00001-25-${String(590 - i).padStart(4, "0")}`
    return {
      ...s,
      // 겹친 그림 = 2번째 장의 이진화본(표본 사진이 없으면 가짜 그림)
      stackSrc: s.shoeCount + s.tireCount > 1 ? samplePhotoUrl(`${aprthngNo}_2`, { look: "binary" }, () => binFor(i)) : undefined,
      source: k === 6 ? "manual" : "auto",
      isNew: i === 0,
      ai: i === 0 ? { state: "running", ready: 7, total: 12 } : { state: "done", ready: s.shoeCount, total: s.shoeCount },
      stage: STAGES[k],
      crossReviewer: k === 2 ? "김○○ 경위" : undefined,
      summary: k === 2 ? makeSummary(i, aprthngNo) : undefined,
      aprthngNo,
      caseName: i === 5 ? LONG_CASE_NAME : s.caseName,
      processOffice: "경찰청 범죄분석과",
      confirmedAt: confirmed ? s.registeredAt : "",
      caseResult: s.results.found > 0 ? "발견" : confirmed ? "불발견" : "",
      receiver: "박○○",
      // 담당 두 사람(감정관 박○○ · 수사관 이○○)이 섞여 「내 담당만」이 보는 사람마다 다른 건수를 낸다(i%3==1 이 이○○ 39건, 나머지 박○○ 77건)
      author: i % 3 === 1 ? "이○○" : "박○○",
      // 목록 썸네일 = 그 사건 첫 장(사건 창 왼쪽 목록 _1 과 같은 사진)
      thumbSrc: samplePhotoUrl(`${aprthngNo}_1`, {}, () => thumbFor(i)),
    }
  })
}
