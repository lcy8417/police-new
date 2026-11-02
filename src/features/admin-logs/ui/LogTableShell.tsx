import type { ReactNode } from "react"
import { Loader2, ScrollText } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Button, TechCorners } from "@/shared/ui"

export interface LogColumn {
  label: string
  /** 숫자 열은 오른쪽 정렬. */
  align?: "left" | "right"
  className?: string
}

export interface LogTableShellProps {
  /** 표 이름(접근성 이름). */
  label: string
  columns: LogColumn[]
  isLoading: boolean
  isEmpty: boolean
  emptyText: string
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onLoadMore: () => void
  /** `<tbody>` 안의 행들. */
  children: ReactNode
}

/**
 * 사용 기록 표 공통 틀 — 패널(TechCorners) + 고정 머리글 + 불러오는 중/빈 상태 + 50개 단위 "더 보기".
 */
export function LogTableShell({
  label,
  columns,
  isLoading,
  isEmpty,
  emptyText,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  children,
}: LogTableShellProps) {
  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
      <TechCorners size={22} />
      <div className="min-h-0 flex-1 overflow-auto">
        <table aria-label={label} className="w-full border-collapse text-left text-[13px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#0D1420]">
              {columns.map((col, index) => (
                <th
                  key={`${col.label}-${index}`}
                  scope="col"
                  className={cn(
                    "border-b border-[#1E2A3C] px-4 py-2.5 text-[12px] font-medium whitespace-nowrap text-[#8A93A6]",
                    col.align === "right" && "text-right",
                    col.className
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-[#5B6B85]">
                    <Loader2 className="size-7 animate-spin text-[#4A9EFF]" aria-hidden="true" />
                    <span className="text-[13px] font-medium">기록을 불러오는 중...</span>
                  </div>
                </td>
              </tr>
            ) : isEmpty ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-[#5B6B85]">
                    <ScrollText className="size-7" aria-hidden="true" />
                    <span className="text-[13px] font-medium">{emptyText}</span>
                  </div>
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
        {hasNextPage && (
          <div className="flex justify-center border-t border-[#141D2C] py-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isFetchingNextPage}
              onClick={onLoadMore}
              className="border-[#1E2A3C] bg-[#0F1826] text-[#C7CEDB] hover:border-[#3B82F6]/50 hover:bg-[#141F30] hover:text-white focus-visible:ring-[#3B82F6]/40"
            >
              {isFetchingNextPage && <Loader2 className="animate-spin" aria-hidden="true" />}
              더 보기
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
