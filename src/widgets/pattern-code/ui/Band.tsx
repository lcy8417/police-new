import * as React from "react"

import { cn } from "@/shared/lib/utils"

/**
 * 사건 창 안 탭 칸 속 작은 소제목(11/17 — 파란 띠 대신 글자 위계로 묶음): 11.5 굵게 회색 + 오른쪽 조각.
 * 칸 머리는 PaneHead · UnderlineTabs 가 맡고, 이것은 그 안 묶음 이름만.
 */
export function SubHead({ title, children }: { title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex min-h-[20px] items-center gap-[8px]">
      <h4 className="m-0 text-[11.5px] font-bold whitespace-nowrap text-fg-2">{title}</h4>
      {children ? <span className="ml-auto flex items-center gap-[6px]">{children}</span> : null}
    </div>
  )
}

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
