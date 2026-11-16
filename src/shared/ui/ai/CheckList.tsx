import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"

// 시안 `.check` 줄 묶음. 줄 = 동그라미 표(18px) · 글자 · 오른쪽 덧붙임(값 · 칩 · 버튼).
// 표는 색만으로 구분하지 않는다: ok ✓ · warn ! · bad ×(시안 기본 글리프). 시안이 `·` `?` 를 쓴 자리는 icon 으로 바꾼다.
// topLine: 시안은 `.check:first-child` 만 윗선이 없다 — 막대 · 제목 아래에 놓여 첫 줄도 윗선이 있는 자리(S02)는 true.
// dense: 줄 위아래 안쪽 4px(S07 「AI 근거」), 기본 6px.
export type CheckTone = "ok" | "warn" | "bad"

export interface CheckItem {
  tone: CheckTone
  /** 줄 글자(진하게 넣을 부분은 호출하는 쪽이 `<b>` 로) */
  text: React.ReactNode
  /** 글자 아래 흐린 두 번째 줄 */
  detail?: React.ReactNode
  /** 오른쪽 덧붙임: 값 글자 · 칩 · 버튼 */
  action?: React.ReactNode
  /** 표 글리프(기본: ok ✓ · warn ! · bad ×) */
  icon?: string
}

export interface CheckListProps extends Omit<React.ComponentProps<"div">, "children"> {
  items: CheckItem[]
  topLine?: boolean
  dense?: boolean
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
}

const GLYPH: Record<CheckTone, string> = { ok: "✓", warn: "!", bad: "×" }
const TONE_LABEL: Record<CheckTone, string> = { ok: "정상", warn: "주의", bad: "문제" }
const IC_CLASS: Record<CheckTone, string> = {
  ok: "bg-ok-bg text-ok-fg border-ok-line",
  warn: "bg-warn-bg text-warn border-warn-line",
  bad: "bg-danger-bg text-danger-fg border-danger-line",
}

export function CheckList({ items, topLine = false, dense = false, partId, className, ...props }: CheckListProps) {
  return (
    <div
      {...partAttrs("CheckList", { variant: dense ? "dense" : undefined, id: partId })}
      role="list"
      className={cn("text-[11.5px] leading-[1.4]", className)}
      {...props}
    >
      {items.map((it, i) => (
        <div
          key={i}
          role="listitem"
          data-tone={it.tone}
          className={cn(
            "grid grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-[8px] border-t border-solid border-line-2",
            dense ? "py-[4px]" : "py-[6px]",
            i === 0 && !topLine && "border-t-0",
          )}
        >
          <span
            role="img"
            aria-label={TONE_LABEL[it.tone]}
            className={cn(
              "grid size-[18px] place-items-center rounded-[50%] border border-solid font-code text-[10px] font-bold",
              IC_CLASS[it.tone],
            )}
          >
            {it.icon ?? GLYPH[it.tone]}
          </span>
          <span>
            {it.text}
            {it.detail != null && (
              <>
                <br />
                <span className="text-dim">{it.detail}</span>
              </>
            )}
          </span>
          {it.action ?? <span />}
        </div>
      ))}
    </div>
  )
}
