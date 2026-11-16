import type { ReactNode } from "react"
import { X } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../../part-attrs"

// r4 로망 이식(`shared/ui/panel/window/WorkTabStrip`): 창 머리 바로 위에 붙는 작업 탭 줄.
// 탭 = 높이 32 · 위 모서리 10 · 12 굵게(글자만 자름) · 오른쪽 × 18. 고른 탭 = 채움 + 흰 글자, 나머지 = 흰 85% · 올리면 흰.
// Tab 으로 옮기고 Enter · Space 로 고른다(← → 없음 — 로망 스킬 6-2). 더 열 수 없으면(full) 오른쪽 회색 한 줄로 까닭.
// 색만 대응: 진분홍 `bg-accent-ink text-cta-fg` → `bg-brand-3 text-paper`, 먹 2 → fg-2, 흰 22% → paper/22, 회색 → muted-foreground.
// 무엇을 열고 닫을지는 부르는 쪽이 정한다.

/** 탭 하나 */
export interface WorkTabItem {
  id: string
  /** 「00001-25-0649 · 주거침입」 */
  label: string
}

export interface WorkTabStripProps {
  tabs: readonly WorkTabItem[]
  activeId: string | null
  onSelect: (id: string) => void
  onClose: (id: string) => void
  /** 더 못 여는 까닭(최대 개수 참) — 주면 오른쪽 회색 한 줄 */
  full?: string
  /** 오른쪽 덧단추 자리 */
  after?: ReactNode
  /** 탭 묶음 접근성 이름(기본 「열린 사건」) */
  label?: string
  /** 위치 식별자(`data-part-id`) */
  partId?: string
}

// 흰 판 위 키보드 초점(로망 SHELL_FOCUS_RING → 경찰 brand 테)
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-brand"

export function WorkTabStrip({ tabs, activeId, onSelect, onClose, full, after, label = "열린 사건", partId }: WorkTabStripProps) {
  return (
    <div {...partAttrs("WorkTabStrip", { id: partId })} data-slot="work-tab-strip" className="flex min-w-0 items-end gap-1 pl-3">
      <div role="tablist" aria-label={label} className="flex min-w-0 items-end gap-1">
        {tabs.map((tab) => {
          const on = tab.id === activeId
          return (
            <div
              key={tab.id}
              data-slot="work-tab"
              data-on={on ? "true" : "false"}
              className={cn(
                "flex h-8 min-w-0 max-w-[240px] items-center gap-1 rounded-t-[10px] pr-1.5 pl-3 transition-colors duration-150 motion-reduce:transition-none",
                on ? "bg-brand-3 text-paper" : "bg-panel/85 text-fg-2 hover:bg-panel"
              )}
            >
              <button
                type="button"
                role="tab"
                aria-selected={on}
                title={tab.label}
                onClick={() => onSelect(tab.id)}
                className={cn(
                  "m-0 min-w-0 cursor-pointer truncate rounded-[5px] border-0 bg-transparent p-0 text-left text-[12px] font-bold text-inherit",
                  FOCUS
                )}
              >
                {tab.label}
              </button>
              <button
                type="button"
                aria-label={`${tab.label} 탭 닫기`}
                title="탭 닫기"
                onClick={() => onClose(tab.id)}
                className={cn(
                  "m-0 grid size-[18px] flex-none cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 text-inherit",
                  on ? "hover:bg-paper/22" : "text-muted-foreground hover:bg-strip hover:text-foreground",
                  FOCUS
                )}
              >
                <X aria-hidden="true" strokeWidth={1.8} className="size-3" />
              </button>
            </div>
          )
        })}
      </div>
      {full || after ? (
        <span className="ml-auto flex flex-none items-center gap-2 pr-1 pb-1.5">
          {full ? (
            <small role="status" className="rounded-[6px] bg-panel/85 px-2 py-0.5 text-[11px] text-muted-foreground">
              {full}
            </small>
          ) : null}
          {after}
        </span>
      ) : null}
    </div>
  )
}
