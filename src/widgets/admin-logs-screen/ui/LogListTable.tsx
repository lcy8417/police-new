import type { ReactNode } from "react"

import { cn } from "@/shared/lib/utils"
import { ListHeadRow, ListNote, ListRow } from "@/shared/ui/kit"

// S14 기능 기록 · 관리자 행위 표(R6) — 사건관리 목록과 같은 로망 목록 표(ListHeadRow · ListRow). 칸 폭은 flex 클래스로.

export interface LogListColumn<Row> {
  key: string
  header: string
  /** 칸 폭 · 맞춤(flex 클래스 — 예 `w-[140px] shrink-0` · `flex-[1_1_160px]`) */
  className: string
  render: (row: Row) => ReactNode
}

export function LogListTable<Row>({
  label,
  columns,
  rows,
  rowKey,
  minWidth = "min-w-[720px]",
}: {
  label: string
  columns: readonly LogListColumn<Row>[]
  rows: readonly Row[]
  rowKey: (row: Row) => string
  minWidth?: string
}) {
  return (
    <div className="overflow-x-auto">
      <div role="table" aria-label={label} className={minWidth}>
        <ListHeadRow role="row" aria-hidden={undefined}>
          {columns.map((c) => (
            <span key={c.key} role="columnheader" className={cn("min-w-0 truncate", c.className)}>
              {c.header}
            </span>
          ))}
        </ListHeadRow>
        {rows.length === 0 ? (
          <ListNote className="text-center">결과 없음</ListNote>
        ) : (
          rows.map((r) => (
            <ListRow key={rowKey(r)} role="row" className="h-auto min-h-[36px] cursor-default py-[5px]">
              {columns.map((c) => (
                <span key={c.key} role="cell" className={cn("flex min-w-0 items-center", c.className)}>
                  {c.render(r)}
                </span>
              ))}
            </ListRow>
          ))
        )}
      </div>
    </div>
  )
}
