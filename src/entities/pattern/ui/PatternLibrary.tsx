import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { PatternIcon } from "@/shared/ui/viewer"

import { PATTERN_DRAG_FORMAT, type PatternLibraryItem, type PatternLibraryTab } from "../model/view"

export interface PatternLibraryProps {
  /** 종류 탭(알약 한 줄 · 개수) */
  tabs: readonly PatternLibraryTab[]
  /** 고른 탭 key */
  tab: string
  onTabChange: (key: string) => void
  /** 고른 탭의 문양 */
  items: readonly PatternLibraryItem[]
  /** 격자 묶음 이름(「선 문양 76개」) */
  itemsLabel: string
  /** 넣을 부위에 이미 든 문양 이름(이름 기준 — docs/pattern-data-model.md §2) */
  insertedNames: readonly string[]
  /** 넣을 부위 이름(「상」) */
  zoneLabel: string
  /** 누름 — 부르는 쪽이 넣거나 뺀다 */
  onToggle: (item: PatternLibraryItem) => void
  /** 마우스를 올린 문양(확대 보기 칸 미리보기) — 떼면 null */
  onHoverItem?: (item: PatternLibraryItem | null) => void
  canEdit: boolean
  /** 격자 위 덧칸(AI 추출 진행 등) */
  head?: React.ReactNode
  /** 칸 수(기본 4) */
  columns?: 4 | 5
  className?: string
}

const FOCUS = "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-1 focus-visible:outline-brand"
const GRID: Record<4 | 5, string> = { 4: "grid-cols-4", 5: "grid-cols-5" }

/** 문양 한 칸 — 흰 카드, 누르면 넣기 · 넣은 문양은 진한 테 + ✓(다시 누르면 빼기), 끌어서 부위 행에 놓기 */
function LibraryTile({
  item,
  inserted,
  zoneLabel,
  canEdit,
  onToggle,
  onHover,
}: {
  item: PatternLibraryItem
  inserted: boolean
  zoneLabel: string
  canEdit: boolean
  onToggle: () => void
  onHover?: (item: PatternLibraryItem | null) => void
}) {
  const { src, name, score, note } = item
  const scoreText = score === undefined ? "" : ` · AI ${score.toFixed(2)}`
  return (
    <button
      type="button"
      aria-pressed={inserted}
      aria-label={inserted ? `${zoneLabel}에서 ${name} 빼기` : `${zoneLabel}에 ${name} 넣기${score === undefined ? "" : `(AI ${score.toFixed(2)})`}`}
      title={`${name}${scoreText}${note ? ` — ${note}` : ""}\n${inserted ? `${zoneLabel}에 들어 있음 · 누르면 빼기` : `누르면 ${zoneLabel}에 넣기 · 끌어서 다른 부위에`}`}
      disabled={!canEdit}
      draggable={canEdit && !inserted}
      onDragStart={(e) => {
        e.dataTransfer.setData(PATTERN_DRAG_FORMAT, src)
        e.dataTransfer.effectAllowed = "copy"
      }}
      onClick={onToggle}
      onPointerEnter={onHover ? () => onHover(item) : undefined}
      onFocus={onHover ? () => onHover(item) : undefined}
      className={cn(
        "relative m-0 grid aspect-square cursor-pointer place-items-center rounded-[9px] border border-solid bg-picon p-[5px] transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none",
        FOCUS,
        "disabled:cursor-default disabled:opacity-60",
        inserted
          ? "border-brand [box-shadow:inset_0_0_0_1px_var(--t-brand)]"
          : "border-line-3 [box-shadow:0_1px_2px_var(--t-panel-drop)] enabled:hover:border-brand-line enabled:hover:[box-shadow:0_3px_8px_var(--t-panel-drop)]"
      )}
    >
      <PatternIcon name={name} src={src} title={name} className="size-full border-0 bg-transparent" />
      {score !== undefined ? (
        <span
          className={cn(
            "absolute bottom-[2px] left-[3px] rounded-[3px] bg-canvas/85 px-[2px] font-code text-[9.5px] leading-[12px] font-semibold tabular-nums",
            score < 0.5 ? "text-warn" : "text-ai"
          )}
        >
          {score.toFixed(2)}
        </span>
      ) : null}
      {inserted ? (
        <span aria-hidden="true" className="absolute -top-[5px] -right-[5px] grid size-[16px] place-items-center rounded-full bg-brand text-paper">
          <Check className="size-[11px]" strokeWidth={3} />
        </span>
      ) : null}
    </button>
  )
}

/**
 * 문양 목록 — 문양 코드 탭 · 신발 편집 · 살펴보기 판이 같이 쓰는 표시 부품
 * (11/17 사용자 「여기도 문양 목록이 좀 별로네」 · 「문양 목록도 너무 안보이네」).
 * 종류 = 또렷한 알약 탭 한 줄(개수), 문양 = 4칸 흰 카드 격자(넣은 문양 진한 테 + ✓). 코드 글자는 마우스 설명으로.
 * 넣고 빼기 판정 · 넣을 부위는 부르는 쪽이 정한다(값 · 콜백만).
 */
export function PatternLibrary({
  tabs,
  tab,
  onTabChange,
  items,
  itemsLabel,
  insertedNames,
  zoneLabel,
  onToggle,
  onHoverItem,
  canEdit,
  head,
  columns = 4,
  className,
}: PatternLibraryProps) {
  const tabsId = React.useId()
  return (
    <section aria-label="문양 목록" className={cn("flex min-h-0 min-w-0 flex-col gap-[8px]", className)}>
      <div
        role="tablist"
        aria-label="문양 종류"
        title={`넣을 부위: ${zoneLabel} — 4부위 행을 눌러 바꿉니다`}
        className="flex shrink-0 flex-wrap gap-[4px]"
      >
        {tabs.map((t) => {
          const on = t.key === tab
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              id={`${tabsId}-${t.key}`}
              aria-selected={on}
              onClick={() => onTabChange(t.key)}
              className={cn(
                "inline-flex h-[24px] shrink-0 cursor-pointer items-center gap-[4px] rounded-full border border-solid px-[9px] text-[11.5px] font-semibold whitespace-nowrap transition-colors duration-150 motion-reduce:transition-none",
                FOCUS,
                on ? "border-brand-3 bg-brand-3 text-paper" : "border-line-3 bg-panel text-fg-2 hover:border-brand-line hover:text-foreground",
                t.ai && "font-code tracking-[0.06em]",
                t.ai && !on && "border-ai-line text-ai"
              )}
            >
              {t.label}
              {t.count !== undefined ? (
                <span aria-hidden="true" className={cn("font-code text-[10px] font-normal tabular-nums", on ? "text-paper/80" : "text-muted-foreground")}>
                  {t.count}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
      <div
        role="tabpanel"
        aria-labelledby={`${tabsId}-${tab}`}
        onPointerLeave={onHoverItem ? () => onHoverItem(null) : undefined}
        className="flex min-h-0 flex-1 flex-col gap-[6px] overflow-y-auto px-[5px] pt-[5px] pb-[4px]"
      >
        {head}
        <div role="group" aria-label={itemsLabel} className={cn("grid gap-[7px]", GRID[columns])}>
          {items.map((item) => (
            <LibraryTile
              key={item.src}
              item={item}
              inserted={insertedNames.includes(item.name)}
              zoneLabel={zoneLabel}
              canEdit={canEdit}
              onToggle={() => onToggle(item)}
              onHover={onHoverItem}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
