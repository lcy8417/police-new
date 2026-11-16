import type { CaseListRow } from "@/widgets/case-list"
import type { CaseWindowImage, CaseWindowStage, CaseWindowTab, CaseWindowTabMark } from "@/widgets/case-window"
import type { CrossReviewState } from "@/widgets/result-confirm"

import { makeConfirmRows } from "./mock-cases"

// 사건 창 머리 흐름 한 줄 · 탭 표시 · S02 값의 가짜 값 — 목록 행(mock-cases)의 숫자에서만 만들어 서로 맞게 한다.
// 11/16 사용자 「이 단계에서 할 일은 없애고 … 그냥 플로우가 이렇다 이정도만. 결재는 없어」 — 흐름 5칸, 할 일 상자 없음.
//
// 지금 단계(목록 「사건 진행」 = row.stage 와 같은 근거):
//   stage 없음/-1(이미지 확인 중) → AI 1차 작업이 도는 중이거나 검색 · 확인한 장이 없으면 「1차 작업」, 아니면 「검색·판정」
//   0 검증요청 전 → 「검색·판정」 · 1 교차 검증 → 「교차 검증」 · 2 감정서 → 「감정서」 · 3 이상(목록 옛 말 「결재」 · 「결재완료」) → 「감정서」 끝(다 끝남)

/** 흐름 5칸 이름(결재 없음) */
export const FLOW_STAGES = ["접수", "1차 작업", "검색·판정", "교차 검증", "감정서"] as const

const JUDGED = new Set(["확인", "발견", "불발견", "감정불능"])

/** 지금 단계(FLOW_STAGES 번호) */
export function flowStageOf(row: Pick<CaseListRow, "stage" | "ai" | "progress">): number {
  const s = row.stage ?? -1
  // 0 = 교차 검증 요청 전(목록 「검증요청 전」) — 아직 검색·판정 단계, 판정도 잠기지 않는다(3회차 검수 — 창은 교차 검증 중으로 보던 것)
  if (s === 0) return 2
  if (s < 0) return row.ai?.state === "running" || row.progress.searched + row.progress.confirmed === 0 ? 1 : 2
  return s <= 1 ? 3 : 4
}

/** 감정서까지 다 끝난 사건 */
export const isFlowFinished = (row: Pick<CaseListRow, "stage">) => (row.stage ?? -1) >= 3

/** (+α) AI 1차 작업 점검이 찾은 것 — 1차 작업 단계에서만, 번호는 장수 안에서만 */
export interface AiIssues {
  /** 같은 사진 의심 [원본, 의심] */
  duplicate?: readonly [string, string]
  /** 전사판(좌우반전 필요) 장 */
  flip: readonly string[]
  /** 흐린 사진 */
  blur?: string
  /** 자 인식된 장 수 */
  ruler: number
}

export function aiIssuesOf(row: CaseListRow, imageCount: number): AiIssues | null {
  if (flowStageOf(row) !== 1) return null
  const inRange = (n: number) => n <= imageCount
  return {
    duplicate: inRange(5) ? ["4", "5"] : undefined,
    flip: ["2", "7"].filter((n) => inRange(Number(n))),
    blur: inRange(9) ? "9" : undefined,
    ruler: Math.max(0, imageCount - 1),
  }
}

/** 사건 정보 필수 빈 칸 수(채취 방법) — 1차 작업 중인 사건만 남아 있다 */
export const infoBlanksOf = (row: CaseListRow) => (flowStageOf(row) === 1 ? 1 : 0)

export interface CaseFlow {
  stages: CaseWindowStage[]
  currentStage: number
  infoBlanks: number
  ai: AiIssues | null
}

/** 사건 하나의 흐름 5칸(끝 · 지금 · 아직) — 다 끝난 사건은 5칸 모두 끝. plus=false 면 AI 점검 값을 비운다 */
export function caseFlowOf(row: CaseListRow, images: readonly CaseWindowImage[], plus: boolean): CaseFlow {
  const current = flowStageOf(row)
  const finished = isFlowFinished(row)
  const stages: CaseWindowStage[] = FLOW_STAGES.map((name, i) => ({
    name,
    state: i < current || (i === current && finished) ? "done" : i === current ? "now" : "todo",
  }))
  return { stages, currentStage: current, infoBlanks: infoBlanksOf(row), ai: plus ? aiIssuesOf(row, images.length) : null }
}

/** 의뢰관서 → 사건주소 앞부분(가짜) */
const CITY: Record<string, string> = {
  대구청: "대구광역시 동구",
  서울청: "서울특별시 강서구",
  경북청: "경상북도 포항시",
  부산청: "부산광역시 해운대구",
  경기남부청: "경기도 화성시",
  인천청: "인천광역시 미추홀구",
}

