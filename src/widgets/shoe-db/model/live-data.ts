import type { Shoe } from "@/entities/shoe"
// 배럴(`@/entities/shoe`)은 통합 담당 파일 — 새 이름은 통합 때 배럴로 옮긴다(sprint-notes)
import type { ShoeListFilters, ShoeStages } from "@/entities/shoe/model/types"

import type { ShoeCardInfo, ShoeDbFilters, ShoeStageSummary, ShoeWorkStatus } from "./types"

/**
 * 서버 값(B 단계 J1 · J8) → 신발 DB 위젯 props. 위젯 모양은 그대로, 가짜 값 자리에 실제 값만 꽂는다(화면 이식 계획 §2 s10).
 */

/** 「오늘 승인」 기준 매수(B4 「하루 약 50매」) — 보여 주기만 하고 막지 않는다(서버 §4-10) */
export const SHOE_DAILY_APPROVE_LIMIT = 50

/** 작업 단계 칩(뚜껑) 값 = 서버 J1 `stage` · J8 key */
export type ShoeStageKey = "pattern" | "group" | "approve"

export const SHOE_STAGE_LABEL: Record<ShoeStageKey, string> = {
  pattern: "문양 대기",
  group: "그룹 대기",
  approve: "승인 대기",
}

/** 상세 조건 양식 + 작업 단계 칩 → J1 · J2 거르기. 빈 값 · 「전체」는 보내지 않는다 */
export function toShoeListFilters(f: ShoeDbFilters | null, stage: ShoeStageKey | null): ShoeListFilters {
  const out: ShoeListFilters = {}
  if (f) {
    const put = <K extends keyof ShoeListFilters>(key: K, value: ShoeListFilters[K] | null | undefined) => {
      if (typeof value === "string" && value.trim() !== "" && value !== "all") out[key] = value.trim() as ShoeListFilters[K]
    }
    put("ftwrId", f.ftwrId)
    put("makrCode", f.makrCode)
    put("brandCode", f.brandCode)
    put("sex", f.sex)
    put("registFrom", f.regFrom)
    put("registTo", f.regTo)
    put("approval", f.approval)
    put("patternInput", f.patternInput)
    put("groupNm", f.groupNm)
    put("registOrg", f.office)
  }
  if (stage) out.stage = stage
  return out
}

const KNOWN_STATUS: readonly ShoeWorkStatus[] = ["문양 대기", "승인 대기", "측면 없음"]

/** 카드 · 창 머리에 보일 작업 상태 하나 — 문양 · 승인 대기가 먼저, 그다음 측면 없음. 할 일이 없으면(승인 · 측면 있음) 없음 */
export function primaryWorkStatus(shoe: Pick<Shoe, "workStatus">): ShoeWorkStatus | undefined {
  const list = shoe.workStatus ?? []
  return KNOWN_STATUS.find((s) => list.includes(s))
}

/** 목록 → 카드 작업 상태(J1 `work_status`). AI 표식(mark)은 서버에 저장하지 않으므로 없다(서버 §9-1 ⑤) */
export function toCardInfo(shoes: readonly Shoe[]): Record<string, ShoeCardInfo> {
  const out: Record<string, ShoeCardInfo> = {}
  for (const s of shoes) {
    const status = primaryWorkStatus(s)
    if (status) out[s.ftwrId] = { status }
  }
  return out
}

const STAGE_ROWS: { key: string; title: string; owner: string }[] = [
  { key: "pattern", title: "등록됨 · 문양 대기", owner: "등록 담당 → 문양 입력 담당" },
  { key: "group", title: "문양 입력됨 · 그룹 대기", owner: "그룹 담당" },
  { key: "approve", title: "승인 대기", owner: "승인 담당" },
  { key: "approved", title: "승인", owner: "신발 DB 확정(이번 달)" },
]

const BACKLOG_PARTS: { key: string; label: string; tone: "line" | "violet" | "blue" }[] = [
  { key: "pattern", label: "문양 대기", tone: "line" },
  { key: "group", label: "그룹 대기", tone: "violet" },
  { key: "approve", label: "승인 대기", tone: "blue" },
]

/** J8 → 작업 단계 줄. active = 지금 걸린 작업 단계 칩 */
export function toStageSummary(data: ShoeStages, active: ShoeStageKey | null): ShoeStageSummary {
  const countOf = (rows: { key: string; count: number }[], key: string) => rows.find((r) => r.key === key)?.count ?? 0
  return {
    stages: STAGE_ROWS.map((row) => ({
      title: row.title,
      owner: row.owner,
      count: countOf(data.stages, row.key),
      active: active !== null && row.key === active,
    })),
    backlog: {
      monthLabel: `${data.backlog.month} 미승인`,
      total: data.backlog.total,
      parts: BACKLOG_PARTS.map((p) => ({ label: p.label, tone: p.tone, count: countOf(data.backlog.parts, p.key) })),
      todayDone: data.todayApproved,
      todayLimit: SHOE_DAILY_APPROVE_LIMIT,
      note: `하루 ${SHOE_DAILY_APPROVE_LIMIT}매 기준(막지 않음)`,
    },
  }
}
