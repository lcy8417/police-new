import { Fragment } from "react"
import { ChevronRight } from "lucide-react"

import type { AdminSession, LogoutReason } from "@/entities/admin"
import { formatKstDateTime } from "@/shared/lib"
import { cn } from "@/shared/lib/utils"
import { StatePill } from "@/shared/ui/kit"

import type { SessionTimeline as Timeline } from "../model/types"
import { SessionTimeline } from "./SessionTimeline"

const LOGOUT_REASON_LABELS: Record<LogoutReason, string> = {
  LOGOUT: "로그아웃",
  IDLE: "시간 초과",
  EXPIRED: "만료",
  ADMIN: "관리자 종료",
  PASSWORD_RESET: "비밀번호 초기화",
}

const ALL_COLUMNS = [
  // 펼침 단추 열 — 빈 머리칸이 아니라 화면 읽기 이름을 둔다(3회차 검수)
  { key: "expand", label: "펼침", right: false },
  { key: "user", label: "사용자", right: false },
  { key: "login", label: "로그인", right: false },
  { key: "logout", label: "로그아웃", right: false },
  { key: "reason", label: "종료 사유", right: false },
  { key: "ip", label: "IP", right: false },
  { key: "events", label: "이벤트 수", right: true },
  { key: "fails", label: "실패 수", right: true },
]

// R6: 로망 목록 표 결(ListHeadRow · ListRow 와 같은 값) — 머리 32 · 흰 바탕 · 10.5 보통 회색, 줄 12 · 아래 1px 선
const TH = "h-8 border-b border-solid border-border bg-panel px-[10px] text-[10.5px] font-normal whitespace-nowrap text-muted-foreground"
const TD = "border-b border-solid border-border px-[10px] text-fg-2"

interface SessionTableProps {
  sessions: AdminSession[]
  timelines: Record<string, Timeline>
  onRetryTimeline: (sessionId: string) => void
  expandedSessionIds: string[]
  onToggleSession: (sessionId: string, open: boolean) => void
  /** 보일 열 key(r3). 없으면 전부. 펼침 칸 · 사용자는 항상 보인다 */
  visibleColumns?: string[]
  /** 빈 표 글자(거른 결과 0건 안내는 쓰는 쪽이 따로 그린다) */
  emptyText?: string
}

/**
 * 로그인 기록 표. DataGrid 에는 행 펼침이 없어(노트에 요청) 같은 토큰으로 이 화면 안에서 그린다.
 * 펼침은 펼칠 때 기능 기록을 불러와야 해서 제어형(expandedSessionIds + onToggleSession)이다.
 */
export function SessionTable({ sessions, timelines, onRetryTimeline, expandedSessionIds, onToggleSession, visibleColumns, emptyText = "결과 없음" }: SessionTableProps) {
  const expanded = new Set(expandedSessionIds)
  const COLUMNS = ALL_COLUMNS.filter((c) => c.key === "expand" || c.key === "user" || !visibleColumns || visibleColumns.includes(c.key))
  const show = (key: string) => COLUMNS.some((c) => c.key === key)

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr>
            {COLUMNS.map((c) => (
              <th key={c.key} scope="col" className={cn(TH, c.right ? "text-right" : "text-left")}>
                {c.key === "expand" ? <span className="sr-only">{c.label}</span> : c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sessions.length === 0 ? (
            <tr>
              <td colSpan={COLUMNS.length} className="h-[44px] border-b border-solid border-line-2 text-center text-muted-foreground">
                {emptyText}
              </td>
            </tr>
          ) : (
            sessions.map((s) => {
              const open = expanded.has(s.sessionId)
              return (
                <Fragment key={s.sessionId}>
                  <tr data-open={open || undefined} className={cn(open ? "bg-brand-bg" : "hover:bg-brand-bg/60")}>
                    <td className={cn(TD, "h-[40px] w-[40px] pl-[10px]")}>
                      <button
                        type="button"
                        // 줄마다 다른 이름(누구의 어느 로그인인지 — 같은 이름 단추 50개이던 것, 3회차 검수)
                        aria-label={`${s.userNm} ${formatKstDateTime(s.loginDt)} 로그인 기능 기록 펼치기`}
                        aria-expanded={open}
                        onClick={() => onToggleSession(s.sessionId, !open)}
                        className="grid size-[26px] cursor-pointer place-items-center rounded-[6px] border-0 bg-transparent text-dim hover:text-brand"
                      >
                        <ChevronRight aria-hidden="true" className={cn("size-[14px]", open && "rotate-90 text-brand")} />
                      </button>
                    </td>
                    <td className={cn(TD, "h-auto py-[6px] whitespace-normal")}>
                      <span className="break-all font-bold text-foreground">{s.userNm}</span>{" "}
                      <span className="font-code text-[11px] break-all text-dim">{s.userId}</span>
                    </td>
                    {show("login") && <td className={cn(TD, "font-code text-[11px] whitespace-nowrap tabular-nums")}>{formatKstDateTime(s.loginDt)}</td>}
                    {show("logout") && (
                      <td className={cn(TD, "whitespace-nowrap")}>
                        {s.logoutDt ? (
                          <span className="font-code text-[11px] tabular-nums">{formatKstDateTime(s.logoutDt)}</span>
                        ) : (
                          <StatePill tone="fact" className="bg-ok-bg text-ok-fg">
                            사용 중
                          </StatePill>
                        )}
                      </td>
                    )}
                    {show("reason") && <td className={cn(TD, "whitespace-nowrap text-muted-foreground")}>{s.logoutReason ? LOGOUT_REASON_LABELS[s.logoutReason] : "—"}</td>}
                    {show("ip") && <td className={cn(TD, "h-auto py-[6px] font-code text-[11px] whitespace-normal break-all text-muted-foreground")}>{s.ipAddr ?? "—"}</td>}
                    {show("events") && <td className={cn(TD, "text-right font-code tabular-nums")}>{s.eventCnt}</td>}
                    {show("fails") && <td className={cn(TD, "text-right font-code tabular-nums", s.failCnt > 0 ? "font-semibold text-danger" : "text-faint")}>{s.failCnt}</td>}
                  </tr>
                  {open && (
                    <tr>
                      <td colSpan={COLUMNS.length} className="border-b border-solid border-line-2 bg-[var(--t-bg-2)] py-[8px] pr-[14px] pl-[34px]">
                        <SessionTimeline timeline={timelines[s.sessionId]} onRetry={() => onRetryTimeline(s.sessionId)} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
