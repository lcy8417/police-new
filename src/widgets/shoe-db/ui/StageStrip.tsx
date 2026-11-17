import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { AiTag } from "@/shared/ui/ai"

import type { ShoeStageSummary } from "../model/types"

// 시안 「작업 단계(분업)」 줄: 단계 4칸(→) + 오른쪽 미승인 막대 · 오늘 승인 진행. 신규 요소라 위에서 data-plus 로 감싼다.
const BAR_TONE = { line: "bg-line-3", violet: "bg-violet", blue: "bg-brand-2" } as const

export function StageStrip({ summary }: { summary: ShoeStageSummary }) {
  const { stages, backlog } = summary
  return (
    <div className="flex flex-wrap items-center gap-[8px] border-b border-solid border-line-2 px-[14px] py-[9px]">
      <span className="mr-[2px] text-[11.5px] leading-[1.4] text-dim">
        작업 단계
        <br />
        (분업)
      </span>
      {stages.map((st, i) => (
        <React.Fragment key={st.title}>
          {i > 0 && (
            <span aria-hidden="true" className="text-faint">
              →
            </span>
          )}
          <span
            className={cn(
              "flex items-center gap-[8px] rounded-[8px] border border-solid px-[10px] py-[6px]",
              st.active ? "border-brand bg-brand-bg" : "border-line-2 bg-strip",
            )}
          >
            <span className="grid size-[18px] place-items-center rounded-[50%] bg-panel-3 font-code text-[10px] font-bold text-fg-2">{i + 1}</span>
            <span className="grid leading-[1.25]">
              <span className={cn("text-[12px]", st.active ? "text-foreground" : "text-fg-2")}>{st.title}</span>
              <span className="text-[10.5px] text-dim">{st.owner}</span>
              {st.aiLabel && (
                <AiTag
                  variant={st.aiBusy ? "progress" : "default"}
                  className={cn(
                    "mt-[3px] justify-self-start",
                    st.aiTone === "warn" && "border-warn-line bg-warn-bg text-warn",
                  )}
                >
                  {st.aiLabel}
                </AiTag>
              )}
            </span>
            <b className={cn("font-code text-[14px] tabular-nums", st.active ? "text-brand" : "text-foreground")}>{st.count}</b>
          </span>
        </React.Fragment>
      ))}
      <span className="ml-auto grid min-w-[196px] gap-[4px] text-[11.5px]">
        <span className="flex items-center justify-between text-muted-foreground">
          <span>{backlog.monthLabel}</span>
          <b className="font-code text-[14px] tabular-nums text-warn">{backlog.total}</b>
        </span>
        <span
          title={backlog.parts.map((p) => `${p.label} ${p.count}`).join(" · ")}
          className="flex h-[6px] gap-px overflow-hidden rounded-[3px]"
        >
          {backlog.parts.map((p) => (
            <i key={p.label} className={cn("block", BAR_TONE[p.tone])} style={{ flex: p.count }} />
          ))}
        </span>
        <span className="flex items-center justify-between text-muted-foreground">
          <span>오늘 승인</span>
          <b className="font-code tabular-nums text-foreground">
            {backlog.todayDone} / {backlog.todayLimit}매
          </b>
        </span>
        {/* 사람이 하는 승인 진행 — AI 진행 막대(훑기) 대신 일반 막대(2회차 검수, motion.md) */}
        <span
          role="progressbar"
          aria-label="오늘 승인 진행"
          aria-valuenow={backlog.todayDone}
          aria-valuemin={0}
          aria-valuemax={backlog.todayLimit}
          className="h-[5px] overflow-hidden rounded-[3px] bg-line-3"
        >
          <i className="block h-full bg-brand-2" style={{ width: `${Math.min(100, (backlog.todayDone / backlog.todayLimit) * 100)}%` }} />
        </span>
        <span className="text-dim">{backlog.note}</span>
      </span>
    </div>
  )
}
