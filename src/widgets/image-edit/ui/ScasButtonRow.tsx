import * as React from "react"

import { Button } from "@/shared/ui/kit"
import { cn } from "@/shared/lib/utils"

import { SCAS_BOTTOM_BUTTONS, type ScasBottomButton } from "../model/constants"

export interface ScasButtonRowProps {
  /** 접근성 이름(같은 화면에 두 줄이 있을 수 있어 구분) */
  label: string
  /** 버튼별 동작. 없으면 지금 기능이 없는 버튼 — 비활성 + 「준비 중」(spec §5-2 규칙 3) */
  actions: Partial<Record<ScasBottomButton, () => void>>
  /** 켜고 끄는 버튼의 지금 상태(켜짐은 파랗게 · `aria-pressed`). 적지 않은 버튼은 한 번 누르는 버튼 */
  pressed?: Partial<Record<ScasBottomButton, boolean>>
  /** 권한이 없어 잠근다(동작이 있는 버튼도 비활성) */
  locked?: boolean
  /** 줄 끝에 덧붙이는 버튼(SCAS 뒤) */
  trailing?: React.ReactNode
  /** 먼저 누르라고 권하는 버튼(시안 핀 4 — 주황 `warn`) */
  highlight?: ScasBottomButton
  className?: string
}

const ON = "bg-brand-bg text-foreground [box-shadow:inset_0_0_0_1px_var(--t-brand)]"

export function ScasButtonRow({ label, actions, pressed = {}, locked = false, trailing, highlight, className }: ScasButtonRowProps) {
  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap justify-center gap-[5px]", className)}>
      {SCAS_BOTTOM_BUTTONS.map((name) => {
        const action = actions[name]
        const variant = name === highlight ? "warn" : "default"
        if (!action) {
          return (
            <span key={name} title="준비 중" className="inline-flex">
              <Button size="sm" variant={variant} disabled>
                {name}
              </Button>
            </span>
          )
        }
        return (
          <Button
            key={name}
            size="sm"
            variant={variant}
            aria-pressed={pressed[name]}
            disabled={locked}
            onClick={action}
            className={cn(pressed[name] && ON)}
          >
            {name}
          </Button>
        )
      })}
      {trailing}
    </div>
  )
}
