import type { AdminEvent, AdminSession } from "@/entities/admin"

// S14 빠른 검색(r3): 지금 보이는 쪽의 행만 거른다(서버 조회 아님). 아이디 · 기능 · 대상 번호.
const has = (text: string | null | undefined, q: string) => (text ?? "").toLowerCase().includes(q)

export function quickFilterSessions(rows: readonly AdminSession[], query: string): AdminSession[] {
  const q = query.trim().toLowerCase()
  if (!q) return [...rows]
  return rows.filter((s) => has(s.userId, q) || has(s.userNm, q))
}

export function quickFilterEvents(rows: readonly AdminEvent[], query: string): AdminEvent[] {
  const q = query.trim().toLowerCase()
  if (!q) return [...rows]
  return rows.filter((e) => has(e.userId, q) || has(e.userNm, q) || has(e.actionNm, q) || has(e.targetId, q))
}

/** 로그인 기록 표 열(SCAS 순서). 펼침 칸은 항상 있고, 사용자(아이디)는 잠금 */
export const SESSION_COLUMNS = [
  { key: "user", label: "사용자", locked: true },
  { key: "login", label: "로그인" },
  { key: "logout", label: "로그아웃" },
  { key: "reason", label: "종료 사유" },
  { key: "ip", label: "IP" },
  { key: "events", label: "이벤트 수" },
  { key: "fails", label: "실패 수" },
] as const

/** 기능 기록 표 열(SCAS 순서). 사용자(아이디)는 잠금 */
export const EVENT_COLUMN_DEFS = [
  { key: "at", label: "시각" },
  { key: "user", label: "사용자", locked: true },
  { key: "action", label: "기능" },
  { key: "target", label: "대상" },
  { key: "result", label: "결과" },
  { key: "ms", label: "처리 시간" },
] as const

export const LOG_PAGE_SIZES = [50, 100] as const
