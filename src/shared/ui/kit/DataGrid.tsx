import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"

// 시안 `table.grid` 의 부품판: 머리 34 · 행 44, 선택 행 `tr.sel`(= aria-selected, 왼쪽 3px brand 띠).
// 열 순서는 SCAS 그대로(새 열은 맨 끝 — SKILL 「원칙」). 업무 말은 모르고 `render` 가 셀 내용을 그린다.
// 새 행 강조(`tr.fx-new`)는 움직임 부품 쪽 일이라 이 부품에 아직 넣지 않았다.
export interface DataGridColumn<Row> {
  key: string
  header: string
  align?: "left" | "right"
  /** 긴 글자를 줄바꿈(시안 `td.wrap`) */
  wrap?: boolean
  render: (row: Row) => React.ReactNode
}

export interface DataGridProps<Row> {
  columns: DataGridColumn<Row>[]
  rows: Row[]
  rowKey: (row: Row) => string
  selectedKey?: string
  onRowClick?: (row: Row) => void
  /** 행이 없을 때 한 칸으로 보이는 글자. 조회 실패는 이 문구로 쓰지 않는다(SKILL 「모름과 없음」). */
  emptyText?: string
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
  className?: string
}

const INTERACTIVE = "button, a, input, select, textarea, label, [role='button']"

export function DataGrid<Row>({
  columns,
  rows,
  rowKey,
  selectedKey,
  onRowClick,
  emptyText = "결과 없음",
  partId,
  className,
}: DataGridProps<Row>) {
  return (
    <table
      {...partAttrs("DataGrid", { id: partId })}
      className={cn("w-full border-collapse text-[12.5px]", className)}
    >
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              scope="col"
              className={cn(
                "h-[34px] px-[10px] bg-strip border-b border-solid border-border text-[11.5px] font-semibold text-muted-foreground whitespace-nowrap",
                col.align === "right" ? "text-right" : "text-left"
              )}
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length}
              className="h-[44px] px-[10px] text-center text-muted-foreground border-b border-solid border-line-2"
            >
              {emptyText}
            </td>
          </tr>
        ) : (
          rows.map((row) => {
            const key = rowKey(row)
            const selected = key === selectedKey
            const clickable = onRowClick !== undefined
            return (
              <tr
                key={key}
                aria-selected={selected || undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={
                  clickable
                    ? (e) => {
                        if ((e.target as HTMLElement).closest(INTERACTIVE)) return
                        onRowClick(row)
                      }
                    : undefined
                }
                onKeyDown={
                  clickable
                    ? (e) => {
                        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault()
                          onRowClick(row)
                        }
                      }
                    : undefined
                }
                className={cn("group", clickable && "cursor-pointer")}
              >
                {columns.map((col, i) => (
                  <td
                    key={col.key}
                    data-align={col.align === "right" ? "right" : undefined}
                    className={cn(
                      "px-[10px] border-b border-solid border-line-2 text-fg-2",
                      selected ? "bg-brand-bg" : "group-hover:bg-panel-2",
                      col.align === "right" && "text-right",
                      col.wrap
                        ? "h-auto py-[8px] whitespace-normal leading-[1.4]"
                        : "h-[44px] whitespace-nowrap",
                      selected && i === 0 && "[box-shadow:inset_3px_0_0_var(--t-brand)]"
                    )}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            )
          })
        )}
      </tbody>
    </table>
  )
}
