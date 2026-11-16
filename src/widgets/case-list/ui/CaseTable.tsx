import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { ListHeadRow, ListRow } from "@/shared/ui/kit"

// S01 사건관리 목록 표 — 11/17 사용자 「테이블 컴포넌트 로망꺼 가져오면 안되나?? … 칸 정렬도 안맞네」:
// `<table>` 대신 로망 목록 표 부품(kit ListHeadRow · ListRow) 위에 다시 짰다. 머리 줄과 행이 **같은 격자 클래스**(gridClass)를
// 써서 칸 폭 · 왼쪽 끝이 늘 같다(숫자 오른쪽 · 글자 왼쪽 · 머리도 같은 기준).
// 화면 읽기는 표 역할(table · row · columnheader · cell)로 남긴다. 업무 말은 모르고 `render` 가 칸 내용을 그린다.

export interface CaseTableColumn<Row> {
  key: string
  header: React.ReactNode
  /** 머리 마우스 설명(줄인 머리 글자의 원래 이름) */
  title?: string
  align?: "left" | "right" | "center"
  render: (row: Row) => React.ReactNode
}

const INTERACTIVE = "button, a, input, select, textarea, label, [role='button']"
const ALIGN = { left: "justify-self-stretch text-left", right: "justify-self-stretch text-right", center: "justify-self-stretch text-center" }

interface CaseTableProps<Row> {
  /** 표 이름(화면 읽기) */
  label: string
  /** 머리 · 행이 함께 쓰는 격자 열 클래스(예 `grid-cols-[44px_1fr_…]`) — 리터럴로 넘겨야 Tailwind 가 만든다 */
  gridClass: string
  columns: CaseTableColumn<Row>[]
  rows: Row[]
  rowKey: (row: Row) => string
  /** 고른 행(지금 사건 창에 열린 사건) */
  selectedKey?: string | null
  onRowClick?: (row: Row) => void
  /** 촘촘한 행 높이(36). 기본 64(썸네일 36×52 가 잘 보이게) */
  compact?: boolean
}

export function CaseTable<Row>({
  label,
  gridClass,
  columns,
  rows,
  rowKey,
  selectedKey,
  onRowClick,
  compact = false,
}: CaseTableProps<Row>) {
  return (
    <div role="table" aria-label={label} className="min-w-[860px]">
      <ListHeadRow role="row" aria-hidden={undefined} className={cn("grid", gridClass)}>
        {columns.map((c) => (
          <span
            key={c.key}
            role="columnheader"
            data-col={c.key}
            title={c.title}
            className={cn("min-w-0 truncate", ALIGN[c.align ?? "left"])}
          >
            {c.header}
          </span>
        ))}
      </ListHeadRow>
      {rows.map((row) => {
        const key = rowKey(row)
        return (
          <ListRow
            key={key}
            role="row"
            selected={key === selectedKey}
            aria-selected={key === selectedKey || undefined}
            interactive={onRowClick !== undefined}
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
            className={cn("grid", gridClass, compact ? "h-9" : "h-16", !onRowClick && "cursor-default")}
          >
            {columns.map((c) => (
              <span key={c.key} role="cell" data-col={c.key} className={cn("min-w-0", ALIGN[c.align ?? "left"])}>
                {c.render(row)}
              </span>
            ))}
          </ListRow>
        )
      })}
    </div>
  )
}
