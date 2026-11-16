import type { CaseListRow } from "@/widgets/case-list"
import type {
  CaseFlowState,
  CaseWindowImage,
  CaseWindowStage,
  CaseWindowTab,
  CaseWindowTabMark,
  CaseWindowTarget,
  CaseWindowTask,
} from "@/widgets/case-window"

// 사건 창 「어디까지 왔나 · 지금 할 일」의 가짜 값 — 목록 행(mock-cases)의 숫자에서만 만들어 서로 맞게 한다(2026-11-16 사용자 「응」).
// 단계 띠 6칸 · 지금 단계 · 할 일 상자 · 탭 표시 · AI 점검 항목 · S02 사건 정보 빈 칸이 모두 같은 사건 값(장수 · 진행 · 결과 · 단계)에서 나온다.
//
// 지금 단계(목록 「사건 진행」 = row.stage 와 같은 근거):
//   stage 없음/-1(이미지 확인 중) → AI 1차 작업이 도는 중이거나 검색 · 확인한 장이 없으면 「1차 작업」, 아니면 「검색·판정」
//   0 검증요청 · 1 교차 검증 → 「교차 검증」 · 2 감정서 → 「감정서」 · 3 결재 → 「결재」 · 4 결재완료 → 「결재」(다 끝남)
// 할 일(지금 단계 것만, 순서 = 할 차례, 첫 남은 것이 「지금」):
//   1차 작업 = 사건 정보 빈 칸 + (+α) AI 1차 작업 점검 항목(같은 사진 의심 · 전사판 반전 · 흐린 사진 · 자 인식) — 번호는 그 사건 장수 안에서만
//   검색·판정 = 미검색 이미지 n장 · 판정 안 한 이미지 n장 / 교차 검증 = 결과 확인 검토 ✓ · 교차 검증 의견
//   감정서 = 결과 확인 검토 ✓ · 감정서 쓰기 · 감정서 확인 / 결재 = 결과 확인 검토 ✓ · 감정서 확인 ✓ · 결재 올리기
//   할 일이 4개를 넘으면 끝난 것부터 뺀다.

/** 6단계 이름(S02 단계 스텝퍼와 같은 말) */
export const FLOW_STAGES = ["접수", "1차 작업", "검색·판정", "교차 검증", "감정서", "결재"] as const

/** 단계 칸을 누르면 갈 대표 탭 */
const STAGE_TAB: readonly CaseWindowTab[] = ["info", "edit", "search", "confirm", "confirm", "confirm"]

const JUDGED = new Set(["확인", "발견", "불발견", "감정불능"])

/** 지금 단계(FLOW_STAGES 번호) */
export function flowStageOf(row: Pick<CaseListRow, "stage" | "ai" | "progress">): number {
  const s = row.stage ?? -1
  if (s < 0) return row.ai?.state === "running" || row.progress.searched + row.progress.confirmed === 0 ? 1 : 2
  return [3, 3, 4, 5, 5][s] ?? 5
}

/** 결재까지 다 끝난 사건(목록 「결재완료」) */
export const isFlowFinished = (row: Pick<CaseListRow, "stage">) => (row.stage ?? -1) >= 4

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
  tasks: CaseWindowTask[]
  infoBlanks: number
  ai: AiIssues | null
}

const task = (id: string, label: string, note: string, state: CaseFlowState, target: CaseWindowTarget, hint: string, ai = false): CaseWindowTask => ({
  id,
  label,
  note,
  state,
  target,
  hint,
  ...(ai ? { ai } : {}),
})

