import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { Button } from "../kit"
import { partAttrs } from "../part-attrs"

// 시안 `.form`: 라벨-값 쌍을 격자로 늘어놓는다. columns = 한 줄에 놓이는 라벨-값 쌍 수(2 → 열 4칸, 3 → 열 6칸).
// 변형 이름은 `col2` · `col3`. span 3 은 값 칸이 그 줄 나머지를 모두 차지한다(시안 `.v.span3`).
// 라벨 폭은 시안 값 그대로: 2열 110px(시안 기본), 3열 84px(S01).
export interface SearchFormRow {
  label: string
  /** 필수 라벨: 빨간 `*` + `data-required` */
  required?: boolean
  /** 3 이면 값 칸이 그 줄 나머지를 모두 차지 */
  span?: 1 | 3
  field: React.ReactNode
}

export interface SearchFormProps {
  columns: 2 | 3
  rows: SearchFormRow[]
  onSearch?: () => void
  onReset?: () => void
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
}

const GRID: Record<2 | 3, string> = {
  2: "grid-cols-[110px_minmax(0,1fr)_110px_minmax(0,1fr)]",
  3: "grid-cols-[84px_minmax(0,1fr)_84px_minmax(0,1fr)_84px_minmax(0,1fr)]",
}
// 값 칸이 나머지 전부를 차지하는 열 수(라벨 1칸 뒤 나머지)
const SPAN_REST: Record<2 | 3, string> = { 2: "col-span-3", 3: "col-span-5" }

const CELL = "min-h-[36px] border-b border-solid border-line-2 px-[10px] py-[7px] text-[12.5px]"

export function SearchForm({ columns, rows, onSearch, onReset, partId }: SearchFormProps) {
  const hasActions = onSearch != null || onReset != null
  return (
    <div {...partAttrs("SearchForm", { variant: `col${columns}`, id: partId })}>
      <div className={cn("grid border-t border-solid border-line-2", GRID[columns])}>
        {rows.map((row) => (
          <React.Fragment key={row.label}>
            <div
              data-required={row.required ? "" : undefined}
              className={cn(
                CELL,
                "bg-[var(--t-panel-head)] text-muted-foreground",
                row.required && "after:text-danger after:content-[' *']",
              )}
            >
              {row.label}
            </div>
            <div className={cn(CELL, row.span === 3 && SPAN_REST[columns])}>{row.field}</div>
          </React.Fragment>
        ))}
      </div>
      {hasActions && (
        <div className="flex justify-end gap-[6px] px-[14px] py-[10px]">
          {onReset && (
            <Button size="sm" onClick={onReset}>
              초기화
            </Button>
          )}
          {onSearch && (
            <Button size="sm" variant="pri" onClick={onSearch}>
              조회
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
