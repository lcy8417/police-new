import type { ReactNode } from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../../part-attrs"

// r4 로망 이식: 창 머리 아래 왼쪽 작은 목록. 생김새 기준은 로망 `qa/HistoryRail`(시안 office-qa-mockup
// `.wgrid` 232 | 본문 · `.rail` 연한 바탕 + 오른쪽 선 · `.rail-top` 위 칸 · `.rday` 묶음 머리 · `.ritem` 줄 모서리 9 · 여백 8 9 ·
// 고른 줄 연분홍 + aria-current · 올리면 회색)과 `doc/DocListRail`(묶음 이름 + 수).
// 줄 = 작은 썸네일 + 이름(12 굵게) + 아래 한 줄(10.5 회색) + 오른쪽 상태 알약(쓰는 쪽이 StatePill 등을 넣는다).
// 색만 대응: rail 바탕 → panel-2, 연분홍 고른 줄 → brand-bg, 회색 올림 → strip, 먹 글자 → foreground, 회색 → muted-foreground.

export interface WindowRailItem {
  id: string
  /** 줄 이름(「_1」) */
  name: string
  /** 이름 아래 작은 글자 */
  sub?: ReactNode
  /** 썸네일 그림 주소(없으면 그리지 않음) */
  thumbSrc?: string
  /** 오른쪽 상태 알약 */
  pill?: ReactNode
  /** 화면 읽기 이름(기본 = 이름) */
  ariaLabel?: string
}

export interface WindowRailGroup {
  /** 묶음 이름(없으면 머리 없이 줄만) */
  name?: string
  items: readonly WindowRailItem[]
}

export interface WindowRailProps {
  /** 목록 접근성 이름(「현장 이미지 목록」) */
  label: string
  groups: readonly WindowRailGroup[]
  selectedId: string | null
  onSelect: (id: string) => void
  /** 위 칸 슬롯(요약 한 줄 등) — 아래 선으로 나눈다 */
  top?: ReactNode
  /** 맨 아래 칸 슬롯(사진 추가 · 끌어 놓기 등) — 위 선으로 나누고 목록이 길어도 바닥에 붙는다 */
  footer?: ReactNode
  /** 폭 208(기본 232) */
  narrow?: boolean
  /** 위치 식별자(`data-part-id`) */
  partId?: string
}

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-brand"

export function WindowRail({ label, groups, selectedId, onSelect, top, footer, narrow = false, partId }: WindowRailProps) {
  return (
    <nav
      {...partAttrs("WindowRail", { variant: narrow ? "narrow" : undefined, id: partId })}
      aria-label={label}
      data-slot="window-rail"
      className={cn(
        "flex min-h-0 flex-col border-r border-solid border-border bg-panel-2",
        narrow ? "w-[208px]" : "w-[232px]"
      )}
    >
      {top ? (
        <div className="flex flex-col gap-2 border-b border-solid border-border px-3 pt-3 pb-2.5">{top}</div>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 pt-1.5 pb-3">
        {groups.map((group, gi) => (
          <div key={group.name ?? gi} className="flex flex-col gap-0.5">
            {group.name ? (
              <p className="m-0 flex items-baseline justify-between px-1.5 pt-2.5 pb-1 text-[11.5px] font-bold text-fg-2">
                {group.name}
                <small className="text-[10.5px] font-normal text-muted-foreground">{group.items.length}</small>
              </p>
            ) : null}
            <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
              {group.items.map((item) => {
                const on = item.id === selectedId
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      data-slot="window-rail-item"
                      aria-current={on ? "true" : undefined}
                      aria-label={item.ariaLabel}
                      onClick={() => onSelect(item.id)}
                      className={cn(
                        "m-0 flex w-full cursor-pointer items-center gap-2 rounded-[9px] border-0 px-[9px] py-1.5 text-left transition-colors duration-150 motion-reduce:transition-none",
                        on ? "bg-brand-bg" : "bg-transparent hover:bg-strip",
                        FOCUS
                      )}
                    >
                      {item.thumbSrc ? (
                        <span className="block h-[44px] w-[30px] flex-none overflow-hidden rounded-[5px] border border-solid border-border bg-canvas">
                          <img src={item.thumbSrc} alt="" className="block size-full object-contain" />
                        </span>
                      ) : null}
                      <span className="flex min-w-0 flex-1 flex-col gap-px">
                        <b className={cn("truncate font-code text-[12px] font-bold", on ? "text-foreground" : "text-fg-2")}>
                          {item.name}
                        </b>
                        {item.sub ? <small className="truncate text-[10.5px] text-muted-foreground">{item.sub}</small> : null}
                      </span>
                      {item.pill ? <span className="flex-none">{item.pill}</span> : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
      {footer ? (
        <div data-slot="window-rail-footer" className="flex shrink-0 flex-col gap-2 border-t border-solid border-border px-3 pt-2.5 pb-3">
          {footer}
        </div>
      ) : null}
    </nav>
  )
}