/** 사건 하나의 단계 띠 · 할 일. plus=false 면 AI 출처 할 일을 뺀다(단계 띠 · 사람 할 일은 그대로) */
export function caseFlowOf(row: CaseListRow, images: readonly CaseWindowImage[], plus: boolean): CaseFlow {
  const current = flowStageOf(row)
  const finished = isFlowFinished(row)
  const n = images.length
  const firstOf = (status: string) => images.find((i) => i.status === status)?.no
  const unsearched = images.filter((i) => i.status === "등록").length
  const unjudged = images.filter((i) => i.status === "검색됨").length
  const judged = images.filter((i) => JUDGED.has(i.status)).length
  const infoBlanks = infoBlanksOf(row)
  const ai = aiIssuesOf(row, n)
  const confirm: CaseWindowTarget = { tab: "confirm" }

  let tasks: CaseWindowTask[]
  if (current === 1) {
    tasks = [task("info-blank", "사건 정보 빈 칸", infoBlanks > 0 ? `${infoBlanks}칸 · 채취 방법` : "없음", infoBlanks > 0 ? "pending" : "done", { tab: "info" }, "필수 칸 채우기")]
    if (plus && ai) {
      if (ai.duplicate) tasks.push(task("ai-duplicate", "같은 사진?", `_${ai.duplicate[0]} ↔ _${ai.duplicate[1]}`, "pending", { tab: "edit", img: ai.duplicate[1] }, "크기·그림 98% 같음 — 지울지 정하기", true))
      if (ai.flip.length > 0) tasks.push(task("ai-flip", "전사판 반전", ai.flip.map((x) => `_${x}`).join(" "), "pending", { tab: "edit", img: ai.flip[0] }, "전사판 사진 — 좌우반전 적용", true))
      if (ai.blur) tasks.push(task("ai-blur", "흐린 사진", `_${ai.blur} · 재촬영?`, "problem", { tab: "edit", img: ai.blur }, "윤곽 판독 어려움 — 보류 · 재촬영 요청", true))
      tasks.push(task("ai-ruler", "자 인식", `${ai.ruler}/${n}장`, "done", { tab: "edit" }, "기울기 보정값 준비", true))
    }
  } else if (current === 2) {
    tasks = [
      task("unsearched", "미검색 이미지", `${unsearched}장`, unsearched > 0 ? "pending" : "done", { tab: "search", img: firstOf("등록") }, "검색 안 한 첫 이미지의 검색 결과"),
      task("unjudged", "판정 안 한 이미지", `${unjudged}장`, unjudged > 0 ? "pending" : "done", { tab: "search", img: firstOf("검색됨") }, "검색만 하고 판정 안 한 첫 이미지"),
    ]
  } else if (current === 3) {
    tasks = [
      task("review", "결과 확인 검토", "끝", "done", confirm, "사건 전체 결과 확인"),
      task("cross", "교차 검증 의견", row.crossReviewer ? `${row.crossReviewer} 확인 중` : "검증자 확인 중", "pending", confirm, "교차 검증 의견 받기"),
    ]
  } else if (current === 4) {
    tasks = [
      task("review", "결과 확인 검토", "끝", "done", confirm, "사건 전체 결과 확인"),
      task("report-write", "감정서 쓰기", "아직", "pending", confirm, "결과 확인에서 감정서로"),
      task("report-check", "감정서 확인", "아직", "pending", confirm, "감정서 확인"),
    ]
  } else {
    tasks = [
      task("review", "결과 확인 검토", "끝", "done", confirm, "사건 전체 결과 확인"),
      task("report-check", "감정서 확인", "끝", "done", confirm, "감정서 확인"),
      task("approve", "결재 올리기", finished ? "끝" : "아직", finished ? "done" : "pending", confirm, "결재 올리기"),
    ]
  }
  // 할 일이 4개를 넘으면 끝난 것부터 뺀다
  if (tasks.length > 4) tasks = [...tasks.filter((t) => t.state !== "done"), ...tasks.filter((t) => t.state === "done")].slice(0, 4)
  // 첫 남은 할 일 = 지금
  const first = tasks.find((t) => t.state !== "done")
  tasks = tasks.map((t) => (t === first ? { ...t, now: true, note: t.note === "아직" ? "지금" : `${t.note} · 지금` } : t))
  const left = tasks.filter((t) => t.state !== "done").length

  const stages: CaseWindowStage[] = FLOW_STAGES.map((name, i) => {
    const target: CaseWindowTarget =
      i === 2 ? { tab: "search", img: firstOf("등록") ?? firstOf("검색됨") } : { tab: STAGE_TAB[i] }
    if (i < current || (i === current && finished)) return { name, state: "done", note: "끝", target }
    if (i === current) {
      return { name, state: "pending", note: left > 0 ? `${left}개 남음` : "끝", dot: tasks.some((t) => t.state === "problem"), target }
    }
    // 뒤 단계 — 병렬로 먼저 한 몫이 있으면 그 수를 보인다(1차 작업 중 검색·판정)
    if (i === 2 && judged > 0) return { name, state: "pending", note: `판정 ${judged}/${n}`, target }
    return { name, state: "pending", note: "아직", target }
  })

  return { stages, currentStage: current, tasks, infoBlanks, ai: plus ? ai : null }
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
