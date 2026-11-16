import * as React from "react"

import { Button, WorkbenchButton } from "@/shared/ui/kit"
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
  /** 사건 창 작업판(R6) — 작업판 단추(WorkbenchButton sm)로. 권하는 단추는 옅은 판 + 주황 점 */
  workbench?: boolean
  className?: string
}

const ON = "bg-brand-bg text-foreground [box-shadow:inset_0_0_0_1px_var(--t-brand)]"

export function ScasButtonRow({ label, actions, pressed = {}, locked = false, trailing, highlight, workbench = false, className }: ScasButtonRowProps) {
  if (workbench) {
    return (
      <div role="group" aria-label={label} className={cn("flex flex-wrap items-center gap-[3px]", className)}>
        {SCAS_BOTTOM_BUTTONS.map((name) => {
          const action = actions[name]
          const recommend = name === highlight
          return (
            <WorkbenchButton
              key={name}
              size="sm"
              variant={recommend ? "soft" : "ghost"}
              aria-pressed={action ? pressed[name] : undefined}
              disabled={!action || locked}
              title={!action ? "준비 중" : recommend ? "먼저 권함" : undefined}
              onClick={action}
            >
              {recommend ? <i aria-hidden="true" className="size-[6px] rounded-full bg-warn" /> : null}
              {name}
            </WorkbenchButton>
          )
        })}
        {trailing}
      </div>
    )
  }
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
