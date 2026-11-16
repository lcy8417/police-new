import { X } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"
import { Chip } from "./Chip"
import { Field } from "./Field"

// 목록 위 한 줄: 검색 칸(×로 지움) + 묶음별 고르기 칩(여러 개 선택) + 「조건 지우기」 + 결과 개수.
// 결과가 0건일 때의 안내 글은 화면이 정한다(이 부품은 개수만 보인다). 색은 토큰만 — 어떤 팔레트에서도 동작.
export interface FilterOption {
  value: string
  label: string
  count?: number
}

export interface FilterGroup {
  key: string
  label: string
  options: readonly FilterOption[]
  /** 선택된 값들(빈 배열 = 이 묶음은 거르지 않음) */
  value: readonly string[]
}

export interface FilterBarProps {
  query: string
  onQueryChange: (query: string) => void
  filters: readonly FilterGroup[]
  onFilterChange: (key: string, values: string[]) => void
  onClear: () => void
  /** 걸러진 개수 */
  resultCount?: number
  /** 전체 개수 */
  total?: number
  searchPlaceholder?: string
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
  className?: string
}

export function FilterBar({
  query,
  onQueryChange,
  filters,
  onFilterChange,
  onClear,
  resultCount,
  total,
  searchPlaceholder = "검색",
  partId,
  className,
}: FilterBarProps) {
  const active = query.trim() !== "" || filters.some((f) => f.value.length > 0)

  const toggle = (g: FilterGroup, v: string) => {
    const next = g.value.includes(v) ? g.value.filter((x) => x !== v) : [...g.value, v]
    onFilterChange(g.key, next)
  }

  return (
    <div
      {...partAttrs("FilterBar", { state: active ? "active" : undefined, id: partId })}
      role="search"
      className={cn("flex flex-wrap items-center gap-x-[14px] gap-y-[6px]", className)}
    >
      <Field
        icon="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={searchPlaceholder}
        aria-label="검색어"
        className="w-[220px]"
        after={
          query ? (
            <button
              type="button"
              aria-label="검색어 지우기"
              onClick={() => onQueryChange("")}
              className="inline-flex size-[16px] cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-dim hover:text-fg-2"
            >
              <X aria-hidden="true" className="size-[12px]" />
            </button>
          ) : null
        }
      />
      {filters.map((g) => (
        <div key={g.key} role="group" aria-label={g.label} className="flex flex-wrap items-center gap-[5px]">
          <span className="text-[11.5px] text-muted-foreground">{g.label}</span>
          {g.options.map((o) => {
            const on = g.value.includes(o.value)
            return (
              <button
                key={o.value}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(g, o.value)}
                className="cursor-pointer border-0 bg-transparent p-0"
              >
                <Chip variant={on ? "blue" : "default"} on={on} className="cursor-pointer">
                  {o.label}
                  {o.count !== undefined ? (
                    <>
                      {" "}
                      <span className="font-code tabular-nums opacity-70">{o.count}</span>
                    </>
                  ) : null}
                </Chip>
              </button>
            )
          })}
        </div>
      ))}
      <button
        type="button"
        onClick={onClear}
        disabled={!active}
        className="h-[22px] cursor-pointer rounded-[6px] border border-solid border-line-3 bg-panel-2 px-[8px] text-[11.5px] text-fg-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        조건 지우기
      </button>
      {resultCount !== undefined ? (
        <span aria-live="polite" className="ml-auto font-code text-[11.5px] tabular-nums text-muted-foreground">
          {total !== undefined ? `${resultCount} / 전체 ${total}` : `${resultCount}건`}
        </span>
      ) : null}
    </div>
  )
}
