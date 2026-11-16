import type { ReactNode } from "react"

import { cn } from "@/shared/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../kit"
import { partAttrs } from "../../part-attrs"

// 창 안 칸 머리(11/17 사용자 「저 소제목 디자인 바꿔」 → 사건 창 사건 정보 탭에서 처음 그린 모양을 부품으로 뽑음).
// 파란 띠(Band) 대신 밑줄 탭 모양 제목: 13 굵게 · brand-3 글자 · 아래 2px brand 밑줄, 줄 밑 1px 선.
// 같은 줄의 UnderlineTabs(window) 와 높이 · 밑선이 맞도록 제목 안쪽 여백(위 7 · 아래 8)을 탭과 똑같이 둔다.
// 로망 `section/RefTable` SubHead(list) 의 「제목 · 흐린 설명 · 오른쪽 끝 조각 · ⓘ 말풍선」 구성을 따르고, 생김새는 UnderlineTabs 쪽에 맞췄다.

export interface PaneHeadProps {
  /** 칸 이름 */
  title: ReactNode
  /** 제목 옆 흐린 한 줄(개수 · 상태) */
  sub?: ReactNode
  /** 제목 옆 ⓘ 말풍선 — 설명 문장을 칸 안에 늘어놓지 않을 때 */
  tip?: string
  /** 줄 오른쪽 끝 자리(그 칸의 도구 · 단추) */
  end?: ReactNode
  /** 제목 태그(기본 h3) */
  as?: "h2" | "h3" | "h4"
  /** 제목 id — 칸이 `aria-labelledby` 로 가리킬 때 */
  id?: string
  /** 위치 식별자(`data-part-id`) */
  partId?: string
  className?: string
}

/** [UI] 창 안 칸 머리 — 밑줄 탭 모양 제목 + 오른쪽 끝 자리, 같은 밑선 */
export function PaneHead({ title, sub, tip, end, as: Heading = "h3", id, partId, className }: PaneHeadProps) {
  return (
    <div
      {...partAttrs("PaneHead", { id: partId })}
      data-slot="panel-pane-head"
      className={cn("flex min-w-0 shrink-0 items-end gap-2 border-b border-solid border-border px-1", className)}
    >
      <Heading
        id={id}
        className="-mb-px m-0 inline-flex shrink-0 items-center gap-1.5 border-0 border-b-2 border-solid border-brand pt-[7px] pb-2 text-[13px] font-bold whitespace-nowrap text-brand-3"
      >
        {title}
      </Heading>
      {tip ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`도움말 — ${tip}`}
                className="m-0 inline-grid size-4 shrink-0 cursor-help place-items-center self-center rounded-full border border-solid border-line-3 bg-transparent p-0 text-[10px] leading-none font-bold text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-brand"
              >
                i
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[280px]">{tip}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : null}
      {sub ? <span className="min-w-0 self-center truncate text-[11px] text-muted-foreground">{sub}</span> : null}
      {end ? <div className="ml-auto flex shrink-0 items-center gap-1.5 self-center py-1">{end}</div> : null}
    </div>
  )
}
