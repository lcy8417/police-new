import { Fragment, useState } from "react"
import { ChevronRight } from "lucide-react"

import type { AdminSession, LogoutReason } from "@/entities/admin"
import { formatKstDateTime } from "@/shared/lib"
import { cn } from "@/shared/lib/utils"
import { Chip } from "@/shared/ui/kit"

import type { SessionTimeline as Timeline } from "../model/types"
import { SessionTimeline } from "./SessionTimeline"

const LOGOUT_REASON_LABELS: Record<LogoutReason, string> = {
  LOGOUT: "로그아웃",
  IDLE: "시간 초과",
  EXPIRED: "만료",
  ADMIN: "관리자 종료",
  PASSWORD_RESET: "비밀번호 초기화",
}

const COLUMNS = [
  { label: "", right: false },
  { label: "사용자", right: false },
  { label: "로그인", right: false },
  { label: "로그아웃", right: false },
  { label: "종료 사유", right: false },
  { label: "IP", right: false },
  { label: "이벤트 수", right: true },
  { label: "실패 수", right: true },
]

const TH = "h-[34px] border-b border-solid border-border bg-strip px-[10px] text-[11.5px] font-semibold whitespace-nowrap text-muted-foreground"
const TD = "border-b border-solid border-line-2 px-[10px] text-fg-2"

interface SessionTableProps {
  sessions: AdminSession[]
  timelines: Record<string, Timeline>
  onRetryTimeline: (sessionId: string) => void
}

/**
 * 로그인 기록 표. DataGrid 에는 행 펼침이 없어(노트에 요청) 같은 토큰으로 이 화면 안에서 그린다.
 * 펼침/접힘은 저장되지 않는 화면 내부 상태라 안에 둔다.
 */
export function SessionTable({ sessions, timelines, onRetryTimeline }: SessionTableProps) {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set())
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr>
            {COLUMNS.map((c, i) => (
              <th key={i} scope="col" className={cn(TH, c.right ? "text-right" : "text-left")}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sessions.length === 0 ? (
            <tr>
              <td colSpan={COLUMNS.length} className="h-[44px] border-b border-solid border-line-2 text-center text-muted-foreground">
                결과 없음
              </td>
            </tr>
          ) : (
            sessions.map((s) => {
              const open = expanded.has(s.sessionId)
              return (
                <Fragment key={s.sessionId}>
                  <tr aria-selected={open || undefined} className={cn(open ? "bg-brand-bg" : "hover:bg-panel-2")}>
                    <td className={cn(TD, "h-[44px] w-[40px] pl-[10px]")}>
                      <button
                        type="button"
                        aria-label="기능 기록 펼치기"
                        aria-expanded={open}
                        onClick={() => toggle(s.sessionId)}
                        className="grid size-[26px] cursor-pointer place-items-center rounded-[6px] border-0 bg-transparent text-dim hover:text-brand"
                      >
                        <ChevronRight aria-hidden="true" className={cn("size-[14px]", open && "rotate-90 text-brand")} />
                      </button>
                    </td>
                    <td className={cn(TD, "h-auto py-[6px] whitespace-normal")}>
                      <span className="break-all text-foreground">{s.userNm}</span>{" "}
                      <span className="font-code text-[11.5px] break-all text-dim">{s.userId}</span>
                    </td>
                    <td className={cn(TD, "font-code text-[12px] whitespace-nowrap tabular-nums")}>{formatKstDateTime(s.loginDt)}</td>
                    <td className={cn(TD, "whitespace-nowrap")}>
                      {s.logoutDt ? (
                        <span className="font-code text-[12px] tabular-nums">{formatKstDateTime(s.logoutDt)}</span>
                      ) : (
                        <Chip className="border-ok-line bg-ok-bg text-ok-fg">사용 중</Chip>
                      )}
                    </td>
                    <td className={cn(TD, "whitespace-nowrap text-muted-foreground")}>{s.logoutReason ? LOGOUT_REASON_LABELS[s.logoutReason] : "—"}</td>
                    <td className={cn(TD, "h-auto py-[6px] font-code text-[12px] whitespace-normal break-all text-muted-foreground")}>{s.ipAddr ?? "—"}</td>
                    <td className={cn(TD, "text-right font-code tabular-nums")}>{s.eventCnt}</td>
                    <td className={cn(TD, "text-right font-code tabular-nums", s.failCnt > 0 ? "font-semibold text-danger" : "text-faint")}>{s.failCnt}</td>
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
