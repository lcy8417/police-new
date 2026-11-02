import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/shared/lib/utils"

/**
 * 브라우저 기본 `<select>`를 과학수사 다크 톤으로 감싼 선택 상자(shadcn `native-select` 형태).
 * 선택지가 몇 개 안 되는 필터·구분 선택에 쓴다 — 키보드·화면 낭독기 동작이 기본 그대로라 안전하다.
 */
function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className={cn("relative", className)}>
      <select
        data-slot="native-select"
        className="h-9 w-full min-w-0 appearance-none rounded-md border border-[#1E2A3C] bg-[#0D1420] py-1 pr-8 pl-3 text-[13px] text-[#E5E9F0] transition-[color,box-shadow] outline-none focus-visible:border-[#3B82F6] focus-visible:ring-[3px] focus-visible:ring-[#3B82F6]/35 disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-[#0B121D]"
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-[#5B6B85]"
        aria-hidden="true"
      />
    </div>
  )
}

export { NativeSelect }
