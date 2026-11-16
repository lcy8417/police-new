import { cn } from "@/shared/lib/utils"
import { PatternIcon } from "@/shared/ui/viewer"

import type { PatternIconItem, ZoneBasis, ZonePatterns } from "../model/types"
import { sharedNames } from "../model/zoom-link"

// 사건 창 정밀 대조 「상 · 중 · 하 문양 비교 띠」(11/17 사용자 「딱 상중하 나뉘어서 서로 선택한 문양 비교할 수 있어야해」).
// 부위마다 한 칸: 머리(부위 · 일치 표시 · 겹친 수 · AI 부위 점수) + 현장에서 고른 문양(문양 코드 탭 값) 한 줄 + 신발 문양 한 줄.
// 두 쪽에 다 있는 문양(이름 기준)은 brand 테, 한쪽에만 있는 문양은 흐리게. 그림 칸 높이를 아끼려고 가로로 놓는다(먹색 작업판 안).

const ZONES: { key: keyof ZonePatterns; label: string; basis?: string }[] = [
  { key: "top", label: "상", basis: "상" },
  { key: "mid", label: "중", basis: "중" },
  { key: "bottom", label: "하", basis: "하" },
  { key: "outline", label: "윤곽" },
]

const SIDE = "flex h-[30px] items-center text-[10px] font-semibold text-muted-foreground"

function Icons({ label, items, shared }: { label: string; items: readonly PatternIconItem[]; shared: Set<string> }) {
  return (
    // 같은 부위 문양이 많으면 가로로 넘겨 본다(잘라 숨기지 않음 — layout.md 스크롤 잘림 방지, 2회차 검수)
    <span role="list" aria-label={label} className="flex h-[30px] min-w-0 items-center gap-[3px] overflow-x-auto overflow-y-hidden [scrollbar-width:thin]">
      {items.length === 0 ? <span className="text-[11px] text-dim">—</span> : null}
      {items.map((p) => {
        const hit = shared.has(p.name)
        return (
          <span role="listitem" key={p.name} className="inline-flex">
            <PatternIcon
              name={p.name}
              src={p.src}
              size="sm"
              selected={hit}
              title={hit ? `${p.name} — 양쪽 일치` : `${p.name} — 한쪽만`}
              className={cn("size-[26px]", !hit && "opacity-45")}
            />
          </span>
        )
      })}
    </span>
  )
}

export function ZoneCompareStrip({
  crime,
  shoe,
  basis,
}: {
  /** 현장(유류) 이미지 문양 */
  crime: ZonePatterns
  /** 발견(신발) 이미지 문양 */
  shoe: ZonePatterns
  /** AI 부위 점수(없으면 겹친 수만) */
  basis?: readonly ZoneBasis[]
}) {
  return (
    <section aria-label="상 · 중 · 하 문양 비교" data-zone-compare className="grid grid-cols-[32px_repeat(4,minmax(0,1fr))] gap-x-[10px] px-[10px] py-[6px]">
      <span aria-hidden="true" className="grid content-end gap-[2px]">
        <span className={SIDE}>현장</span>
        <span className={SIDE}>신발</span>
      </span>
      {ZONES.map((z) => {
        const a = crime[z.key]
        const b = shoe[z.key]
        const shared = sharedNames(a, b)
        const score = z.basis ? basis?.find((r) => r.zone === z.basis) : undefined
        // 일치 표식은 실제 문양 겹침으로만(AI 부위 점수는 옆 숫자로 따로 — 0/2 인데 ✓ 가 뜨던 것, 2회차 검수). 현장 문양이 없으면 비교 안 함
        const ok = shared.size > 0 && shared.size === a.length
        const none = a.length === 0
        return (
          <div key={z.key} data-zone-cell={z.key} className="grid min-w-0 gap-[2px] border-0 border-l border-solid border-border pl-[10px]">
            <span className="flex h-[18px] items-center gap-[6px] font-code text-[11px] tabular-nums">
              <b className="font-ui text-[12.5px] text-foreground">{z.label}</b>
              {none ? (
                <span aria-label="현장 문양 없음" className="text-dim">
                  —
                </span>
              ) : (
                <span aria-label={ok ? "일치" : "불일치"} className={cn("font-bold", ok ? "text-ai" : "text-warn")}>
                  {ok ? "✓" : "✕"}
                </span>
              )}
              <span className="text-muted-foreground" title="겹친 문양 / 현장 문양">{`${shared.size}/${a.length}`}</span>
              {score ? <b className={cn("ml-auto font-semibold", score.ok ? "text-ai" : "text-warn")}>{score.score.toFixed(2)}</b> : null}
            </span>
            <Icons label={`${z.label} 현장 문양`} items={a} shared={shared} />
            <Icons label={`${z.label} 신발 문양`} items={b} shared={shared} />
          </div>
        )
      })}
    </section>
  )
}
