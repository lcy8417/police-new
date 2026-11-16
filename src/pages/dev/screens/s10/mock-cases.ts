import type { Shoe } from "@/entities/shoe"
import type { ShoeAiDetail, ShoeCardInfo, ShoeDbFilters, ShoeOfficeItem, ShoeStageSummary } from "@/widgets/shoe-db"

import type { SCREEN_CASES } from "../frame/dev-screens"
import type { ZoneTriple } from "../mock-assets/fake-art"
import { fakeSoleUrl } from "../mock-assets/FakeSole"

// S10 가짜 값. 신발 ID 는 문자열(앞자리 0 보존), 긴 값 1건 포함(가로 넘침 점검).
// 케이스 이름의 단일 출처는 frame/dev-screens.ts 의 SCREEN_CASES.
export type S10Case = (typeof SCREEN_CASES.s10)[number]

export const S10_PAGE_SIZE = 16
export const S10_TOTAL = 536

export const S10_OFFICES: ShoeOfficeItem[] = [
  { value: "all", label: "전체" },
  { value: "kn", label: "경찰청 범죄분석과" },
  { value: "dg", label: "대구청 과학수사과" },
]

export const S10_EMPTY_FILTERS: ShoeDbFilters = {
  ftwrId: "",
  makrCode: "",
  sex: "all",
  regFrom: "2025-03-01",
  regTo: "2025-03-31",
  brandCode: "",
  approval: "no",
  office: null,
  groupNm: "",
  patternInput: "out",
  shoeKind: "",
  remark: "",
}

export const S10_DUPLICATE_MESSAGE = "이미 등록된 번호입니다"

// ── 신발 편집 판(11/17 갈래 D) — 전체 문양 목록 · AI 문양 추출 제안 ──

/** 종류 탭 → 문양 그림 폴더(docs/pattern-data-model.md §3 — 「윤곽」만 폴더가 `윤곽선`) */
const KIND_FOLDER: Record<string, string> = { 무늬: "무늬", 선: "선", 윤곽: "윤곽선", 다각: "다각", 삼각: "삼각", 사각: "사각", 원: "원", 항목: "항목" }
// 파일 이름만 읽는다(불러오지 않음 — 진열 전용)
const PATTERN_FILES = Object.keys(import.meta.glob("/src/assets/Patterns/*/*.png"))

/** 종류별 전체 문양 이름(폴더 그대로 · 이름순) — 신발 편집 판 「문양 목록」 */
export const S10_LIBRARY: Record<string, string[]> = Object.fromEntries(
  Object.entries(KIND_FOLDER).map(([kind, folder]) => [
    kind,
    PATTERN_FILES.filter((f) => f.split("/").at(-2) === folder)
      .map((f) => (f.split("/").at(-1) ?? "").replace(/\.png$/, ""))
      .sort(),
  ]),
)

/** AI 문양 추출이 제안하는 부위별 문양(진열 값) */
export const S10_AI_SUGGEST = { top: ["n32_04"], mid: ["n21_05"], bottom: ["n32_04"], outline: ["s10c"] } as const

/** AI 문양 추출 흉내 시간(ms) */
export const S10_EXTRACT_MS = 1200

const ZONES: ZoneTriple[] = [
  ["herring", "herring", "herring"],
  ["grid", "dots", "grid"],
  ["wave", "blocks", "lines"],
  ["tri", "grid", "dots"],
]

const LONG_MODEL = "에어 줌 페가수스 트레일 고어텍스 방수 경량 러닝화 남녀공용 2025 봄여름 신상 한정판 컬러웨이"

// 시안 r3 예시값 — 2025-03 등록분 536건 중 1쪽, 작업 단계(분업) 줄, 카드 위 AI 표시
export const S10_STAGE_SUMMARY: ShoeStageSummary = {
  stages: [
    { title: "등록됨 · 문양 대기", count: 214, owner: "등록 담당 → 문양 입력 담당", aiLabel: "AI 문양 제안 198 / 214", aiBusy: true },
    { title: "문양 입력됨 · 그룹 대기", count: 98, owner: "그룹 담당", aiLabel: "AI 그룹 후보 71" },
    { title: "승인 대기", count: 224, owner: "승인 담당", active: true, aiLabel: "AI 확인 필요 9", aiTone: "warn" },
    { title: "승인", count: 0, owner: "신발 DB 확정" },
  ],
  backlog: {
    monthLabel: "2025-03 미승인",
    total: 536,
    parts: [
      { label: "문양 대기", count: 214, tone: "line" },
      { label: "그룹 대기", count: 98, tone: "violet" },
      { label: "승인 대기", count: 224, tone: "blue" },
    ],
    todayDone: 37,
    todayLimit: 50,
    note: "하루 50매면 3월분 약 11일",
  },
}

export const S10_CARD_INFO: Record<string, ShoeCardInfo> = {
  "303352": { status: "승인 대기", mark: 0.95 },
  "303351": { status: "승인 대기", mark: 0.93 },
  "303349": { status: "AI 확인 필요", mark: "dup" },
  "303348": { status: "문양 대기", mark: 0.88 },
  "303347": { status: "승인 대기", mark: 0.91 },
  "303346": { status: "측면 없음" },
  "303344": { status: "문양 대기", mark: "scan" },
  "303342": { status: "승인 대기", mark: 0.96 },
  "303341": { status: "승인 대기", mark: 0.94 },
  "303340": { status: "문양 대기", mark: 0.82 },
  "303339": { status: "AI 확인 필요", mark: 0.61 },
  "303338": { status: "승인 대기", mark: 0.92 },
  "303337": { status: "문양 대기", mark: 0.9 },
  "303336": { status: "승인 대기", mark: 0.89 },
  "303335": { status: "문양 대기", mark: 0.86 },
}

