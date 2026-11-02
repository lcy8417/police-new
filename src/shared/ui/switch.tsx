import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/shared/lib/utils"

// shadcn/ui new-york `switch`(radix-ui 단일 패키지판) — 켜짐 = 액센트 blue, 꺼짐 = 보더 톤.

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-[#3B82F6]/50 disabled:cursor-not-allowed disabled:opacity-60 data-[state=checked]:bg-[#3B82F6] data-[state=unchecked]:bg-[#1E2A3C]",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-4 rounded-full bg-white ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0 data-[state=unchecked]:bg-[#8A93A6]"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
