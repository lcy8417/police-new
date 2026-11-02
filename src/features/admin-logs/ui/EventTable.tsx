import { Fragment, useState } from "react"

import type { AdminEvent } from "@/entities/admin"
import { formatKstDateTime } from "@/shared/lib"
import { cn } from "@/shared/lib/utils"

import { UNKNOWN_USER_LABEL } from "../model/log-filters"
import { EventErrorDetail } from "./EventErrorDetail"
import { LogTableShell, type LogColumn } from "./LogTableShell"
import { ResultChip } from "./ResultChip"

const COLUMNS: LogColumn[] = [
  { label: "시각" },
  { label: "사용자" },
  { label: "기능" },
  { label: "대상" },
  { label: "결과" },
  { label: "상태 코드", align: "right" },
  { label: "소요(ms)", align: "right" },
  { label: "오류 메시지", className: "w-[28%]" },
]

export interface EventTableProps {
  events: AdminEvent[]
  isLoading: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onLoadMore: () => void
}

/**
 * 기능 기록 표 — 시각, 사용자(모르면 "알 수 없음"), 기능, 대상, 결과, 상태 코드, 소요(ms),
 * 오류 메시지(말줄임). 오류 메시지가 있는 행을 누르면 전체 내용을 펼친다.
 */
export function EventTable({ events, isLoading, hasNextPage, isFetchingNextPage, onLoadMore }: EventTableProps) {
  const [openLogId, setOpenLogId] = useState<number | null>(null)

  return (
    <LogTableShell
      label="기능 기록"
      columns={COLUMNS}
      isLoading={isLoading}
      isEmpty={events.length === 0}
      emptyText="조건에 맞는 기능 기록이 없습니다."
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={onLoadMore}
    >
      {events.map((event) => {
        const expandable = event.result !== "SUCCESS" || event.errorMsg !== null
        const open = openLogId === event.logId
        const toggle = () => setOpenLogId(open ? null : event.logId)
        return (
          <Fragment key={event.logId}>
            <tr
              onClick={expandable ? toggle : undefined}
              className={cn(
                "border-b border-[#141D2C] transition-colors",
                expandable && "cursor-pointer hover:bg-[#141F30]",
                open && "bg-[#111B2B]"
              )}
            >
              <td className="px-4 py-2 font-mono text-[12px] whitespace-nowrap tabular-nums text-[#C7CEDB]">
                {formatKstDateTime(event.occurredDt, true)}
              </td>
              <td className="px-4 py-2">
                <div className="flex flex-col">
                  <span className={cn("text-[13px]", event.userNm ? "text-[#E5E9F0]" : "text-[#8A93A6] italic")}>
                    {event.userNm ?? UNKNOWN_USER_LABEL}
                  </span>
                  {event.userId && <span className="font-mono text-[11px] text-[#5B6B85]">{event.userId}</span>}
                </div>
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-[#E5E9F0]">{event.actionNm}</td>
              <td className="px-4 py-2 font-mono text-[12px] whitespace-nowrap text-[#8A93A6]">
                {event.targetId ?? "—"}
              </td>
              <td className="px-4 py-2">
                <ResultChip result={event.result} />
              </td>
              <td className="px-4 py-2 text-right font-mono tabular-nums text-[#C7CEDB]">{event.statusCode ?? "—"}</td>
              <td className="px-4 py-2 text-right font-mono tabular-nums text-[#8A93A6]">{event.durationMs ?? "—"}</td>
              <td className="max-w-0 px-4 py-2">
                {expandable ? (
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-label={`${event.actionNm} 오류 내용 ${open ? "접기" : "펼치기"}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggle()
                    }}
                    className="block w-full truncate rounded text-left text-[12px] text-[#FCA5A5] outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/60"
                  >
                    {event.errorMsg ?? event.errorCode ?? "—"}
                  </button>
                ) : (
                  <span className="text-[#5B6B85]">—</span>
                )}
              </td>
            </tr>
            {open && (
              <tr className="border-b border-[#141D2C] bg-[#0A101A]">
                <td colSpan={COLUMNS.length} className="px-6 py-3">
                  <EventErrorDetail event={event} />
                </td>
              </tr>
            )}
          </Fragment>
        )
      })}
    </LogTableShell>
  )
}
