import { useEffect, useMemo, useState } from "react"
import { Building2, ChevronLeft, ChevronRight, Clock } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"

import type { CrimeSearchRow } from "./SearchResults"

export interface CaseListCompactProps {
  /** 필터가 적용된 전체 사건 행. 내부에서 페이지 slice만 수행한다. */
  rows: CrimeSearchRow[]
  /** 현재 열려 있는 사건번호(좌측 액센트바로 강조). */
  currentCrimeNumber: string
  /** 카드 클릭 시 해당 사건번호로 전환을 요청한다. */
  onSelect: (crimeNumber: string) => void
  /** 페이지당 표시 건수(기본 6). */
  pageSize?: number
}

const PAGER_BUTTON_CLASS =
  "border border-[#1E2A3C] bg-[#0F1826] text-[#C7CEDB] hover:border-[#3B82F6]/50 hover:bg-[#141F30] hover:text-white"

/**
 * 사건 세로 카드 목록(프레젠테이셔널). 카드 1건 = 사건번호(mono 강조) + 사건명 +
 * 의뢰관서·채취일시 요약. 현재 열린 사건은 좌측 액센트바로 강조하고, 클릭 시
 * `onSelect`로 전환을 위임한다. 필터·페이지 상태 중 필터는 부모가, 표시용 페이지는
 * 이 컴포넌트가 소유하며 축약 페이저로 이동한다.
 */
export function CaseListCompact({
  rows,
  currentCrimeNumber,
  onSelect,
  pageSize = 6,
}: CaseListCompactProps) {
  const [page, setPage] = useState(0)

  // 필터가 바뀌어 행 목록이 갱신되면 첫 페이지로 되돌린다(빈 slice 방지).
  useEffect(() => {
    setPage(0)
  }, [rows])

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const pageClamped = Math.min(page, totalPages - 1)
  const pagedRows = useMemo(
    () => rows.slice(pageClamped * pageSize, pageClamped * pageSize + pageSize),
    [rows, pageClamped, pageSize]
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5">
        {pagedRows.length === 0 ? (
          <div className="flex h-full items-center justify-center px-3 py-10 text-center text-[13px] text-[#5B6B85]">
            조회된 사건이 없습니다.
          </div>
        ) : (
          pagedRows.map((row, rowIndex) => {
            const crimeNumber = String(row.crimeNumber ?? "")
            const isCurrent = crimeNumber === String(currentCrimeNumber)
            return (
              <button
                type="button"
                key={`${crimeNumber}-${rowIndex}`}
                onClick={() => onSelect(crimeNumber)}
                className={cn(
                  "relative w-full overflow-hidden rounded-lg border px-3 py-2.5 text-left transition-colors",
                  isCurrent
                    ? "border-[#3B82F6]/50 bg-[#152238]/50"
                    : "border-[#1E2A3C] bg-[#0D1420]/60 hover:border-[#3B82F6]/40 hover:bg-[#141F30]"
                )}
              >
                {/* 현재 사건 좌측 액센트바(#4A9EFF) */}
                {isCurrent && (
                  <span
                    className="absolute inset-y-0 left-0 w-[3px] bg-[#4A9EFF]"
                    aria-hidden="true"
                  />
                )}
                <span className="block font-mono text-[13px] font-semibold tracking-wide text-[#4A9EFF]">
                  {crimeNumber || "-"}
                </span>
                <span className="mt-0.5 block truncate text-[13px] font-medium text-[#C7CEDB]">
                  {row.crimeName ?? "-"}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-[#8A93A6]">
                  <span className="flex items-center gap-1">
                    <Building2 className="size-3 text-[#5B6B85]" aria-hidden="true" />
                    {row.requestOffice ?? "-"}
                  </span>
                  <span className="flex items-center gap-1 font-mono tabular-nums">
                    <Clock className="size-3 text-[#5B6B85]" aria-hidden="true" />
                    {row.findTime ?? "-"}
                  </span>
                </span>
              </button>
            )
          })
        )}
      </div>

      {/* 축약 페이저 */}
      <div className="flex shrink-0 items-center justify-between gap-2 pt-1">
        <span className="font-mono text-[11px] tabular-nums text-[#5B6B85]">
          전체 {rows.length}건
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            size="icon-sm"
            onClick={() => setPage(pageClamped - 1)}
            disabled={pageClamped <= 0}
            aria-label="이전 페이지"
            className={PAGER_BUTTON_CLASS}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <span className="font-mono text-[11px] tabular-nums text-[#8A93A6]">
            {pageClamped + 1} / {totalPages}
          </span>
          <Button
            type="button"
            size="icon-sm"
            onClick={() => setPage(pageClamped + 1)}
            disabled={pageClamped >= totalPages - 1}
            aria-label="다음 페이지"
            className={PAGER_BUTTON_CLASS}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}