/** 사건 창 「사건 정보」 탭(S02 내용)에 넘기는 그 사건 값 — 장수 · 폼 · 잠긴 SCAS 칸 · 전사판 장이 목록 행 · 단계와 맞게 */
export function s02FactsOf(row: CaseListRow, flow: CaseFlow, imageCount: number, img: string | null) {
  const office = `${row.requestOffice} › ${row.occurOffice}`
  return {
    imageCount,
    form: {
      aprthngSn: img ?? "1",
      rqestGrfcNm: office,
      crimeNm: row.caseName,
      // 필수 빈 칸(채취 방법)이 남은 사건만 「기타」(확인 필요) — 나머지는 채워진 값
      pickMthCode: flow.infoBlanks > 0 ? "기타" : "전사판채취법",
    },
    pending: {
      문서번호: row.docNo || "—",
      SCAS사건번호: row.scasNo || "—",
      "용의자 유무": row.suspect,
      발생관서: office,
      사건주소: `${CITY[row.requestOffice] ?? "○○시"} ○○로 ○○`,
      사건개요: `${row.caseName} 사건 — 의뢰 공문 개요(가짜)`,
    },
    flipRefs: flow.ai?.flip ?? [],
  }
}

/** 사건 창 「결과 확인」 탭(S07 내용)에 넘기는 그 사건 값 — 판정 줄은 이미지 목록에서, 교차 검증 상태는 흐름 단계에서 */
export function s07FactsOf(row: CaseListRow, flow: CaseFlow) {
  const s = row.stage ?? -1
  const crossReview: CrossReviewState = s <= 0 ? "none" : s === 1 ? "requested" : "done"
  return {
    aprthngNo: row.aprthngNo,
    rows: makeConfirmRows(row),
    crossReview,
    /** 요청한 교차 검증자 이름(목록 행 값) — 요청 전이면 없음 */
    crossReviewer: crossReview === "none" ? undefined : (row.crossReviewer ?? "김○○ 경위"),
    lockedReason:
      crossReview === "none" ? undefined : flow.currentStage >= 4 ? "교차 검증이 끝나 판정이 잠겼습니다" : "교차 검증 중에는 판정을 바꿀 수 없습니다",
  }
}

export type S07Facts = ReturnType<typeof s07FactsOf> & {
  /** 장마다 지금 확인대상 지문(`targetsKey`) — 판정 뒤 대상이 바뀌면 발견 판정을 다시 받는다(2회차 검수) */
  targetKeys?: Readonly<Record<string, string>>
  /** 장마다 처음(저장된 판정 당시) 확인대상 지문 — 처음 발견 줄도 대상이 바뀌면 다시 판정(3회차 검수) */
  baseTargetKeys?: Readonly<Record<string, string>>
  /** 장마다 그 장에서 마지막으로 본 검색번호(검색 결과 탭) — 「열기」가 그 검색으로 */
  runOf?: Readonly<Record<string, string>>
}

/** 고른 이미지 기준 탭 표시(사건 정보 = 사건 빈 칸 수, 결과 확인 = 사건 전체) */
export function tabMarksOf(
  flow: CaseFlow,
  images: readonly CaseWindowImage[],
  selectedImage: string | null
): Partial<Record<CaseWindowTab, CaseWindowTabMark>> {
  const img = images.find((i) => i.no === selectedImage)
  const marks: Partial<Record<CaseWindowTab, CaseWindowTabMark>> = {
    info: flow.infoBlanks > 0 ? { kind: "blanks", count: flow.infoBlanks } : { kind: "done" },
  }
  if (img) {
    const issue = flow.ai !== null && [flow.ai.duplicate?.[1], flow.ai.blur, ...flow.ai.flip].includes(img.no)
    if (issue) marks.edit = { kind: "problem" }
    else if (flow.currentStage > 1 || img.status !== "등록") marks.edit = { kind: "done" }
    if (img.status !== "등록") marks.pattern = { kind: "done" }
    if (JUDGED.has(img.status)) marks.search = { kind: "done" }
    if (img.status === "발견") marks.compare = { kind: "done" }
    else if (img.status === "불발견" || img.status === "감정불능") marks.compare = { kind: "notApplicable" }
  }
  const unconfirmed = images.filter((i) => !JUDGED.has(i.status)).length
  marks.confirm = flow.currentStage >= 3 ? { kind: "done" } : { kind: "count", count: unconfirmed }
  return marks
}
