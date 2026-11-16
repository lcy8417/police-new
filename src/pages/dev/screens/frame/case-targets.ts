// 사건 창 「확인대상」 목록(2회차 검수 — 검색 결과 ★ · 정밀 대조 「확인대상」 · 결과 확인이 같은 목록을 쓴다).
// 한 이미지에 여러 검색의 여러 후보를 둘 수 있다(DB `app.examination_candidate` — 판정 하나에 후보 여러 개, DB 설계서 §5-C).
// 후보 식별 = 검색번호 + 신발 ID(순위만으로 가르면 다른 검색의 같은 순위 카드에 ★ 가 옮겨 붙는다).
// 보관함 이미지 범위(`<감정번호>|<n>`)의 `CASE_TARGETS_FIELD` 칸에 든다. 결과 확인 탭(사건 범위)은 S01 이 장마다 읽어 넘긴다.

import type { Judgement } from "@/widgets/result-confirm"

/** 보관함 칸 이름 — 이미지별 확인대상 목록 */
export const CASE_TARGETS_FIELD = "work.targets"

/** 보관함 칸 이름(사건 범위) — 결과 확인 탭에서 누른 판정 `{ [이미지 n]: CaseJudgementPick }` */
export const CASE_JUDGEMENTS_FIELD = "s07.picked"
/** 보관함 칸 이름(사건 범위) — 교차 검증 요청함 */
export const CASE_CROSS_REQUESTED_FIELD = "s07.requested"

/** 결과 확인에서 누른 판정 한 장 — 그때의 확인대상 지문을 같이 둔다(대상이 바뀌면 발견 판정을 다시 받는다, 2회차 검수) */
export interface CaseJudgementPick {
  result: Judgement
  /** 판정 당시 확인대상 지문(`targetsKey`) */
  targets: string
}

/** 확인대상 한 켤레 */
export interface CaseTarget {
  /** 신발 ID — 문자열 그대로(앞자리 0 보존) */
  ftwrId: string
  /** 그 검색에서의 순위(모르면 null) */
  rank: number | null
  /** 유사도 퍼센트 0~100(모르면 null) */
  similarity: number | null
  /** 검색번호(문자열 — 「572433」). 모르면 null(시안 기본 검색) */
  searchNo: string | null
  /** 어디서 정했나 — 검색 결과 ★ 또는 정밀 대조 「확인대상」 */
  from: "search" | "compare"
}

/** 같은 후보인가(검색번호 + 신발 ID) */
export function sameTarget(a: Pick<CaseTarget, "ftwrId" | "searchNo">, b: Pick<CaseTarget, "ftwrId" | "searchNo">): boolean {
  return a.ftwrId === b.ftwrId && a.searchNo === b.searchNo
}

/** 넣기(이미 있으면 정밀 대조에서 정한 값으로 덮음 — 정밀 대조가 더 확실한 근거) */
export function addTarget(list: readonly CaseTarget[], t: CaseTarget): CaseTarget[] {
  const at = list.findIndex((x) => sameTarget(x, t))
  if (at < 0) return [...list, t]
  return list.map((x, i) => (i === at ? { ...x, ...t, from: x.from === "compare" ? "compare" : t.from } : x))
}

/** 빼기 */
export function removeTarget(list: readonly CaseTarget[], t: Pick<CaseTarget, "ftwrId" | "searchNo">): CaseTarget[] {
  return list.filter((x) => !sameTarget(x, t))
}

/** 판정 줄에 보일 대표 확인대상 — 정밀 대조에서 정한 것이 먼저, 그다음 순위가 높은 것 */
export function leadTarget(list: readonly CaseTarget[]): CaseTarget | undefined {
  return [...list].sort((a, b) => (a.from === b.from ? (a.rank ?? 1e9) - (b.rank ?? 1e9) : a.from === "compare" ? -1 : 1))[0]
}

/** 판정 당시 확인대상 묶음의 지문(판정 뒤 대상이 바뀌었는지 비교) */
export function targetsKey(list: readonly CaseTarget[]): string {
  return list
    .map((t) => `${t.searchNo ?? "-"}:${t.ftwrId}`)
    .sort()
    .join(",")
}
