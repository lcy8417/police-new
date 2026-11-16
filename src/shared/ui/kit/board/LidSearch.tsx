import { useRef, type ComponentPropsWithRef, type InputHTMLAttributes, type RefObject } from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../../part-attrs"
import { BOARD_TRANSITION, CHIP_SHADOW, PANEL_FOCUS_RING } from "./board-classes"

// r4 로망 이식(`LidSearch`): 뚜껑 오른쪽 끝 흰 찾기 칸. 값이 있을 때만 × 지우기(누르면 칸으로 초점).
// 칸의 빈 곳을 눌러도 입력 칸으로 초점이 간다. 로망의 전역 찾기 등록(zustand `useRegisterListSearch`)은 옮기지 않았다.
export interface LidSearchProps extends Omit<ComponentPropsWithRef<"div">, "children"> {
  variant?: "board" | "finder"
  /** 표의 키보드 · 초점 제어와 공유할 참조 */
  inputRef?: RefObject<HTMLInputElement | null>
  inputProps: InputHTMLAttributes<HTMLInputElement>
  /** 값이 있을 때만 지우기 단추를 보인다 */
  onClear?: () => void
  /** 지우기 단추 이름 */
  clearLabel?: string
  /** 위치 식별자(`data-part-id`) */
  partId?: string
}

export function LidSearch({
  variant = "board",
  inputRef,
  inputProps,
  onClear,
  clearLabel = "찾기 지우기",
  partId,
  className,
  onClick,
  ...props
}: LidSearchProps) {
  const localRef = useRef<HTMLInputElement>(null)
  const searchRef = inputRef ?? localRef
  const hasValue = String(inputProps.value ?? "").length > 0
  const suffix =
    hasValue && onClear ? (
      <button
        type="button"
        data-slot="lid-search-clear"
        aria-label={clearLabel}
        onClick={() => {
          onClear()
          searchRef.current?.focus()
        }}
        className={cn(
          "m-0 cursor-pointer border-0 p-0",
          BOARD_TRANSITION,
          PANEL_FOCUS_RING,
          "-mr-1 inline-grid size-[18px] flex-none place-items-center rounded-[99px] bg-border text-center text-[10px] font-bold leading-none text-fg-2 active:[transform:translateY(1px)]"
        )}
      >
        ×
      </button>
    ) : null

  return (
    <div
      {...props}
      {...partAttrs("LidSearch", { variant: variant === "board" ? undefined : variant, state: hasValue ? "on" : undefined, id: partId })}
      onClick={(event) => {
        onClick?.(event)
        if (
          event.defaultPrevented ||
          (event.target instanceof Element && event.target.closest("button, a, input, select, textarea"))
        )
          return
        searchRef.current?.focus()
      }}
      data-slot="lid-search"
      data-variant={variant}
      data-state={hasValue ? "on" : "off"}
      className={cn(
        "ml-auto inline-flex h-7 cursor-text items-center gap-1.5 rounded-[7px] bg-panel px-2.5 text-brand-3",
        CHIP_SHADOW,
        "focus-within:[box-shadow:none] focus-within:ring-[3px] focus-within:ring-paper/50",
        variant === "finder" ? "min-w-[200px] flex-[0_1_270px]" : "min-w-[130px] flex-[0_1_148px]",
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="block size-3.5 flex-none align-baseline"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      <input
        ref={searchRef}
        type="text"
        autoComplete="off"
        spellCheck={false}
        {...inputProps}
        className={cn(
          "m-0 w-full min-w-0 appearance-none border-0 bg-transparent p-0 text-[12px] font-bold leading-[18px] text-foreground outline-none placeholder:font-normal placeholder:text-faint",
          inputProps.className
        )}
      />
      {suffix}
    </div>
  )
}
