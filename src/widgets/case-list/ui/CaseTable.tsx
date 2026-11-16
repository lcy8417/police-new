import * as React from "react"

import { cn } from "@/shared/lib/utils"

// S01 전용 표. 공용 목록 부품(kit ListRow 등)은 div 줄이라 「행 아래 펼침 줄」과 「새 행 강조」가 있는 이 표는 `<table>` 로 남기고,
// 생김새만 r4 로망 ListTable 값으로 그린다(2026-11-16 사용자 결정 — 목록 생김새는 로망 정본, 색만 경찰 토큰):
// 머리 h-8 · 흰 바탕 · 10.5 보통 회색 · 아래 선 / 행 기본 36 · 촘촘 30 / 칸 사이 세로선 없음 · 가로선 border-border /
// 마우스 올림 bg-brand-bg/60 / 고른 행 bg-brand-bg + 1.5px brand 안쪽 테(왼쪽 3px 띠 대신).
// 업무 말은 모르고 `render` 가 셀 내용을 그린다.

export interface CaseTableColumn<Row> {
  key: string
  /** (r3) 열 고르기 목록에 보일 이름 — 머리가 글자가 아니거나 같은 이름이 겹칠 때 */
  label?: string
  header: React.ReactNode
  /** 머리 마우스 설명(줄인 머리 글자의 원래 이름) */
  title?: string
  align?: "left" | "right"
  /** (+α) 열 · 칸 전체가 +α 면 `data-plus` 를 단다 */
  plus?: boolean
  /** 칸 배경(시안 사건 진행 열의 옅은 청록) */
  cellClass?: string
  render: (row: Row) => React.ReactNode
}

const INTERACTIVE = "button, a, input, select, textarea, label, [role='button']"

// 고른 행 테: <tr> 의 inset 그림자는 칸 바탕에 가려지므로 칸마다 위 · 아래(+ 첫 칸 왼쪽 · 끝 칸 오른쪽) 1.5px 안쪽 선
const SEL_MID = "[box-shadow:inset_0_1.5px_0_var(--t-brand),inset_0_-1.5px_0_var(--t-brand)]"
const SEL_FIRST =
  "[box-shadow:inset_1.5px_0_0_var(--t-brand),inset_0_1.5px_0_var(--t-brand),inset_0_-1.5px_0_var(--t-brand)]"
const SEL_LAST =
  "[box-shadow:inset_-1.5px_0_0_var(--t-brand),inset_0_1.5px_0_var(--t-brand),inset_0_-1.5px_0_var(--t-brand)]"

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
  compact = false,
}: CaseTableProps<Row>) {
  const last = columns.length - 1
  return (
    <table className="w-full border-collapse text-[12px]">
      <thead>
        <tr>
          {columns.map((c) => (
            <th
              key={c.key}
              scope="col"
              data-col={c.key}
              title={c.title}
              {...(c.plus ? { "data-plus": "" } : {})}
              className={cn(
                "h-8 whitespace-nowrap border-b border-solid border-border bg-panel px-[4px] py-0 text-[10.5px] font-normal text-muted-foreground",
                c.align === "right" ? "text-right" : "text-left"
              )}
            >
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
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
                className={cn(
                  "group",
                  onRowClick &&
                    "cursor-pointer focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-brand"
                )}
              >
                {columns.map((c, i) => (
                  <td
                    key={c.key}
                    {...(c.plus ? { "data-plus": "" } : {})}
                    className={cn(
                      "whitespace-nowrap border-b border-solid border-border px-[4px] py-0 text-fg-2",
                      // 보통 행은 썸네일(36×52)이 잘 보이게 64(11/17 「테이블을 뚱뚱하게 세로」), 촘촘은 36
                      compact ? "h-[36px]" : "h-[64px]",
                      c.align === "right" && "text-right",
                      selected ? "bg-brand-bg" : "group-hover:bg-brand-bg/60",
                      // 방금 들어온 행: 옅은 청록 바탕(끝 60% 에서 투명) + 첫 칸 왼쪽 청록 줄
                      fresh &&
                        !selected &&
                        "bg-[linear-gradient(90deg,color-mix(in_srgb,var(--t-ai-bg)_55%,transparent),transparent_60%)]",
                      selected && (i === 0 ? SEL_FIRST : i === last ? SEL_LAST : SEL_MID),
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
                  <td colSpan={columns.length} className="border-b border-solid border-border bg-panel-2 p-0">
                    {open}
                  </td>
                </tr>
              ) : null}
            </React.Fragment>
          )
        })}
      </tbody>
    </table>
  )
}
