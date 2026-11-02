import * as React from "react"
import { CheckIcon } from "lucide-react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { cn } from "@/shared/lib/utils"

// shadcn/ui new-york `checkbox`(radix-ui 단일 패키지판) — 체크 = 액센트 blue.

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-4 shrink-0 rounded-[4px] border border-[#2A3850] bg-[#0D1420] shadow-xs transition-shadow outline-none focus-visible:ring-[3px] focus-visible:ring-[#3B82F6]/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-[#3B82F6] data-[state=checked]:bg-[#3B82F6] data-[state=checked]:text-white",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
