import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/shared/lib/utils"

// shadcn/ui new-york `tabs`(radix-ui 단일 패키지판) — 선택 탭 = 액센트 blue 밑줄형 칩.

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-9 w-fit items-center justify-center rounded-lg border border-[#1E2A3C] bg-[#0D1420] p-[3px] text-[#8A93A6]",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-3 text-[13px] font-medium whitespace-nowrap transition-colors outline-none hover:text-[#E5E9F0] focus-visible:ring-[3px] focus-visible:ring-[#3B82F6]/50 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-[#3B82F6]/40 data-[state=active]:bg-[#152238] data-[state=active]:text-[#4A9EFF] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsContent, TabsList, TabsTrigger }
