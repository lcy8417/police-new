import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"

// 단계 표시. 변형 두 가지(기본은 bar — 기존 API 그대로).
// - bar(시안 `.stepper`, S01 진행 상태): 칸마다 5px 높이 막대. 끝난 칸 파랑 · 지금 칸 주황 + 빛 · 남은 칸 회색.
//   색만으로 구분하지 않도록 칸마다 title 과 전체 읽는 이름(「진행 2/4 · 검토」)을 단다 — 시안에는 없는 접근성 보강(모양은 그대로).
//   width: 칸 폭. 시안 S01 은 인라인 20, `.stepper i` 기본은 18.
// - labeled(시안 S02 제목 줄 「접수 → 1차 작업 → …」): 점 + 단계 이름 + 14px 연결선. 끝남 파랑 · 지금 청록(맥박 점) · 남음 흐림.
//   연결선은 지금 단계까지 파랑. 단계 이름이 보이므로 읽는 이름은 따로 달지 않고 지금 단계에 `aria-current="step"`.
// current = 지금 칸의 번호(0부터). steps.length 와 같으면 모두 끝난 상태. 숫자가 아니면(NaN · ±Infinity) 첫 칸.
export type StepperVariant = "bar" | "labeled"

export interface StepperProps extends Omit<React.ComponentProps<"span">, "children"> {
  steps: string[]
  current: number
  variant?: StepperVariant
  /** bar 전용: 칸 폭(20 = S01, 18 = CSS 기본) */
  width?: 18 | 20
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
}

function clampCurrent(current: number, n: number): number {
  const c = Number.isFinite(current) ? Math.trunc(current) : 0
  return Math.min(Math.max(c, 0), n)
}

export function Stepper({ steps, current, variant = "bar", width = 20, partId, className, ...props }: StepperProps) {
  const now = clampCurrent(current, steps.length)
  const stateOf = (i: number) => (i < now ? "done" : i === now ? "now" : "todo")

  if (variant === "labeled") {
    return (
      <span
        {...partAttrs("Stepper", { variant: "labeled", id: partId })}
        className={cn("inline-flex items-center gap-[4px] text-[10.5px] font-normal", className)}
        {...props}
      >
        {steps.map((s, i) => {
          const st = stateOf(i)
          return (
            <React.Fragment key={`${s}-${i}`}>
              {i > 0 && (
                <i
                  data-line=""
                  aria-hidden="true"
                  className={cn("block h-px w-[14px]", i <= now ? "bg-brand-2" : "bg-line-3")}
                />
              )}
              <span
                data-step={st}
                aria-current={st === "now" ? "step" : undefined}
                className={cn(
                  "inline-flex items-center gap-[4px]",
                  st === "done" && "text-brand",
                  st === "now" && "text-ai",
                  st === "todo" && "text-faint",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-[7px] rounded-[50%] border border-solid border-current",
                    st === "todo" ? "bg-transparent" : "bg-current",
                    st === "now" && "motion-safe:animate-ai-pulse",
                  )}
                />
                {s}
              </span>
            </React.Fragment>
          )
        })}
      </span>
    )
  }

  const label = now >= steps.length ? "모든 단계 끝남" : `진행 ${now + 1}/${steps.length} · ${steps[now]}`
  return (
    <span
      {...partAttrs("Stepper", { id: partId })}
      role="img"
      aria-label={label}
      className={cn("inline-flex items-center gap-[3px]", className)}
      {...props}
    >
      {steps.map((s, i) => {
        const st = stateOf(i)
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
