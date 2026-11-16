import type * as React from "react"
import { Pin } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { WorkbenchButton } from "@/shared/ui/kit"
import { LensView, type LensSpot, type LensZoom } from "@/shared/ui/viewer"

import type { PatternLibraryItem } from "../model/view"

export interface PatternPeekLens {
  /** 확대경이 마지막으로 본 자리(아직 없으면 null) */
  spot: LensSpot | null
  zoom: LensZoom
  /** 확대경과 같은 그림(누를 수 없는 복사본) */
  source: React.ReactNode
  tune: { outer: string; inner: string }
  /** 고정 — 켜면 마우스를 현장 이미지에 다시 대도 자리가 그대로 */
  pinned: boolean
  onPinnedChange: (next: boolean) => void
}

export interface PatternPeekProps {
  /** 확대경이 켜져 있을 때만 — 왼쪽 「확대 그림」 칸 */
  lens?: PatternPeekLens | null
  /** 문양 목록에서 마우스를 올린 문양 */
  pattern: PatternLibraryItem | null
  /** 확대경을 대는 그림 이름(기본 「현장」 — 신발 편집은 「밑창」, 3회차 검수) */
  subject?: string
  className?: string
}

const CELL = "relative grid aspect-square min-w-0 place-items-center overflow-hidden rounded-[8px] border border-solid"

/**
 * 확대 보기 칸 — 문양 목록 바로 위에 고정(11/17 사용자 「확대경이랑 옆에 문양을 두고 딱 비교할 수 있게. 그래야 클릭하지」).
 * 확대경을 켜면: 왼쪽 = 확대경이 본 자리(같은 배율, 마우스를 떼도 마지막 자리 유지 · 「고정」이면 그 자리에 멈춤) | 오른쪽 = 마우스를 올린 문양 크게.
 * 확대경이 꺼져 있으면 문양 미리보기 한 줄만. 표시만 하고 상태는 부르는 쪽이 든다.
 */
export function PatternPeek({ lens, pattern, subject = "현장", className }: PatternPeekProps) {
  const preview = pattern ? (
    <img src={pattern.src} alt={`${pattern.name} 크게`} className="size-full object-contain p-[6px]" />
  ) : (
    <span className="px-[6px] text-center text-[10.5px] leading-[1.4] text-muted-foreground">{lens ? "문양에 마우스를 올리면 크게" : "미리보기"}</span>
  )
  const caption = pattern ? (
    <span className="min-w-0 truncate text-[11px] text-fg-2" title={pattern.note ? `${pattern.name} — ${pattern.note}` : pattern.name}>
      <b className="font-code font-semibold text-foreground">{pattern.name}</b>
      {pattern.score !== undefined ? <span className="ml-[4px] font-code text-ai">AI {pattern.score.toFixed(2)}</span> : null}
      {pattern.note ? <span className="ml-[4px] text-muted-foreground">{pattern.note}</span> : null}
    </span>
  ) : null

  if (!lens) {
    return (
      <section aria-label="문양 미리보기" className={cn("grid shrink-0 grid-cols-[64px_minmax(0,1fr)] items-center gap-[8px]", className)}>
        <span className={cn(CELL, "border-line-3 bg-picon")}>{preview}</span>
        <span className="grid min-w-0 gap-[2px]">
          {caption ?? (
            <span className="text-[11px] leading-[1.45] text-muted-foreground">
              문양에 마우스를 올리면 크게 봅니다. {`확대경을 켜면 ${subject} 확대 그림과 나란히 놓입니다.`}
            </span>
          )}
        </span>
      </section>
    )
  }

  return (
    <section aria-label="확대 보기" data-slot="pattern-peek" className={cn("flex shrink-0 flex-col gap-[5px]", className)}>
      <div className="flex items-center gap-[6px]">
        <b className="text-[11.5px] font-bold text-foreground">확대 보기</b>
        <span className="min-w-0 flex-1 truncate text-[10.5px] text-muted-foreground">{`${subject} ↔ 문양 나란히`}</span>
        <WorkbenchButton
          size="sm"
          variant="ghost"
          icon={Pin}
          aria-pressed={lens.pinned}
          title={lens.pinned ? "고정 풀기 — 다시 확대경을 따라갑니다" : "고정 — 지금 자리에 멈춥니다"}
          onClick={() => lens.onPinnedChange(!lens.pinned)}
        >
          고정
        </WorkbenchButton>
      </div>
      <div className="grid grid-cols-2 gap-[6px]">
        <div data-theme="dark" className={cn(CELL, "border-border bg-canvas", lens.pinned && "border-brand")}>
          {lens.spot ? (
            <LensView spot={lens.spot} zoom={lens.zoom} source={lens.source} tune={lens.tune} slot="pattern-peek-lens" className="absolute inset-0" />
          ) : (
            <span className="px-[8px] text-center text-[10.5px] leading-[1.4] text-muted-foreground">{`${subject} 이미지에 확대경을 대세요`}</span>
          )}
        </div>
        <div className={cn(CELL, "border-line-3 bg-picon")}>{preview}</div>
      </div>
      {caption}
    </section>
  )
}
