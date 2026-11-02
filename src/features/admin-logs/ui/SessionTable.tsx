import { Fragment, useState, type MouseEvent } from "react"
import { ChevronRight } from "lucide-react"

import type { AdminSession } from "@/entities/admin"
import { formatKstDateTime } from "@/shared/lib"
import { cn } from "@/shared/lib/utils"
import { StatusChip } from "@/shared/ui"

import { LOGOUT_REASON_LABELS } from "../model/log-filters"
import { LogTableShell, type LogColumn } from "./LogTableShell"
import { SessionEventTimeline } from "./SessionEventTimeline"

const COLUMNS: LogColumn[] = [
  { label: "", className: "w-10" },
  { label: "사용자" },
  { label: "로그인" },
  { label: "로그아웃" },
  { label: "종료 사유" },
  { label: "IP" },
  { label: "이벤트 수", align: "right" },
  { label: "실패 수", align: "right" },
]

export interface SessionTableProps {
  sessions: AdminSession[]
  isLoading: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onLoadMore: () => void
}

/**
 * 로그인 기록 표 — 사용자, 로그인·로그아웃 시각(없으면 "사용 중"), 종료 사유, IP, 이벤트 수,
 * 실패 수(0이 아니면 빨간 숫자). 행을 펼치면 그 로그인의 기능 기록 타임라인.
 */
export function SessionTable({ sessions, isLoading, hasNextPage, isFetchingNextPage, onLoadMore }: SessionTableProps) {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set())

  const toggle = (sessionId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(sessionId)) next.delete(sessionId)
      else next.add(sessionId)
      return next
    })

  return (
    <LogTableShell
      label="로그인 기록"
      columns={COLUMNS}
      isLoading={isLoading}
      isEmpty={sessions.length === 0}
      emptyText="이 기간에 로그인 기록이 없습니다."
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={onLoadMore}
    >
      {sessions.map((session) => {
        const open = expanded.has(session.sessionId)
        const handleToggleClick = (event: MouseEvent) => {
          event.stopPropagation()
          toggle(session.sessionId)
        }
        return (
          <Fragment key={session.sessionId}>
            <tr
              onClick={() => toggle(session.sessionId)}
              className={cn(
                "cursor-pointer border-b border-[#141D2C] transition-colors",
                open ? "bg-[#111B2B]" : "hover:bg-[#141F30]"
              )}
            >
              <td className="py-2 pl-3">
                <button
                  type="button"
                  aria-label="기능 기록 펼치기"
                  aria-expanded={open}
                  onClick={handleToggleClick}
                  className="flex size-7 items-center justify-center rounded-md text-[#5B6B85] outline-none hover:bg-white/5 hover:text-[#4A9EFF] focus-visible:ring-2 focus-visible:ring-[#3B82F6]/60"
                >
                  <ChevronRight
                    className={cn("size-4 transition-transform", open && "rotate-90 text-[#4A9EFF]")}
                    aria-hidden="true"
                  />
                </button>
              </td>
              <td className="px-4 py-2">
                <div className="flex flex-col">
                  <span className="text-[13px] text-[#E5E9F0]">{session.userNm}</span>
                  <span className="font-mono text-[11px] text-[#5B6B85]">{session.userId}</span>
                </div>
              </td>
              <td className="px-4 py-2 font-mono text-[12px] whitespace-nowrap tabular-nums text-[#C7CEDB]">
                {formatKstDateTime(session.loginDt)}
              </td>
              <td className="px-4 py-2 font-mono text-[12px] whitespace-nowrap tabular-nums text-[#C7CEDB]">
                {session.logoutDt ? formatKstDateTime(session.logoutDt) : <StatusChip tone="teal">사용 중</StatusChip>}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-[#8A93A6]">
                {session.logoutReason ? LOGOUT_REASON_LABELS[session.logoutReason] : "—"}
              </td>
              <td className="px-4 py-2 font-mono text-[12px] whitespace-nowrap text-[#8A93A6]">
                {session.ipAddr ?? "—"}
              </td>
              <td className="px-4 py-2 text-right font-mono tabular-nums text-[#C7CEDB]">{session.eventCnt}</td>
              <td className="px-4 py-2 text-right font-mono tabular-nums">
                <span className={session.failCnt > 0 ? "font-semibold text-[#EF4444]" : "text-[#5B6B85]"}>
                  {session.failCnt}
                </span>
              </td>
            </tr>
            {open && (
              <tr className="border-b border-[#141D2C] bg-[#0A101A]">
                <td colSpan={COLUMNS.length} className="px-6 py-3">
                  <SessionEventTimeline sessionId={session.sessionId} />
                </td>
              </tr>
            )}
          </Fragment>
        )
      })}
    </LogTableShell>
  )
}
