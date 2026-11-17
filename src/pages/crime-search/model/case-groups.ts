import type { Crime } from "@/entities/crime"
import type { CaseListRow } from "@/widgets/case-list"
import type { CaseWindowImage } from "@/widgets/case-window"

// 지금 서버 목록(`GET /crime/`)은 감정물(이미지 한 장) 단위다. 새 사건관리는 사건 = 같은 감정의뢰번호(apprslReqestNo)를 가진
// 감정물들로 묶어 한 행으로 보인다(감정의뢰번호가 없으면 그 감정물 한 장이 한 사건 — 갈래 ④ `resolve-image.ts` 와 같은 규칙).
// 이미지 순번 = 감정물 번호 끝 `_n`(없으면 감정물 번호 그대로). 서버에 없는 값(문서번호 · SCAS번호 · 결과 · 진행 단계 …)은
// 비우거나 0 으로 둔다 — 결과 · 판정 API 가 없어 결과 칸은 모두 0(흐리게), 진행은 「등록」 장수만.

export interface CaseImageRef {
  /** 이미지 순번(`5`) — 주소 `img` 값 */
  no: string
  /** 감정물 번호 전체(`05019-24-0017_5`) — 실제 API 키 */
  aprthngNo: string
}

export interface CaseGroup {
  /** 사건 번호 = 감정의뢰번호(없으면 감정물 번호) */
  caseNo: string
  caseName: string
  requestOffice: string
  /** 가장 이른 등록일 `YYYY-MM-DD`(없으면 빈 글자) */
  registeredAt: string
  /** 순번 순서 */
  images: CaseImageRef[]
}

/** 감정물 번호 끝 순번(`…_5` → `5`). 밑줄이 없으면 감정물 번호 그대로 */
export function imageSeqOf(aprthngNo: string): string {
  const at = aprthngNo.lastIndexOf("_")
  return at < 0 || at === aprthngNo.length - 1 ? aprthngNo : aprthngNo.slice(at + 1)
}

/** 순번이 숫자면 숫자 순서, 아니면 글자 순서(앞자리 0 보존 — 값은 바꾸지 않는다) */
function compareSeq(a: CaseImageRef, b: CaseImageRef): number {
  const na = Number(a.no)
  const nb = Number(b.no)
  if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb
  return a.aprthngNo.localeCompare(b.aprthngNo)
}

/** 감정물 목록 → 사건 묶음(서버 순서 = 최근 등록 먼저 — 묶음은 처음 나온 자리 순서) */
export function groupCrimes(rows: readonly Crime[]): CaseGroup[] {
  const byCase = new Map<string, CaseGroup>()
  for (const row of rows) {
    const aprthngNo = row.aprthngNo ?? ""
    if (aprthngNo === "") continue
    const caseNo = row.apprslReqestNo || aprthngNo
    let group = byCase.get(caseNo)
    if (!group) {
      group = { caseNo, caseName: "", requestOffice: "", registeredAt: "", images: [] }
      byCase.set(caseNo, group)
    }
    if (group.caseName === "" && row.crimeNm) group.caseName = row.crimeNm
    if (group.requestOffice === "" && row.rqestGrfcNm) group.requestOffice = row.rqestGrfcNm
    const day = (row.frstRegistDt ?? "").slice(0, 10)
    if (day !== "" && (group.registeredAt === "" || day < group.registeredAt)) group.registeredAt = day
    if (!group.images.some((i) => i.aprthngNo === aprthngNo)) group.images.push({ no: imageSeqOf(aprthngNo), aprthngNo })
  }
  const groups = [...byCase.values()]
  for (const g of groups) g.images.sort(compareSeq)
  return groups
}

/**
 * 바로 찾기 · 「+」 사건 찾기: 감정의뢰번호 · 사건명 · 의뢰관서 부분 일치, 또는 이미지 감정물 번호(`…_2`) 부분 일치.
 * needle 은 소문자 · 앞뒤 공백 없는 값으로 넘긴다.
 */
export function caseMatches(group: CaseGroup, needle: string): boolean {
  if (needle === "") return true
  if ([group.caseNo, group.caseName, group.requestOffice].some((t) => t.toLowerCase().includes(needle))) return true
  return group.images.some((i) => i.aprthngNo.toLowerCase().includes(needle))
}

/** 사건 묶음 → 목록 한 행. 서버에 없는 칸은 비움(화면이 「—」) · 0 */
export function toCaseListRow(group: CaseGroup, thumbOf: (aprthngNo: string) => string): CaseListRow {
  const first = group.images[0]
  return {
    aprthngNo: group.caseNo,
    docNo: "",
    caseName: group.caseName,
    requestOffice: group.requestOffice,
    scasNo: "",
    processOffice: "",
    occurOffice: "",
    kind: "현장",
    shoeCount: group.images.length,
    tireCount: 0,
    suspect: "무",
    registeredAt: group.registeredAt,
    confirmedAt: "",
    caseResult: "",
    receiver: "",
    author: "",
    results: { found: 0, missed: 0, unable: 0 },
    progress: { registered: group.images.length, searched: 0, confirmed: 0 },
    thumbSrc: first ? thumbOf(first.aprthngNo) : "",
  }
}

/** 사건 창 왼쪽 이미지 목록. 장 상태는 판정 API 가 없어 모두 「등록」 */
export function toWindowImages(group: CaseGroup, thumbOf: (aprthngNo: string) => string): CaseWindowImage[] {
  return group.images.map((i) => ({
    no: i.no,
    imageNo: i.aprthngNo,
    kind: "신발",
    status: "등록",
    thumbSrc: thumbOf(i.aprthngNo),
  }))
}

/** 창 탭 본문이 넘긴 이미지 값(감정물 번호 전체 또는 순번) → 주소 `img` 순번. 모르는 값이면 null */
export function imageNoFromPick(group: CaseGroup, picked: string): string | null {
  const hit = group.images.find((i) => i.aprthngNo === picked || i.no === picked)
  return hit ? hit.no : null
}
