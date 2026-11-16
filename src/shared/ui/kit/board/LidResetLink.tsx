import type { ComponentPropsWithRef } from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../../part-attrs"
import { BOARD_BUTTON, BOARD_TRANSITION } from "./board-classes"

// r4 로망 이식(`LidResetLink`): 뚜껑 끝 「✕ 필터 풀기」 글자 단추. 거른 것이 있을 때만 화면이 그린다.
export interface LidResetLinkProps extends ComponentPropsWithRef<"button"> {
  /** 위치 식별자(`data-part-id`) */
  partId?: string
}

export function LidResetLink({ partId, className, children = "✕ 필터 풀기", ...props }: LidResetLinkProps) {
  return (
    <button
      type="button"
      {...props}
      {...partAttrs("LidResetLink", { id: partId })}
      data-slot="lid-reset-link"
      className={cn(BOARD_BUTTON, BOARD_TRANSITION, "ml-1.5 text-[11px] font-bold whitespace-nowrap text-paper", className)}
    >
      {children}
    </button>
  )
}