// 색 토큰을 읽어야 해서 호출 때 만든다. 303349 의 창 상세(시안 모달 예시)
export function makeS10AiDetails(): Record<string, ShoeAiDetail> {
  return {
    "303349": {
      conf: { top: 0.94, mid: 0.58, bottom: 0.94 },
      occlusion: { percent: 18, obstacle: "가격표" },
      sameKind: { label: "헤링본", code: "n32_04", hint: "행 3번 → 1번" },
      duplicate: {
        ftwrId: "298114",
        image: fakeSoleUrl({ kind: "shoe", zones: ["herring", "grid", "herring"] }),
        similarity: 0.96,
        registeredAt: "2023-11",
      },
      flow: { registered: "등록 · 서○○ 03-14", patterned: "문양 입력 · 박○○ 07-24", current: "승인 대기" },
      conditions: { ok: ["측면", "바닥", "상·중·하"], warn: "AI 확인 필요 2건 ✗ (가림 1 · 중복 의심 1)" },
    },
  }
}

export function makeS10Shoes(): Shoe[] {
  const ids = ["00758", "303352", "303351", "303349", "303348", "303347", "303346", "303344", "303342", "303341", "303340", "303339", "303338", "303337", "303336", "303335"]
  return ids.map((id, i) => id === "303349" ? {
    ftwrId: id,
    ftwrGroupId: "G041",
    ftwrGroupNm: "브랜드3-013",
    modlNm: "모델 103",
    brandCode: "B0041",
    makrCode: "M013",
    colctPlace: "공식몰",
    colctYear: "2025",
    image: fakeSoleUrl({ kind: "shoe", zones: ["herring", "grid", "herring"] }),
    // 시안 모달 예시: 상·하 헤링본, 중 격자 + 마크, 윤곽 s10c
    top: ["n32_04"],
    mid: ["n21_05", "s81b"],
    bottom: ["n32_04"],
    outline: ["s10c"],
  } : ({
    ftwrId: id,
    ftwrGroupId: `G${String(i + 38).padStart(3, "0")}`,
    ftwrGroupNm: i === 0 ? "crocs(크록스)-038" : `브랜드${i}-0${i + 10}`,
    modlNm: i === 1 ? LONG_MODEL : `모델 ${100 + i}`,
    brandCode: `B00${i + 38}`,
    makrCode: i % 3 === 0 ? null : `M0${i + 10}`,
    colctPlace: i % 2 === 0 ? "신발닷컴" : "공식몰",
    colctYear: i === 0 ? "2019" : "2025",
    image: fakeSoleUrl({ kind: "shoe", zones: ZONES[i % ZONES.length] }),
    top: i % 3 === 2 ? [] : ["s21b"],
    mid: i % 3 === 1 ? ["n32_04"] : [],
    bottom: i % 3 === 2 ? [] : ["s21b"],
    outline: [],
  }))
}

// ---- r3: 전체 536건(쪽 넘김 · 빠른 찾기 · 자동 넘기기가 실제로 움직이도록) ----

const BRANDS = ["나이키", "아디다스", "뉴발란스", "크록스", "컨버스", "푸마"]

/** 첫 16건은 기존 진열 값 그대로, 나머지는 번호가 내려가는 가짜 신발. 문자열 ID 그대로. */
export function makeS10AllShoes(): Shoe[] {
  const base = makeS10Shoes()
  const imgs = ZONES.map((z) => fakeSoleUrl({ kind: "shoe", zones: z }))
  const rest = Array.from({ length: S10_TOTAL - base.length }, (_, k): Shoe => {
    const i = base.length + k
    return {
      ftwrId: String(303334 - k),
      ftwrGroupId: `G${String(i % 90).padStart(3, "0")}`,
      ftwrGroupNm: `${BRANDS[i % BRANDS.length]}-${String(i % 90).padStart(3, "0")}`,
      modlNm: `${BRANDS[i % BRANDS.length]} 모델 ${200 + (i % 300)}`,
      brandCode: `B00${(i % 6) + 1}`,
      makrCode: `M0${(i % 20) + 10}`,
      colctPlace: i % 2 === 0 ? "신발닷컴" : "공식몰",
      colctYear: "2025",
      image: imgs[i % imgs.length],
      top: i % 3 === 2 ? [] : ["s21b"],
      mid: i % 3 === 1 ? ["n32_04"] : [],
      bottom: i % 3 === 2 ? [] : ["s21b"],
      outline: [],
    }
  })
  return [...base, ...rest]
}

/** 카드 작업 상태 · AI 표시: 시안 예시 15건은 그대로, 나머지는 값을 돌려 쓴다 */
export function makeS10CardInfo(shoes: readonly Shoe[]): Record<string, ShoeCardInfo> {
  const cycle = Object.values(S10_CARD_INFO)
  const out: Record<string, ShoeCardInfo> = { ...S10_CARD_INFO }
  shoes.forEach((s, i) => {
    if (!out[s.ftwrId]) out[s.ftwrId] = cycle[i % cycle.length]
  })
  return out
}
