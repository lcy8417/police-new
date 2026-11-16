import type { CaseListRow } from "@/widgets/case-list"
import type { CaseImageStatus, CaseWindowImage } from "@/widgets/case-window"
import type { SearchRun, SearchRunHit } from "@/widgets/pattern-code"
import type { ConfirmRow, ConfirmRowShoe, Judgement } from "@/widgets/result-confirm"

import {
  CASE_CROSS_REQUESTED_FIELD,
  CASE_JUDGEMENTS_FIELD,
  CASE_TARGETS_FIELD,
  imageScope,
  leadTarget,
  liveJudgement,
  readWork,
  targetsKey,
  workKey,
  writeWork,
  type CaseJudgementPick,
  type CaseTarget,
  type WorkStore,
} from "../frame"
import { sampleSoleUrl } from "../mock-assets/sample-images"
import { rankOfRun, S04_RUNS, S04_RUNS_FIELD } from "../s04/mock-cases"
import { S05_RUN_NO_FIELD } from "../s05/mock-cases"
import { makeCaseImages, makeConfirmRows } from "./mock-cases"

// 사건 창 작업 보관함(frame/work-memory) → 장 · 사건의 「지금」 상태(3회차 검수).
// 이미지 목록 알약 · 탭 표시 · 결과 확인 줄 · 사건관리 목록(결과 · 진행 · 단계)이 모두 이 한 규칙으로 본다 —
//   판정 = 누른 판정(없으면 처음 저장된 판정), 발견은 그때의 확인대상 지문이 지금과 같을 때만(liveJudgement)
//   판정이 없으면 검색 이력이 있으면 「검색됨」, 없으면 「등록」(문양 코드 탭에서 검색하면 바로 검색됨)
// 처음 값: 목록 상태가 등록 · 감정불능(가짜 = 검색 안 하고 불능)인 장은 검색 이력이 없고, 그 밖 장은 문양 코드 탭 처음 이력(S04_RUNS).

const STATUS_OF: Record<Judgement, CaseImageStatus> = { found: "발견", notFound: "불발견", unable: "감정불능" }

/** 처음(목록 가짜 값) 검색이 있었던 장 */
export const initiallySearched = (status: CaseImageStatus) => status !== "등록" && status !== "감정불능"

/** 처음 저장된 발견 판정의 확인대상(그 줄의 채택 신발) — 없으면 빈 목록 */
export function seedTargetsOf(row: ConfirmRow): CaseTarget[] {
  const s = row.shoe
  if (!s?.confirmed) return []
  return [{ ftwrId: s.ftwrId, rank: s.ranking, similarity: s.score, searchNo: row.searchNo, from: "compare" }]
}

/** 그 장의 검색 이력(보관함 → 없으면 처음 값) */
export function runsOf(store: WorkStore, scope: string, status: CaseImageStatus): readonly SearchRun[] {
  return readWork<SearchRun[]>(store, scope, S04_RUNS_FIELD) ?? (initiallySearched(status) ? S04_RUNS : [])
}

/** 그 장의 지금 검색 — 검색 결과 탭에서 마지막으로 본 검색(이력에 있으면), 없으면 가장 최근 검색 */
export function currentRunOf(store: WorkStore, scope: string, status: CaseImageStatus): SearchRun | undefined {
  const runs = runsOf(store, scope, status)
  const seen = readWork<number>(store, scope, S05_RUN_NO_FIELD)
  return runs.find((r) => r.searchNo === seen) ?? runs[0]
}

const hitsCache = new WeakMap<SearchRun, SearchRunHit[]>()
/** 검색 한 번의 순위(같은 이력 줄이면 한 번만 계산) */
export function hitsOf(run: SearchRun): SearchRunHit[] {
  let hits = hitsCache.get(run)
  if (!hits) {
    hits = rankOfRun(run)
    hitsCache.set(run, hits)
  }
  return hits
}

const percent = (score: number | null) => (score === null ? null : Math.round(score * 10000) / 100)

/**
 * 사건 창을 열 때 그 사건 장들의 처음 값(검색 이력 · 확인대상)을 보관함에 적는다(이미 있으면 그대로).
 * 문양 코드 · 검색 결과 · 정밀 대조 탭이 같은 처음 값을 보게 한다 — 검색 안 한 장에서 검색 결과 탭만 열어도 처음 이력으로 「검색됨」이 되던 것(3회차 검수)
 */
export function seedCaseWork(store: WorkStore, row: CaseListRow): void {
  const images = makeCaseImages(row)
  const rows = makeConfirmRows(row)
  images.forEach((img, i) => {
    const scope = imageScope(row.aprthngNo, img.no)
    if (!store.has(workKey(scope, S04_RUNS_FIELD))) writeWork(store, scope, S04_RUNS_FIELD, initiallySearched(img.status) ? S04_RUNS : [])
    if (!store.has(workKey(scope, CASE_TARGETS_FIELD))) writeWork(store, scope, CASE_TARGETS_FIELD, seedTargetsOf(rows[i]))
  })
}

