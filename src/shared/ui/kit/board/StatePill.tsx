import type { ReactNode } from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../../part-attrs"
import { BOARD_TRANSITION, PANEL_FOCUS_RING } from "./board-classes"

// r4 로망 이식(`kit/item/StatePill`): 작은 상태 알약. 사실 · 상태는 회색 둥근 알약 하나(높이 19 · 좌우 7 · 10 굵게),
// 색은 실제 문제에만(`problem` = danger 바탕 + 「!」). 해당 없음은 점선 「–」.
// 로망 `bg-paper-chip text-sub` → `bg-strip text-muted-foreground`, `bg-accent-ink text-cta-fg` → `bg-danger-bg text-danger-fg`.

/** done 끝(✓) · pending 아직 · fact 사실 꼬리표 · problem 문제(!) · notApplicable 해당 없음(–) */
export type StatePillTone = "done" | "pending" | "fact" | "problem" | "notApplicable"

const GRAY = "h-[19px] gap-[3px] bg-strip px-[7px] text-[10px] text-muted-foreground"
const NA_MARK =
  "inline-grid h-[18px] min-w-[18px] flex-none place-items-center rounded-[7px] bg-transparent px-1 text-[11px] font-bold not-italic leading-none text-faint outline-1 -outline-offset-1 outline-dashed outline-line-3"
const TONE: Record<StatePillTone, string> = {
  done: cn(GRAY, "before:box-content before:content-['✓']"),
  pending: GRAY,
  fact: GRAY,
  problem: "h-[19px] gap-[3px] bg-danger-bg px-[7px] text-[10px] text-danger-fg",
  notApplicable: NA_MARK,
}

export interface StatePillProps {
  tone: StatePillTone
  /** 알약 글자. 해당 없음은 비우면 「–」 */
  children?: ReactNode
  /** 있으면 누르는 단추형. 없으면 글자형 */
  onClick?: () => void
  /** 단추형 접근성 이름 앞말(예: 「TP 등록」 → 「TP 등록 아직」) */
  label?: string
  /** 저장 중 — 다시 누를 수 없다 */
  busy?: boolean
  /** 지금 누를 수 없는 까닭 — 흐리게 그리고 누르면 onBlocked(까닭) */
  blocked?: string
  onBlocked?: (reason: string) => void
  /** 글자형 마우스 설명 */
  title?: string
  /** 위치 식별자(`data-part-id`) */
  partId?: string
  className?: string
}

export function StatePill({ tone, children, onClick, label, busy = false, blocked, onBlocked, title, partId, className }: StatePillProps) {
  const text = (
    <>
      {tone === "problem" && "! "}
      {children ?? (tone === "notApplicable" ? "–" : null)}
    </>
  )
  const base = cn(
    "inline-flex flex-none items-center whitespace-nowrap rounded-[99px] border-0 font-bold",
    TONE[tone],
    className
  )
  const marks = partAttrs("StatePill", { variant: tone, id: partId })
  if (!onClick) {
    return (
      <span {...marks} data-slot="panel-state-pill" data-state={tone} title={title} className={base}>
        {text}
      </span>
    )
  }
  return (
    <button
      type="button"
      {...marks}
      data-slot="panel-state-pill"
      data-state={tone}
      data-busy={busy ? "true" : "false"}
      aria-label={
        label
          ? `${label} ${typeof children === "string" ? children : tone === "notApplicable" ? "해당 없음" : ""}`.trim()
          : undefined
      }
      aria-busy={busy || undefined}
      aria-disabled={blocked ? true : undefined}
      disabled={busy}
      title={title}
      onClick={() => (blocked ? onBlocked?.(blocked) : onClick())}
      className={cn(
        base,
        "cursor-pointer disabled:cursor-default disabled:opacity-40 aria-disabled:cursor-default aria-disabled:opacity-40 active:translate-y-px",
        BOARD_TRANSITION,
        PANEL_FOCUS_RING
      )}
    >
      {text}
    </button>
  )
}
