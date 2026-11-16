import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"

// 시안 `.stepper`(S01 진행 상태): 칸마다 5px 높이 막대. 끝난 칸 파랑 · 지금 칸 주황 + 빛 · 남은 칸 회색.
// current = 지금 칸의 번호(0부터). steps.length 와 같으면 모두 끝난 상태. 색만으로 구분하지 않도록 칸마다 title 과
// 전체 읽는 이름(「진행 2/4 · 검토」)을 단다 — 시안에는 없는 접근성 보강(모양은 그대로).
// width: 칸 폭. 시안 S01 은 인라인 20, `.stepper i` 기본은 18.
export interface StepperProps extends Omit<React.ComponentProps<"span">, "children"> {
  steps: string[]
  current: number
  width?: 18 | 20
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
}

export function Stepper({ steps, current, width = 20, partId, className, ...props }: StepperProps) {
  const now = Math.min(Math.max(Math.trunc(current), 0), steps.length)
  const label =
    now >= steps.length ? "모든 단계 끝남" : `진행 ${now + 1}/${steps.length} · ${steps[now]}`
  return (
    <span
      {...partAttrs("Stepper", { id: partId })}
      role="img"
      aria-label={label}
      className={cn("inline-flex items-center gap-[3px]", className)}
      {...props}
    >
      {steps.map((s, i) => {
        const st = i < now ? "done" : i === now ? "now" : "todo"
        return (
          <i
            key={`${s}-${i}`}
            title={s}
            data-step={st}
            className={cn(
              "block h-[5px] rounded-[3px]",
              width === 20 ? "w-[20px]" : "w-[18px]",
              st === "done" && "bg-brand-2",
              st === "now" && "bg-warn [box-shadow:0_0_6px_0_var(--t-warn)]",
              st === "todo" && "bg-line-3",
            )}
          />
        )
      })}
    </span>
  )
}
