import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"
import { Segmented } from "./Segmented"

// 「보기 1 · 3 · 5」처럼 한 번에 몇 개를 볼지 고르는 칸(족적 1·3·5개 보기 등). Segmented 에 라벨을 붙인 것.
// 숫자 옵션은 「n개」로, 글자 옵션은 그대로 보인다. 값의 종류(숫자/글자)는 onChange 로 그대로 돌려준다.
export interface ViewCountSwitchProps<T extends number | string> {
  options: readonly T[]
  value: T
  onChange: (value: T) => void
  /** 왼쪽 라벨(예: 「보기」). 접근성 이름도 겸한다 */
  label?: string
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
  className?: string
}

export function ViewCountSwitch<T extends number | string>({
  options,
  value,
  onChange,
  label,
  partId,
  className,
}: ViewCountSwitchProps<T>) {
  const items = options.map((o) => ({ value: String(o), label: typeof o === "number" ? `${o}개` : o }))
  return (
    <div {...partAttrs("ViewCountSwitch", { id: partId })} className={cn("inline-flex items-center gap-[8px]", className)}>
      {label ? <span className="text-[12px] text-muted-foreground whitespace-nowrap">{label}</span> : null}
      <Segmented
        items={items}
        value={String(value)}
        onValueChange={(v) => {
          const hit = options.find((o) => String(o) === v)
          if (hit !== undefined) onChange(hit)
        }}
        aria-label={label ?? "보기 개수"}
      />
    </div>
  )
}
