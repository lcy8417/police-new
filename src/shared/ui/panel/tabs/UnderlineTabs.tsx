import type { ReactNode } from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../../part-attrs"

// r4 로망 이식(`shared/ui/panel/tabs/UnderlineTabs.tsx` — UnderlineTabs `window` 변형 · TabMark): 창 안 밑줄 탭 줄과 탭 이름 뒤 작은 표시.
// 로망 window 변형 = 12 굵게 · 좌우 10 · 위 7 아래 8 · 고른 탭 = 강조 글자 + 아래 2px 강조선. 색만 대응: 진한 분홍 글자 → brand-3, 분홍 밑줄 → brand,
// 안 고른 탭 흐린 회색 → muted-foreground, 줄 밑 선 → border.
// 사용자 요청(11/16 「탭이 더 잘 보이게」)으로 글자만 13 으로 키웠다 — 나머지 모양은 원본 그대로.
// 덧붙인 것: `endKey`(이 탭부터 줄 오른쪽 끝으로 띄우고 앞에 세로 선 — 사건 전체 「결과 확인」) · `idPrefix`(탭 id — tabpanel 이 가리킴).

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-brand"

export interface UnderlineTabsProps<K extends string> {
  /** 탭 줄 접근성 이름 */
  label: string
  /** [열쇠, 보이는 이름(뒤 표시 포함 가능)] */
  tabs: readonly (readonly [K, ReactNode])[]
  /** 고른 탭 — 없으면 아무것도 고르지 않음 */
  value: K | undefined
  onChange: (key: K) => void
  /** 탭 앞에 끼우는 고를 수 없는 자리(「_1」) */
  lead?: ReactNode
  /** 이 탭부터 줄 오른쪽 끝으로 띄운다(앞에 세로 선) */
  endKey?: K
  /** 주면 탭마다 id = `${idPrefix}-${열쇠}` */
  idPrefix?: string
  /** 위치 식별자(`data-part-id`) */
  partId?: string
}

/** [UI] 밑줄 탭 줄(window 변형) — 고른 탭 = brand 밑줄 2px + brand-3 글자 */
export function UnderlineTabs<K extends string>({ label, tabs, value, onChange, lead, endKey, idPrefix, partId }: UnderlineTabsProps<K>) {
  return (
    <div
      {...partAttrs("UnderlineTabs", { variant: "window", id: partId })}
      role="tablist"
      aria-label={label}
      data-slot="panel-underline-tabs"
      className="flex shrink-0 items-center gap-0.5 overflow-x-auto border-b border-solid border-border bg-panel px-3.5 [scrollbar-width:none]"
    >
      {lead}
      {tabs.map(([key, name]) => {
        const on = key === value
        return (
          <button
            key={key}
            type="button"
            role="tab"
            id={idPrefix ? `${idPrefix}-${key}` : undefined}
            aria-selected={on}
            data-slot="panel-tab"
            onClick={() => onChange(key)}
            className={cn(
              "-mb-px inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap border-0 border-b-2 border-solid bg-transparent px-2.5 pt-[7px] pb-2 text-[13px] font-bold transition-colors duration-150 motion-reduce:transition-none",
              FOCUS,
              on ? "border-brand text-brand-3" : "border-transparent text-muted-foreground hover:text-foreground",
              key === endKey && "relative ml-auto pl-3.5 before:absolute before:top-2 before:bottom-2 before:left-0 before:w-px before:bg-border before:content-['']"
            )}
          >
            {name}
          </button>
        )
      })}
    </div>
  )
}

/**
 * [UI] 탭 이름 뒤 표시 종류 — done 끝 ✓(흐림) · problem 확인할 문제 !(위험 채움) · blanks 채워야 할 빈 칸 수(노란 안쪽 테 · 0 이면 없음)
 * · notApplicable 해당 없음 – · count 남은 수(흐린 숫자 · 0 이면 없음)
 */
export type TabMarkKind = "done" | "problem" | "blanks" | "notApplicable" | "count"

/** [UI] 탭 이름 뒤 작은 표시 하나(로망 TabMark — 색만 경찰 토큰: 진분홍 → danger, 노랑 → warn) */
export function TabMark({ kind, count }: { kind: TabMarkKind; count?: number | null }) {
  if (kind === "problem") {
    return (
      <i
        data-slot="panel-tab-mark"
        data-mark="problem"
        aria-label="확인할 문제"
        className="ml-1 inline-grid size-3.5 place-items-center rounded-full bg-danger text-[10px] font-bold not-italic leading-none text-paper"
      >
        !
      </i>
    )
  }
  if (kind === "done") {
    return (
      // 끝 ✓ 는 보이는 표시만(탭 이름을 「사건 정보 끝」으로 바꾸지 않는다) — 뜻은 title
      <i data-slot="panel-tab-mark" data-mark="done" aria-hidden="true" title="끝" className="ml-1 text-[11px] font-bold not-italic text-faint">
        ✓
      </i>
    )
  }
  if (kind === "notApplicable") {
    return (
      <i
        data-slot="panel-tab-mark"
        data-mark="notApplicable"
        aria-label="해당 없음"
        className="ml-1 inline-grid h-3.5 min-w-3.5 place-items-center rounded-full px-0.5 text-[10px] font-bold not-italic leading-none text-faint outline-1 -outline-offset-1 outline-dashed outline-line-3"
      >
        –
      </i>
    )
  }
  if (!count) return null
  if (kind === "blanks") {
    // 탭 이름(읽기 프로그램)에는 수를 섞지 않는다 — 수는 보이는 표시, 뜻은 title
    return (
      <em
        data-slot="panel-tab-mark"
        data-mark="blanks"
        aria-hidden="true"
        title={`확인 필요 칸 ${count}`}
        className="ml-1 inline-grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold not-italic text-warn shadow-[inset_0_0_0_1px_var(--t-warn-line)]"
      >
        {count}
      </em>
    )
  }
  return (
    <em data-slot="panel-tab-mark" data-mark="count" aria-hidden="true" className="ml-1 text-[11px] font-normal not-italic text-faint">
      {count}
    </em>
  )
}
