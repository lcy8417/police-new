import { partAttrs } from "../part-attrs"
import { cn } from "@/shared/lib/utils"
import { Button } from "./Button"

// SCAS 목록 아래 쪽수: 왼쪽 「‹ 이전 · 다음 ›」, 오른쪽 「전체 n 중 a-b」(시안 S01 `.num`).
// 전체 개수를 모르면(total 없음) 「a-b」만 보인다. 쪽 번호는 1부터.
export interface PaginationProps {
  total?: number
  page: number
  pageSize: number
  hasNext: boolean
  onPageChange: (page: number) => void
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
  className?: string
}

export function Pagination({ total, page, pageSize, hasNext, onPageChange, partId, className }: PaginationProps) {
  // 전체 개수가 있으면 마지막 쪽을 넘는 쪽 번호는 마지막 쪽으로 보인다
  const lastPage = total === undefined ? page : Math.max(1, Math.ceil(total / pageSize))
  const shown = Math.min(page, lastPage)
  const from = (shown - 1) * pageSize + 1
  const to = total === undefined ? shown * pageSize : Math.min(shown * pageSize, total)
  const range = `${from}-${to}`
  const label = total === undefined ? range : total === 0 ? "전체 0" : `전체 ${total} 중 ${range}`
  return (
    <div
      {...partAttrs("Pagination", { id: partId })}
      className={cn("flex items-center justify-between gap-[10px] px-[14px] py-[10px] text-[12px] text-muted-foreground", className)}
    >
      <span className="inline-flex items-center gap-[6px]">
        <Button size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <span aria-hidden="true">‹</span>
          이전
        </Button>
        <Button size="sm" disabled={!hasNext} onClick={() => onPageChange(page + 1)}>
          다음
          <span aria-hidden="true">›</span>
        </Button>
      </span>
      <span className="font-code tabular-nums">{label}</span>
    </div>
  )
}
