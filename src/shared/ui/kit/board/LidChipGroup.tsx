import type { ComponentPropsWithRef } from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../../part-attrs"

// r4 로망 이식(`LidChipGroup`): 칩 묶음. 이름은 aria-label 로 받는다.
export interface LidChipGroupProps extends ComponentPropsWithRef<"div"> {
  /** 위치 식별자(`data-part-id`) */
  partId?: string
}

export function LidChipGroup({ partId, className, ...props }: LidChipGroupProps) {
  return (
    <div
      role="group"
      {...props}
      {...partAttrs("LidChipGroup", { id: partId })}
      data-slot="lid-chip-group"
      className={cn("flex flex-wrap gap-1 rounded-[9px]", className)}
    />
  )
}
