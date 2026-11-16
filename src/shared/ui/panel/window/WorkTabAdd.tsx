import * as React from "react"
import { Plus } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Field } from "../../kit"
import { partAttrs } from "../../part-attrs"

// 작업 탭 줄 오른쪽 끝 「+」(11/17 사용자 「여기도 오른쪽에 + 버튼으로 기존 기능들이나 사건들 추가할 수 있게」).
// 누르면 떠 있는 작은 메뉴: 찾기 칸 + 묶음 목록(예 「사건 찾아 열기」 · 「기능 열기」). 무엇을 열지 · 찾기는 부르는 쪽이 정한다(값 · 콜백만).
// 떠 있는 메뉴는 `role="dialog"` + `data-state="open"` — 창 틀(CaseWindowFrame)의 Esc 가 이 층을 먼저 건너뛰고, 이 메뉴가 Esc 로 닫힌다.

/** 목록 줄 하나 */
export interface WorkTabAddItem {
  id: string
  /** 굵은 이름 */
  label: string
  /** 아래 흐린 한 줄 */
  sub?: string
  /** 오른쪽 꼬리글(「열림」 등) */
  end?: string
  /** 잠김 — 까닭은 `reason`(마우스 설명) */
  disabled?: boolean
  reason?: string
}

/** 목록 묶음 */
export interface WorkTabAddGroup {
  key: string
  title: string
  items: readonly WorkTabAddItem[]
  /** 줄이 없을 때 안내 */
  empty?: string
}

export interface WorkTabAddProps {
  groups: readonly WorkTabAddGroup[]
  /** 찾기 칸 값 — 없으면(undefined) 찾기 칸을 그리지 않음 */
  query?: string
  onQueryChange?: (query: string) => void
  /** 찾기 칸 이름 · 자리 글 */
  searchLabel?: string
  placeholder?: string
  /** 줄을 고름 — 고르면 메뉴가 닫힌다 */
  onPick: (groupKey: string, id: string) => void
  /** 메뉴 맨 아래 흐린 안내(최대 개수 등) */
  note?: string
  /** 「+」 단추 이름(기본 「탭 추가」) */
  label?: string
  /** 위치 식별자(`data-part-id`) */
  partId?: string
}

const FOCUS = "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-brand"

export function WorkTabAdd({
  groups,
  query,
  onQueryChange,
  searchLabel = "찾기",
  placeholder,
  onPick,
  note,
  label = "탭 추가",
  partId,
}: WorkTabAddProps) {
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef<HTMLSpanElement>(null)
  const menuId = React.useId()

  // Esc · 바깥 누름 = 닫기
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      e.preventDefault()
      setOpen(false)
    }
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && e.target instanceof Node && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onDown)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onDown)
    }
  }, [open])

  return (
    <span ref={rootRef} {...partAttrs("WorkTabAdd", { state: open ? "open" : undefined, id: partId })} className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        title={label}
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "m-0 grid size-[26px] cursor-pointer place-items-center rounded-full border-0 p-0 transition-colors duration-150 motion-reduce:transition-none",
          open ? "bg-brand-3 text-paper" : "bg-panel/85 text-fg-2 hover:bg-panel hover:text-foreground",
          FOCUS
        )}
      >
        <Plus aria-hidden="true" strokeWidth={2.2} className="size-[15px]" />
      </button>
      {open ? (
        <div
          id={menuId}
          role="dialog"
          aria-label={label}
          data-state="open"
          className="absolute top-full right-0 z-40 mt-[6px] flex w-[300px] flex-col gap-[8px] rounded-[10px] border border-solid border-border bg-panel p-[10px] text-foreground [box-shadow:0_12px_32px_var(--t-panel-drop)]"
        >
          {query !== undefined ? (
            <Field
              icon="search"
              aria-label={searchLabel}
              placeholder={placeholder}
              value={query}
              autoFocus
              onChange={(e) => onQueryChange?.(e.target.value)}
            />
          ) : null}
          {groups.map((g) => (
            <section key={g.key} aria-label={g.title} className="flex flex-col gap-[2px]">
              <h4 className="m-0 px-[4px] pb-[2px] text-[10.5px] font-bold text-muted-foreground">{g.title}</h4>
              {g.items.length === 0 ? (
                <p className="m-0 px-[4px] py-[4px] text-[11.5px] text-muted-foreground">{g.empty ?? "없음"}</p>
              ) : (
                g.items.map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    disabled={it.disabled}
                    title={it.disabled ? it.reason : undefined}
                    onClick={() => {
                      onPick(g.key, it.id)
                      setOpen(false)
                    }}
                    className={cn(
                      "m-0 flex min-h-[30px] w-full cursor-pointer items-center gap-[8px] rounded-[7px] border-0 bg-transparent px-[6px] py-[3px] text-left text-inherit hover:bg-strip disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent",
                      FOCUS
                    )}
                  >
                    <span className="grid min-w-0 flex-1">
                      <span className="truncate text-[12px] font-bold">{it.label}</span>
                      {it.sub ? <span className="truncate text-[10.5px] text-muted-foreground">{it.sub}</span> : null}
                    </span>
                    {it.end ? <span className="shrink-0 text-[10.5px] text-muted-foreground">{it.end}</span> : null}
                  </button>
                ))
              )}
            </section>
          ))}
          {note ? <p className="m-0 border-0 border-t border-solid border-border px-[4px] pt-[6px] text-[11px] text-muted-foreground">{note}</p> : null}
        </div>
      ) : null}
    </span>
  )
}
