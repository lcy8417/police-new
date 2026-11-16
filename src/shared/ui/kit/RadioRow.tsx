import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"

// 시안 `.radio` 의 부품판: 한 줄 ◉(선택, brand) · ○(미선택, faint) + 글자(선택은 fg, 나머지 mute).
// 글자 모양 ◉○ 는 보조 기술이 읽지 않도록 aria-hidden — 선택 여부는 aria-checked 가 전한다.
export interface RadioRowOption {
  value: string
  label: string
}

export interface RadioRowProps {
  name: string
  options: RadioRowOption[]
  value: string | null
  onValueChange: (value: string) => void
  disabled?: boolean
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
  className?: string
}

export function RadioRow({ name, options, value, onValueChange, disabled = false, partId, className }: RadioRowProps) {
  return (
    <div
      {...partAttrs("RadioRow", { state: disabled ? "disabled" : undefined, id: partId })}
      role="radiogroup"
      aria-label={name}
      aria-disabled={disabled || undefined}
      className={cn("inline-flex flex-wrap gap-x-[10px] gap-y-[2px] text-muted-foreground", className)}
    >
      {options.map((opt) => {
        const checked = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            name={name}
            aria-checked={checked}
            disabled={disabled}
            onClick={() => {
              if (!disabled) onValueChange(opt.value)
            }}
            className={cn(
              "border-0 bg-transparent p-0 text-[inherit] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
              checked && "text-foreground"
            )}
          >
            <span aria-hidden="true" className={checked ? "text-brand" : "text-faint"}>
              {checked ? "◉ " : "○ "}
            </span>
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
