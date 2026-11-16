import type { ComponentPropsWithRef } from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../../part-attrs"

// r4 로망 이식(`LidFilterLabel`): 깔때기 선 아이콘 + 「필터」(글자는 바꿀 수 있다).
export interface LidFilterLabelProps extends ComponentPropsWithRef<"span"> {
  /** 위치 식별자(`data-part-id`) */
  partId?: string
}

export function LidFilterLabel({ partId, className, children = "필터", ...props }: LidFilterLabelProps) {
  return (
    <span
      {...props}
      {...partAttrs("LidFilterLabel", { id: partId })}
      data-slot="lid-filter-label"
      className={cn("mr-1 inline-flex items-center gap-[5px] text-[12.5px] font-bold whitespace-nowrap text-paper", className)}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" className="block size-[15px] align-baseline">
        <path
          d="M2 3h12l-4.6 5.4V13l-2.8 1.4V8.4z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      {children}
    </span>
  )
}
