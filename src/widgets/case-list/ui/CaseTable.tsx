import * as React from "react"

import { cn } from "@/shared/lib/utils"

// S01 전용 표. 공용 DataGrid 는 「행 아래 펼침 줄」과 「새 행 강조」가 없어(r2 부품 잠금 노트) 같은 값(머리 34 · 행 44 ·
// 선택 행 왼쪽 3px 띠)으로 화면 안에서 그린다. 업무 말은 모르고 `render` 가 셀 내용을 그린다.

export interface CaseTableColumn<Row> {
  key: string
  /** (r3) 열 고르기 목록에 보일 이름 — 머리가 글자가 아니거나 같은 이름이 겹칠 때 */
  label?: string
  header: React.ReactNode
  align?: "left" | "right"
  /** (+α) 열 · 칸 전체가 +α 면 `data-plus` 를 단다 */
  plus?: boolean
  /** 칸 배경(시안 사건 진행 열의 옅은 청록) */
  cellClass?: string
  render: (row: Row) => React.ReactNode
}

const INTERACTIVE = "button, a, input, select, textarea, label, [role='button']"

interface CaseTableProps<Row> {
  columns: CaseTableColumn<Row>[]
  rows: Row[]
  rowKey: (row: Row) => string
  /** 선택(= 펼친) 행 */
  selectedKey?: string | null
  /** 방금 들어온 행(왼쪽 청록 줄 + 옅은 청록 바탕) */
  isNew?: (row: Row) => boolean
  /** 행 바로 아래에 붙는 펼침 내용(없으면 null) */
  expansion?: (row: Row) => React.ReactNode
  onRowClick?: (row: Row) => void
  emptyText: string
  /** (r3) 촘촘한 행 높이 */
  compact?: boolean
}

export function CaseTable<Row>({
  columns,
  rows,
  rowKey,
  selectedKey,
  isNew,
  expansion,
  onRowClick,
  emptyText,
  compact = false,
}: CaseTableProps<Row>) {
  return (
    <table className="w-full border-collapse text-[12px]">
      <thead>
        <tr>
          {columns.map((c) => (
            <th
              key={c.key}
              scope="col"
              data-col={c.key}
              {...(c.plus ? { "data-plus": "" } : {})}
              className={cn(
                "whitespace-nowrap border-b border-solid border-border bg-strip px-[6px] py-[4px] text-[11.5px] font-semibold leading-[1.25] text-muted-foreground",
                c.align === "right" ? "text-right" : "text-left"
              )}
            >
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length}
              className="h-[44px] border-b border-solid border-line-2 px-[10px] text-center text-muted-foreground"
            >
              {emptyText}
            </td>
          </tr>
        ) : (
          rows.map((row) => {
            const key = rowKey(row)
            const selected = key === selectedKey
            const fresh = isNew?.(row) === true
            const open = expansion?.(row)
            return (
              <React.Fragment key={key}>
                <tr
                  aria-selected={selected || undefined}
                  data-new={fresh ? "" : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={
                    onRowClick
                      ? (e) => {
                          if ((e.target as HTMLElement).closest(INTERACTIVE)) return
                          onRowClick(row)
                        }
                      : undefined
                  }
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault()
                            onRowClick(row)
                          }
                        }
                      : undefined
                  }
                  className={cn("group", onRowClick && "cursor-pointer")}
                >
                  {columns.map((c, i) => (
                    <td
                      key={c.key}
                      {...(c.plus ? { "data-plus": "" } : {})}
                      className={cn(
                        "whitespace-nowrap border-b border-solid border-line-2 px-[6px] text-fg-2",
                        compact ? "h-[30px] py-0" : "h-[44px]",
                        c.align === "right" && "text-right",
                        selected ? "bg-brand-bg" : "group-hover:bg-panel-2",
                        // 방금 들어온 행: 옅은 청록 바탕(끝 60% 에서 투명) + 첫 칸 왼쪽 청록 줄
                        fresh &&
                          !selected &&
                          "bg-[linear-gradient(90deg,color-mix(in_srgb,var(--t-ai-bg)_55%,transparent),transparent_60%)]",
                        i === 0 && selected && "[box-shadow:inset_3px_0_0_var(--t-brand)]",
                        i === 0 && fresh && !selected && "[box-shadow:inset_3px_0_0_var(--t-ai)] motion-safe:animate-fx-glow",
                        c.cellClass
                      )}
                    >
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
                {open ? (
                  <tr data-plus>
                    <td colSpan={columns.length} className="border-b border-solid border-line-2 bg-panel-2 p-0">
                      {open}
                    </td>
                  </tr>
                ) : null}
              </React.Fragment>
            )
          })
        )}
      </tbody>
    </table>
  )
}
