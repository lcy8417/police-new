import * as React from "react"

import { cn } from "@/shared/lib/utils"

/** SCAS 「문양 상세보기」 칸 머리 띠(시안 `band`) — 이 화면 안 배치 조각 */
export function Band({ title, children, className }: { title: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex min-h-[30px] items-center gap-[8px] border-l-[3px] border-solid border-brand-2 bg-strip px-[10px] text-[12.5px] font-semibold",
        className,
      )}
    >
      <span className="whitespace-nowrap">{title}</span>
      {children ? <span className="ml-auto flex items-center gap-[6px] font-normal">{children}</span> : null}
    </div>
  )
}