/** 보관함에 이 사건 작업 값이 하나라도 있나(없으면 목록 값 그대로) */
function touched(store: WorkStore, aprthngNo: string): boolean {
  for (const k of store.keys()) if (k.startsWith(`${aprthngNo}|`) || k.startsWith(`${aprthngNo}#`)) return true
  return false
}

/** 목록 행 하나의 지금 값(이 사건을 사건 창에서 손대지 않았으면 그대로) */
export function liveRowOf(store: WorkStore, row: CaseListRow): CaseListRow {
  return touched(store, row.aprthngNo) ? liveCaseOf(store, row).row : row
}

export interface LiveCase {
  /** 지금 상태를 반영한 목록 행(결과 · 진행 · 단계) */
  row: CaseListRow
  /** 이미지 목록(알약 = 지금 상태) */
  images: CaseWindowImage[]
  /** 결과 확인 줄(판정은 처음 저장 값 — 누른 판정은 결과 확인 탭이 liveJudgement 로 얹는다) */
  confirmRows: ConfirmRow[]
  targetKeys: Record<string, string>
  baseTargetKeys: Record<string, string>
  /** 장마다 지금 검색번호 */
  runOf: Record<string, string>
}

/** 사건 하나의 지금 상태 */
export function liveCaseOf(store: WorkStore, row: CaseListRow): LiveCase {
  const base = makeCaseImages(row)
  const baseRows = makeConfirmRows(row)
  const no = row.aprthngNo
  const picks = readWork<Record<string, CaseJudgementPick>>(store, no, CASE_JUDGEMENTS_FIELD) ?? {}
  const crossAsked = readWork<boolean>(store, no, CASE_CROSS_REQUESTED_FIELD) === true
  const targetKeys: Record<string, string> = {}
  const baseTargetKeys: Record<string, string> = {}
  const runOf: Record<string, string> = {}
  const images: CaseWindowImage[] = []
  const confirmRows: ConfirmRow[] = []
  base.forEach((img, i) => {
    const baseRow = baseRows[i]
    const scope = imageScope(no, img.no)
    const seed = seedTargetsOf(baseRow)
    const list = readWork<readonly CaseTarget[]>(store, scope, CASE_TARGETS_FIELD) ?? seed
    targetKeys[img.no] = targetsKey(list)
    baseTargetKeys[img.no] = targetsKey(seed)
    const pick = picks[img.no]
    const judged = liveJudgement(baseRow.judgement, baseTargetKeys[img.no], pick, targetKeys[img.no])
    const run = currentRunOf(store, scope, img.status)
    if (run) runOf[img.no] = String(run.searchNo)
    const status: CaseImageStatus = judged.judgement
      ? pick
        ? STATUS_OF[judged.judgement]
        : img.status
      : run
        ? "검색됨"
        : "등록"
    images.push(status === img.status ? img : { ...img, status })

    // 결과 확인 줄: 대표 확인대상(정밀 대조에서 정한 것 먼저) + 「외 n」, 확인대상이 없으면 지금 검색 1위 후보(참고 — 발견 근거 아님)
    const lead = leadTarget(list)
    const searchNo = run ? String(run.searchNo) : baseRow.searchNo
    let shoe: ConfirmRowShoe | null = null
    if (lead) {
      shoe = {
        ftwrId: lead.ftwrId,
        image: sampleSoleUrl(lead.ftwrId, { kind: "shoe" }),
        // 점수를 모르면 0 이 아니라 「—」
        score: lead.similarity,
        ranking: lead.rank ?? 1,
        confirmed: true,
      }
    } else if (run) {
      const top = hitsOf(run)[0]
      shoe = top ? { ftwrId: top.ftwrId, image: sampleSoleUrl(top.ftwrId, { kind: "shoe" }), score: percent(top.score), ranking: 1, confirmed: false } : null
    }
    confirmRows.push({
      ...baseRow,
      searchNo: lead?.searchNo ?? searchNo,
      shoe,
      ...(lead ? { moreTargets: list.length - 1 } : {}),
    })
  })

  if (!touched(store, no)) return { row, images, confirmRows, targetKeys, baseTargetKeys, runOf }
  const count = (s: CaseImageStatus) => images.filter((i) => i.status === s).length
  const registered = count("등록")
  const searched = count("검색됨")
  const confirmed = images.length - registered - searched
  const results = { found: count("발견"), missed: count("불발견"), unable: count("감정불능") }
  const caseResult =
    results.found > 0
      ? "발견"
      : confirmed > 0 && results.missed === 0 && results.unable > 0 && count("확인") === 0
        ? "감정불능"
        : confirmed > 0
          ? "불발견"
          : ""
  const stage = crossAsked && (row.stage ?? -1) <= 0 ? 1 : row.stage
  return {
    row: { ...row, progress: { registered, searched, confirmed }, results, caseResult, stage },
    images,
    confirmRows,
    targetKeys,
    baseTargetKeys,
    runOf,
  }
}
