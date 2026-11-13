import * as React from "react"
import { Search } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"

// 시안 `.inp` 의 부품판. 변형 이름은 시안 S01 · S02 의 `data-part-variant` 값 그대로다.
// - 글자만 있는 변형(text · mono · mono-sm · mono-sm-flex)은 `<input>` 이 부품 루트다.
// - 오른쪽에 덧그림이 있는 변형(select · pick · select-mono · select-warn · search-shell)은
//   바깥 틀(span)이 부품 루트(표식)이고, 안의 `<input>` 이 접근성 이름 · aria-* · readonly 를 가진다.
export type FieldVariant =
  | "text"
  | "mono"
  | "mono-sm"
  | "mono-sm-flex"
  | "select"
  | "pick"
  | "select-mono"
  | "select-warn"
  | "search-shell"

const BOX =
  "inline-flex items-center gap-[6px] min-w-0 h-[26px] px-[8px] rounded-[6px] border border-solid bg-strip text-[12.5px] text-fg-2 border-border"

const VARIANT_CLASS: Record<FieldVariant, string> = {
  text: "w-full",
  mono: "w-full font-mono tabular-nums",
  "mono-sm": "w-full font-mono tabular-nums text-[11.5px]",
  "mono-sm-flex": "flex-1 font-mono tabular-nums text-[11.5px]",
  select: "w-full",
  pick: "w-full",
  "select-mono": "w-full font-mono text-[11.5px]",
  "select-warn": "w-full border-warn-line",
  "search-shell": "w-[260px] text-dim",
}

/** 바깥 틀이 필요한 변형(덧그림이 붙는 것) */
const WRAPPED: ReadonlySet<FieldVariant> = new Set(["select", "pick", "select-mono", "select-warn", "search-shell"])

export interface FieldProps extends Omit<React.ComponentProps<"input">, "size"> {
  variant?: FieldVariant
  /** 필수: `aria-required`(빨간 `*` 는 라벨 쪽 일) */
  required?: boolean
  /** 읽기 전용: `data-part-state="readonly"` */
  readOnly?: boolean
  /** 오류: `data-part-state="invalid"` + `aria-invalid` */
  invalid?: boolean
  /** 돋보기 아이콘(바깥 틀이 부품 루트) */
  icon?: "search"
  /** 바깥 틀 변형에서 입력 뒤 덧그림 앞에 놓이는 내용(예: 확인 필요 칩) */
  after?: React.ReactNode
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
}

export function Field({
  variant = "text",
  required,
  readOnly,
  invalid,
  icon,
  after,
  partId,
  className,
  style,
  ...props
}: FieldProps) {
  const resolved: FieldVariant = icon === "search" ? "search-shell" : variant
  const wrapped = WRAPPED.has(resolved) || icon !== undefined
  const state = invalid ? "invalid" : readOnly ? "readonly" : undefined
  const attrs = partAttrs("Field", {
    // 시안이 text 도 이름을 붙여 두었으므로 그대로 낸다(R17)
    variant: resolved,
    state,
    id: partId,
  })
  const inputAria = {
    "aria-invalid": invalid ? (true as const) : undefined,
    "aria-required": required ? (true as const) : undefined,
  }

  if (!wrapped) {
    return (
      <input
        {...attrs}
        {...inputAria}
        readOnly={readOnly}
        className={cn(BOX, VARIANT_CLASS[resolved], className)}
        style={style}
        {...props}
      />
    )
  }

  const isSearch = resolved === "search-shell"
  return (
    <span {...attrs} className={cn(BOX, VARIANT_CLASS[resolved], className)} style={style}>
      {isSearch ? <Search aria-hidden="true" className="size-[13px] shrink-0" /> : null}
      <input
        {...inputAria}
        readOnly={readOnly}
        className={cn(
          "min-w-0 border-0 bg-transparent p-0 text-inherit [field-sizing:content]",
          isSearch ? "flex-1 placeholder:text-dim" : "max-w-full"
        )}
        {...props}
      />
      {after ? <span className="ml-[6px] inline-flex">{after}</span> : null}
      {isSearch ? null : (
        <span aria-hidden="true" className={cn("ml-auto border-none",resolved === "pick" ? "text-brand" : "text-dim")}>
          {resolved === "pick" ? "⌕" : "▾"}
        </span>
      )}
    </span>
  )
}
