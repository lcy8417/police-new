import type { ComponentProps } from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../../part-attrs"

// r4 로망 이식(`BoardFrame`): 흰 판의 테 · 모서리 · 그림자만 그린다. 글꼴은 판 본문과 뚜껑이 각자 정한다.
// 로망 `shadow-sh` → 값 토큰 `--t-panel-drop` 두 겹의 옅은 그림자.
export interface BoardFrameProps extends ComponentProps<"div"> {
  /** 위치 식별자(`data-part-id`) */
  partId?: string
}

export function BoardFrame({ partId, className, ...props }: BoardFrameProps) {
  return (
    <div
      {...partAttrs("BoardFrame", { id: partId })}
      data-slot="board-frame"
      className={cn(
        "mt-[14px] overflow-hidden rounded-[14px] border border-solid border-border bg-panel",
        "[box-shadow:0_1px_2px_var(--t-panel-drop),0_1px_3px_var(--t-panel-drop)]",
        className
      )}
      {...props}
    />
  )
}
