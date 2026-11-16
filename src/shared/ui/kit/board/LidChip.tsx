import type { ComponentPropsWithRef, ReactNode } from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../../part-attrs"
import { BOARD_BUTTON, BOARD_TRANSITION, CHIP_SHADOW } from "./board-classes"

// r4 로망 이식(`LidChip`): 뚜껑 띠 위 거르기 칩. 켜짐 = 종이색 바탕 · brand-3 글자 + 옅은 그림자,
// 꺼짐 = 종이색 16% 바탕 · 종이색 글자. 0건은 흐리게(누름은 그대로), 누르는 동안 1px 내려앉음.
export interface LidChipProps extends ComponentPropsWithRef<"button"> {
  active?: boolean
  /** 0건을 흐리게 표시해도 단추 동작은 유지한다 */
  zero?: boolean
  /** 모름은 호출부가 「–」로, 생략은 undefined */
  count?: ReactNode
  variant?: "board" | "finder"
  /** 아직 셀 수 없는 칩 — 수 대신 「준비 중」, 고를 수 없음(누르면 onBlocked) */
  pending?: boolean
  /** pending · blocked 칩을 누르면 — 호출부가 까닭 쪽지를 띄운다(눌러도 무반응인 단추는 없다) */
  onBlocked?: () => void
  /** 지금은 못 누르는 단추 — 흐리게 늘 보여 주고 누르면 onBlocked */
  blocked?: boolean
  /** 테 단추 */
  outline?: boolean
  /** 위치 식별자(`data-part-id`) */
  partId?: string
}

export function LidChip({
  active = false,
  zero = false,
  count,
  variant = "board",
  pending = false,
  blocked = false,
  outline = false,
  onBlocked,
  partId,
  className,
  children,
  onClick,
  ...props
}: LidChipProps) {
  const on = active && !pending
  const state = pending ? "pending" : on ? "on" : "off"
  return (
    <button
      type="button"
      {...props}
      {...partAttrs("LidChip", { state: state === "off" ? undefined : state, id: partId })}
      onClick={pending || blocked ? () => onBlocked?.() : onClick}
      aria-disabled={pending || blocked || undefined}
      data-slot="lid-chip"
      data-state={state}
      data-zero={zero && !pending}
      data-variant={variant}
      data-outline={outline || undefined}
      aria-pressed={on}
      className={cn(
        BOARD_BUTTON,
        variant === "board" && BOARD_TRANSITION,
        "flex h-7 items-center gap-[5px] rounded-[7px] px-[11px] py-[5px] text-[12px] font-bold leading-[18px] whitespace-nowrap",
        !pending && "enabled:active:[transform:translateY(1px)]",
        pending
          ? "cursor-default bg-paper/16 text-paper"
          : on
            ? cn("bg-paper text-brand-3", CHIP_SHADOW)
            : "bg-paper/16 text-paper hover:bg-paper/28",
        zero && !pending && "opacity-40",
        blocked && "cursor-default opacity-40",
        outline &&
          !on &&
          "bg-transparent [box-shadow:inset_0_0_0_1px_color-mix(in_srgb,var(--t-paper)_55%,transparent)] hover:bg-paper/16",
        className
      )}
    >
      {children}
      {/* 원본처럼 이름과 수 사이에 띄어쓰기 한 칸(읽을 때 「결과 확인 전 14」) */}
      {pending ? (
        <>
          {" "}
          <span className="shrink-0 rounded-full border border-solid border-paper/22 px-[7px] text-[9.5px] font-bold leading-4 text-paper/40">
            준비 중
          </span>
        </>
      ) : (
        count !== undefined && (
          <>
            {" "}
            <b className={cn("text-[11.5px] font-bold leading-[17.25px] tabular-nums", on ? "text-brand-3" : "opacity-[0.72]")}>
              {count}
            </b>
          </>
        )
      )}
    </button>
  )
}
