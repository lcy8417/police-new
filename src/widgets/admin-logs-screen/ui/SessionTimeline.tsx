import { useState } from "react"
import { ChevronDown } from "lucide-react"

import type { AdminEvent } from "@/entities/admin"
import { formatKstDateTime } from "@/shared/lib"
import { cn } from "@/shared/lib/utils"
import { InlineError } from "@/shared/ui/kit"

import type { SessionTimeline as Timeline } from "../model/types"
import { ResultChip } from "./ResultChip"

const DOT: Record<AdminEvent["result"], string> = { SUCCESS: "bg-line-3", FAIL: "bg-danger", DENIED: "bg-warn" }

// 한 줄: 시각 · 점 · 기능 이름 + 대상 · 결과 칩. 실패 · 권한 없음은 눌러서 오류 내용을 펼친다.
function Item({ event }: { event: AdminEvent }) {
  const [open, setOpen] = useState(false)
  const expandable = event.result !== "SUCCESS"
  const body = (
    <>
      <time dateTime={event.occurredDt} className="w-[44px] shrink-0 font-code text-[11.5px] tabular-nums text-dim">
        {formatKstDateTime(event.occurredDt).slice(11, 16)}
      </time>
      <span aria-hidden="true" className={cn("size-[9px] shrink-0 rounded-full [box-shadow:0_0_0_3px_var(--t-bg-2)]", DOT[event.result])} />
      <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-[8px]">
        <span className="text-[12.5px] text-fg-2">{event.actionNm}</span>
        {event.targetId && <span className="break-all font-code text-[11.5px] text-muted-foreground">{event.targetId}</span>}
      </span>
      <ResultChip result={event.result} />
      {expandable && <ChevronDown aria-hidden="true" className={cn("size-[14px] shrink-0 text-dim", open && "rotate-180")} />}
    </>
  )
  const row = "flex min-h-[30px] w-full items-center gap-[8px] rounded-[6px] px-[6px] py-[3px] text-left"
  return (
    <li>
      {expandable ? (
        <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className={cn(row, "cursor-pointer border-0 bg-transparent text-inherit hover:bg-panel-2")}>
          {body}
        </button>
      ) : (
        <div className={row}>{body}</div>
      )}
      {expandable && open && (
        <div className="mx-[6px] mb-[6px] ml-[64px] rounded-[6px] border border-solid border-line-2 bg-strip px-[10px] py-[6px] text-[11.5px] leading-[1.45] text-muted-foreground">
          {event.errorCode && <span className="mr-[8px] font-code text-fg-2">{event.errorCode}</span>}
          {event.statusCode !== null && <span className="mr-[8px] font-code">상태 코드 {event.statusCode}</span>}
          <p className="m-0 break-all">{event.errorMsg ?? "오류 내용이 기록되지 않았습니다"}</p>
        </div>
      )}
    </li>
  )
}

/** 한 로그인의 기능 타임라인(행을 펼치면 보임). 못 읽었으면 「없음」이 아니라 오류 한 줄 + 다시. */
export function SessionTimeline({ timeline, onRetry }: { timeline: Timeline | undefined; onRetry: () => void }) {
  if (!timeline || timeline.status === "loading") {
    return <p aria-busy="true" className="m-0 px-[6px] py-[10px] text-[12px] text-dim">기능 기록을 불러오는 중…</p>
  }
  if (timeline.status === "error") {
    return (
      <div className="px-[6px] py-[10px]">
        <InlineError message="기능 기록을 확인하지 못했습니다" onRetry={onRetry} />
      </div>
    )
  }
  if (timeline.events.length === 0) {
    return <p className="m-0 px-[6px] py-[10px] text-[12px] text-dim">이 로그인에서 사용한 기능이 없습니다.</p>
  }
  return (
    <ul aria-label="이 로그인의 기능 기록" className="m-0 grid list-none gap-[2px] p-0">
      {timeline.events.map((e) => (
        <Item key={e.logId} event={e} />
      ))}
    </ul>
  )
}
