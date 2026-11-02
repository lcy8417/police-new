import { useState } from "react"
import { ChevronDown, Loader2 } from "lucide-react"

import type { AdminEvent } from "@/entities/admin"
import { formatKstDateTime } from "@/shared/lib"
import { cn } from "@/shared/lib/utils"

import { useSessionEventsQuery } from "../model/use-admin-logs"
import { EventErrorDetail } from "./EventErrorDetail"
import { ResultChip } from "./ResultChip"

/** 시각 열(44px)에 넣을 `HH:mm`(KST). */
const timeOf = (iso: string) => formatKstDateTime(iso).slice(11, 16)

/** 타임라인 한 줄: 시각 | 기능 이름 + 대상 ID | 결과 칩. 실패·권한 없음은 눌러서 오류 내용을 펼친다. */
function TimelineItem({ event }: { event: AdminEvent }) {
  const [open, setOpen] = useState(false)
  const expandable = event.result !== "SUCCESS"

  const body = (
    <>
      <time
        dateTime={event.occurredDt}
        title={formatKstDateTime(event.occurredDt, true)}
        className="w-11 shrink-0 font-mono text-[12px] tabular-nums text-[#8A93A6]"
      >
        {timeOf(event.occurredDt)}
      </time>
      <span
        aria-hidden="true"
        className={cn(
          "relative z-10 size-2 shrink-0 rounded-full ring-4 ring-[#0B121D]",
          event.result === "SUCCESS" ? "bg-[#2DD4BF]" : event.result === "FAIL" ? "bg-[#EF4444]" : "bg-[#F59E0B]"
        )}
      />
      <span className="flex min-w-0 flex-1 items-baseline gap-2">
        <span className="truncate text-[13px] text-[#E5E9F0]">{event.actionNm}</span>
        {event.targetId && (
          <span className="truncate font-mono text-[11px] text-[#5B6B85]">{event.targetId}</span>
        )}
      </span>
      <ResultChip result={event.result} />
      {expandable && (
        <ChevronDown
          className={cn("size-4 shrink-0 text-[#5B6B85] transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      )}
    </>
  )

  const rowClass = "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left"

  return (
    <li className="relative">
      {expandable ? (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            rowClass,
            "outline-none hover:bg-white/[0.03] focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50"
          )}
        >
          {body}
        </button>
      ) : (
        <div className={rowClass}>{body}</div>
      )}
      {expandable && open && (
        <div className="mb-2 ml-[68px] mr-2">
          <EventErrorDetail event={event} />
        </div>
      )}
    </li>
  )
}

/**
 * 한 로그인의 기능 기록 타임라인(로그인 기록 행을 펼치면 보임) — 시간순, 세로 선으로 이어진 점.
 */
export function SessionEventTimeline({ sessionId }: { sessionId: string }) {
  const query = useSessionEventsQuery(sessionId)
  const events = query.data ?? []

  if (query.isLoading) {
    return (
      <p className="flex items-center gap-2 px-2 py-3 text-[12px] text-[#5B6B85]">
        <Loader2 className="size-4 animate-spin text-[#4A9EFF]" aria-hidden="true" />
        기능 기록을 불러오는 중...
      </p>
    )
  }
  if (query.isError) {
    return <p className="px-2 py-3 text-[12px] text-[#EF4444]">기능 기록을 불러오지 못했습니다.</p>
  }
  if (events.length === 0) {
    return <p className="px-2 py-3 text-[12px] text-[#5B6B85]">이 로그인에서 사용한 기능이 없습니다.</p>
  }

  return (
    <ol
      aria-label="이 로그인의 기능 기록"
      className="relative flex flex-col before:absolute before:top-4 before:bottom-4 before:left-[67px] before:w-px before:bg-[#1E2A3C]"
    >
      {events.map((event) => (
        <TimelineItem key={event.logId} event={event} />
      ))}
    </ol>
  )
}
