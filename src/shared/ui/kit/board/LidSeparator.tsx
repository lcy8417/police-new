import type { ComponentPropsWithRef } from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../../part-attrs"

// r4 로망 이식(`LidSeparator`): 뚜껑 안 1px × 18 칸막이(종이색 35%). 읽지 않는다.
export interface LidSeparatorProps extends ComponentPropsWithRef<"span"> {
  /** 위치 식별자(`data-part-id`) */
  partId?: string
}

export function LidSeparator({ partId, className, ...props }: LidSeparatorProps) {
  return (
    <span
      {...props}
      {...partAttrs("LidSeparator", { id: partId })}
      data-slot="lid-separator"
      aria-hidden="true"
      className={cn("mx-1 block h-[18px] w-px flex-none bg-paper/35", className)}
    />
  )
}
