import type { ComponentPropsWithRef, ReactNode } from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../../part-attrs"

// r4 로망 이식(`BoardLid`): 판 맨 위 진한 띠. 로망 `bg-state-deep` · 흰 글자 → 경찰 `bg-brand-3` · `text-paper`
// (`--t-paper` 는 모든 팔레트에서 밝다). 글꼴은 시안 범위 글꼴(data-font)을 그대로 따른다.
export interface BoardLidProps extends ComponentPropsWithRef<"div"> {
  /** 판 필터는 줄바꿈, 찾기 뚜껑은 한 줄 48px */
  variant?: "board" | "finder"
  /** 아이들이 넘치면 한 줄로 옆으로 밀고 오른쪽 끝을 흐리게 — aside 는 밀리지 않고 오른쪽에 고정 */
  scroll?: boolean
  aside?: ReactNode
  /** 위치 식별자(`data-part-id`) */
  partId?: string
}

export function BoardLid({ variant = "board", scroll, aside, partId, className, children, ...props }: BoardLidProps) {
  return (
    <div
      {...props}
      {...partAttrs("BoardLid", { variant: variant === "board" ? undefined : variant, id: partId })}
      data-slot="board-lid"
      data-variant={variant}
      data-scroll={scroll || undefined}
      className={cn(
        "relative flex items-center gap-x-2 gap-y-1.5 bg-brand-3 py-2.5 pr-4 pl-5 text-[12px] font-bold leading-[1.5] text-paper",
        variant === "finder" ? "h-12 min-h-0 min-w-0 flex-nowrap" : "flex-wrap",
        scroll && "flex-nowrap whitespace-nowrap",
        className
      )}
    >
      {scroll ? (
        <>
          <span
            data-slot="board-lid-scroll"
            className="flex min-w-0 flex-1 items-center gap-1.5 self-stretch overflow-x-auto pr-5 [scrollbar-width:none] [mask-image:linear-gradient(90deg,black_85%,transparent)]"
          >
            {children}
          </span>
          {aside && <span className="flex flex-none items-center gap-1 pl-1">{aside}</span>}
        </>
      ) : (
        children
      )}
    </div>
  )
}
