import { cn } from "@/shared/lib/utils"
import { AiProgress, LiveDot } from "@/shared/ui/ai"

import { useThumbSrc } from "../lib/use-thumb-src"
import type { AiTopItem, SearchTarget } from "../model/types"
import { SoleHeat } from "./SoleHeat"

/** 74px 칸 — 썸네일(없으면 원본) */
function RailImage({ src, ftwrId }: { src: string; ftwrId: string }) {
  const shown = useThumbSrc(src)
  return (
    <img
      decoding="async"
      src={shown.src}
      onError={shown.onError}
      alt={`신발 ${ftwrId} 밑창`}
      className="block size-full object-contain"
    />
  )
}

// 시안 r3 「AI가 먼저 보라는 10건」: 이미지 유사도 + 필수 문양 + 부위별 근거로 다시 매긴 상위 10건을 한 줄로.
// 본 것 ✓ · 확인대상 ★ · 근거 한 줄. 끝까지 보는 길(아래 그리드)은 그대로다.
export function AiTopRail({ items, targets }: { items: readonly AiTopItem[]; targets: readonly SearchTarget[] }) {
  const seenCount = items.filter((t) => t.seen).length
  const starred = (t: AiTopItem) => targets.some((s) => s.ftwrId === t.ftwrId)
  return (
    <section
      data-plus
      data-ai-top
      aria-label="AI가 먼저 보라는 10건"
      className="grid gap-[8px] rounded-[12px] border border-solid border-ai-line bg-[linear-gradient(160deg,var(--t-ai-bg),var(--t-panel-2))] px-[12px] py-[10px]"
    >
      <div className="flex flex-wrap items-center gap-[8px] text-[12px]">
        <LiveDot state="busy" label="AI 순위" hideLabel />
        <b className="text-ai">AI가 먼저 보라는 10건</b>
        <span className="text-[11px] text-muted-foreground">이미지 유사도 + 필수 문양 + 부위별 근거로 다시 매긴 순위</span>
        <span className="ml-auto flex items-center gap-[10px] text-[11px] text-muted-foreground">
          <span>
            본 것 <b className="font-code text-fg-2">{seenCount}</b> / {items.length}
          </span>
          <AiProgress
            state="done"
            value={items.length ? seenCount / items.length : 0}
            label="AI 10건 중 본 것"
            className="w-[90px]"
          />
        </span>
      </div>
      <ol className="grid grid-cols-10 gap-[6px]">
        {items.map((t) => {
          const star = starred(t)
          return (
            <li
              key={t.ftwrId}
              data-ai-top-item={t.rank}
              className={cn(
                "relative grid min-w-0 gap-[3px] rounded-[8px] border border-solid bg-panel p-[4px]",
                star ? "border-warn-line" : t.rank === 1 ? "border-ai-line" : "border-border",
                t.seen && !star && "opacity-[.72]",
              )}
            >
              <span className="relative block h-[74px] overflow-hidden rounded-[5px] bg-paper">
                <RailImage src={t.image} ftwrId={t.ftwrId} />
                {t.heat ? <SoleHeat /> : null}
                <b
                  className={cn(
                    "absolute top-[3px] left-[3px] rounded-[3px] px-[4px] font-code text-[9.5px]",
                    t.rank === 1 ? "bg-ai text-ai-bg" : "bg-panel/85 text-foreground",
                  )}
                >
                  {t.rank}
                </b>
                {star ? (
                  <span className="absolute top-[1px] right-[3px] text-[12px] text-warn" aria-label="확인대상">
                    ★
                  </span>
                ) : t.seen ? (
                  <span className="absolute top-[2px] right-[3px] text-[10px] text-ok-fg" aria-label="본 것">
                    ✓
                  </span>
                ) : null}
              </span>
              <span className="flex justify-between gap-[2px] text-[10px]">
                <b className="truncate font-code">{t.ftwrId}</b>
                <span className="font-code text-muted-foreground">{t.similarity.toFixed(1)}</span>
              </span>
              <span className="h-[25px] overflow-hidden text-[9.5px] leading-[1.3] text-dim">{t.why}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
