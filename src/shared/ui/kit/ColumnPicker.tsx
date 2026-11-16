import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"

// 표에 보일 열을 고르는 작은 팝오버. 주어진 열 순서(SCAS 순서)를 그대로 보이고, onChange 로 나가는 목록도 그 순서다.
// 잠긴 열(locked)은 체크가 켜진 채 끌 수 없다. 「전체 보기」= 모든 열, 「기본으로」= defaultVisible(없으면 전체).
export interface ColumnPickerColumn {
  key: string
  label: string
  locked?: boolean
}

export interface ColumnPickerProps {
  columns: readonly ColumnPickerColumn[]
  /** 지금 보이는 열 key */
  visible: readonly string[]
  onChange: (keys: string[]) => void
  /** 「기본으로」가 되돌릴 열(잠긴 열은 항상 포함). 없으면 전체 */
  defaultVisible?: readonly string[]
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
  className?: string
}

export function ColumnPicker({ columns, visible, onChange, defaultVisible, partId, className }: ColumnPickerProps) {
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const panelId = React.useId()

  React.useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open])

  const emit = (keys: ReadonlySet<string>) => onChange(columns.filter((c) => c.locked || keys.has(c.key)).map((c) => c.key))
  const current = new Set(visible)
  const shown = columns.filter((c) => c.locked || current.has(c.key)).length

  const toggle = (key: string) => {
    const next = new Set(current)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    emit(next)
  }

  const small =
    "border border-solid border-line-3 bg-panel-2 text-fg-2 rounded-[6px] h-[22px] px-[8px] text-[11.5px] cursor-pointer"

  return (
    <div
      {...partAttrs("ColumnPicker", { state: open ? "open" : undefined, id: partId })}
      ref={rootRef}
      className={cn("relative inline-block", className)}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation()
          setOpen(false)
        }
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className={cn(small, "h-[26px] inline-flex items-center gap-[6px] text-[12px]", open && "border-brand-line text-brand")}
      >
        열 선택
        <span className="font-code tabular-nums text-dim">
          {shown}/{columns.length}
        </span>
      </button>
      {open ? (
        <div
          id={panelId}
          role="group"
          aria-label="보일 열"
          className="absolute right-0 top-[30px] z-20 w-[200px] rounded-[8px] border border-solid border-border bg-panel p-[8px] [box-shadow:0_8px_24px_rgba(0,0,0,0.35)]"
        >
          <div className="mb-[6px] flex gap-[6px]">
            <button type="button" className={small} onClick={() => emit(new Set(columns.map((c) => c.key)))}>
              전체 보기
            </button>
            <button
              type="button"
              className={small}
              onClick={() => emit(new Set(defaultVisible ?? columns.map((c) => c.key)))}
            >
              기본으로
            </button>
          </div>
          <ul className="m-0 max-h-[260px] list-none overflow-auto p-0">
            {columns.map((c) => {
              const checked = c.locked || current.has(c.key)
              return (
                <li key={c.key}>
                  <label
                    className={cn(
                      "flex items-center gap-[8px] rounded-[4px] px-[4px] py-[3px] text-[12px] text-fg-2",
                      c.locked ? "cursor-not-allowed text-dim" : "cursor-pointer hover:bg-panel-2"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={c.locked}
                      onChange={() => toggle(c.key)}
                      className="size-[13px] accent-[var(--t-brand)]"
                    />
                    <span>{c.label}</span>
                    {c.locked ? <span className="ml-auto text-[10.5px] text-dim">고정</span> : null}
                  </label>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
