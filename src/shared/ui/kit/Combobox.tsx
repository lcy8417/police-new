import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"
import { Field } from "./Field"

// 검색형 한 칸 고르기(시안 S02 관서 검색): 치면 일치 항목만, 결과에 경로(「대구청 › 동부서」)를 보인다.
// 승인 시안이 2단 드롭다운을 이 한 칸으로 대체했다 — 되돌리지 않는다(SKILL 「하지 말 것」).
// 항목 목록은 받기만 한다(관서 조회는 features 가 조립 — 업무를 모른다).
export interface ComboboxItem {
  value: string
  label: string
  /** 결과에 덧붙는 경로(예: 「대구청 › 동부서」) */
  path?: string
}

export interface ComboboxProps {
  items: ComboboxItem[]
  value: string | null
  onValueChange: (value: string) => void
  placeholder?: string
  emptyText?: string
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
  className?: string
  /** 입력 칸 id(보이는 `<label htmlFor>` 와 잇기) */
  id?: string
  /** 입력 칸 접근성 이름(보이는 라벨이 없을 때) */
  "aria-label"?: string
  /** 입력 칸 접근성 이름을 가리키는 요소 id(보이는 라벨 글이 `<label>` 이 아닐 때) */
  "aria-labelledby"?: string
}

export function Combobox({
  items,
  value,
  onValueChange,
  placeholder,
  emptyText = "일치하는 항목 없음",
  partId,
  className,
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
}: ComboboxProps) {
  const listId = React.useId()
  // query 가 null 이면 입력 칸에 고른 항목의 이름을 보인다
  const [query, setQuery] = React.useState<string | null>(null)
  const [open, setOpen] = React.useState(false)
  const [active, setActive] = React.useState(0)

  const selected = items.find((i) => i.value === value) ?? null
  const text = query ?? selected?.label ?? ""
  const needle = (query ?? "").trim().toLowerCase()
  const matches = needle
    ? items.filter((i) => i.label.toLowerCase().includes(needle) || (i.path ?? "").toLowerCase().includes(needle))
    : items

  // 목록이 줄어도 가리키는 칸이 범위를 벗어나지 않게 그릴 때마다 맞춘다
  const activeIdx = Math.max(0, Math.min(active, matches.length - 1))
  const optionId = (i: number) => `${listId}-opt-${i}`

  const choose = (item: ComboboxItem) => {
    onValueChange(item.value)
    setQuery(null)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setOpen(true)
      setActive(Math.min(activeIdx + 1, matches.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive(Math.max(activeIdx - 1, 0))
    } else if (e.key === "Enter") {
      const item = matches[activeIdx]
      if (open && item) {
        e.preventDefault()
        choose(item)
      }
    } else if (e.key === "Escape") {
      // 목록이 열려 있으면 이 Esc 는 목록 닫기 몫 — 바깥 창(사건 창 · 대화상자)이 같이 닫히지 않게 알린다
      if (open) e.preventDefault()
      setQuery(null)
      setOpen(false)
    }
  }

  return (
    <div {...partAttrs("Combobox", { id: partId })} className={cn("relative min-w-0", className)}>
      <Field
        id={id}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        variant="pick"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && matches.length > 0 ? optionId(activeIdx) : undefined}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder={placeholder}
        value={text}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        // 칸을 떠나면 확정하지 않은 입력 글자는 버리고, 확정된 선택(없으면 빈 칸)을 다시 보인다
        onBlur={() => {
          setQuery(null)
          setOpen(false)
        }}
        onKeyDown={onKeyDown}
      />
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-[4px] max-h-[240px] overflow-y-auto m-0 p-[3px] list-none rounded-[6px] border border-solid border-line-3 bg-panel-2 text-[12.5px] [box-shadow:0_8px_30px_var(--t-panel-drop)]"
        >
          {matches.length === 0 ? (
            <li className="px-[8px] py-[6px] text-muted-foreground">{emptyText}</li>
          ) : (
            matches.map((item, i) => (
              <li
                key={item.value}
                id={optionId(i)}
                role="option"
                aria-selected={item.value === value}
                data-active={i === activeIdx || undefined}
                // 입력 칸이 초점을 잃어 목록이 닫히기 전에 클릭이 닿도록
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(item)}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "flex items-baseline gap-[8px] px-[8px] py-[6px] rounded-[4px] cursor-pointer text-fg-2",
                  i === activeIdx && "bg-brand-bg"
                )}
              >
                <span>{item.label}</span>
                {item.path ? <span className="text-[11px] text-dim">{item.path}</span> : null}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}
