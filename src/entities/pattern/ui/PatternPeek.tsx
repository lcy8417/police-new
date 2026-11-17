import type * as React from "react"
import { Pin } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { LensView, PatternIcon, type LensSpot, type LensZoom } from "@/shared/ui/viewer"

import type { PatternLibraryItem } from "../model/view"

export interface PatternPeekLens {
  /** 확대경이 마지막으로 본 자리 · 고정한 자리(아직 없으면 null) */
  spot: LensSpot | null
  zoom: LensZoom
  /** 확대경과 같은 그림(누를 수 없는 복사본) */
  source: React.ReactNode
  tune: { outer: string; inner: string }
  /** 고정 중 — 표시만(고정 · 풀기는 그림을 누름 · Esc, LensBox `onPinChange`) */
  pinned: boolean
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

/** 문양 칸 — 문양 목록 칸과 같은 결(흰 카드 · 모서리 9 · 안쪽 띄움), 크기는 부르는 자리가 고정 값으로 */
const TILE = "relative min-w-0 overflow-hidden rounded-[9px] border border-solid border-line-3 bg-picon"

/**
 * 확대 보기 칸 — 문양 목록 바로 위에 고정(11/17 사용자 「확대경이랑 옆에 문양을 두고 딱 비교할 수 있게. 그래야 클릭하지」).
 * 확대경을 켜면: 왼쪽 = 확대경이 본 자리(같은 배율, 마우스를 떼도 마지막 자리 유지 · 그림을 눌러 고정하면 그 자리) | 오른쪽 = 마우스를 올린 문양 크게.
 * 두 칸은 높이 120 고정 — 판 폭을 바꿔도 칸이 커지거나 줄 높이가 흔들리지 않는다(11/17 「규격화」). 고정은 표시만(「고정됨」 표 · brand 테) —
 * 누르는 자리는 현장 그림 쪽(11/17 사용자 「클릭하면 고정이 되어야지 저기 오른쪽에 고정이 있으면 어떻게 비교를 해」).
 * 확대경이 꺼져 있으면 문양 미리보기 한 줄(64 칸)만. 표시만 하고 상태는 부르는 쪽이 든다.
 */
export function PatternPeek({ lens, pattern, subject = "현장", className }: PatternPeekProps) {
  const preview = pattern ? (
    <span className="absolute inset-[8px] grid place-items-center">
      <PatternIcon name={pattern.name} src={pattern.src} title={pattern.name} className="size-full border-0 bg-transparent" />
    </span>
  ) : (
    <span className="absolute inset-0 grid place-items-center px-[6px] text-center text-[10.5px] leading-[1.4] text-muted-foreground">
      {lens ? "문양에 마우스를 올리면 크게" : "미리보기"}
    </span>
  )
  const caption = pattern ? (
    <span className="block min-h-[16px] min-w-0 truncate text-[11px] leading-[16px] text-fg-2" title={pattern.note ? `${pattern.name} — ${pattern.note}` : pattern.name}>
      <b className="font-code font-semibold text-foreground">{pattern.name}</b>
      {pattern.score !== undefined ? <span className="ml-[4px] font-code text-ai">AI {pattern.score.toFixed(2)}</span> : null}
      {pattern.note ? <span className="ml-[4px] text-muted-foreground">{pattern.note}</span> : null}
    </span>
  ) : null

  if (!lens) {
    return (
      <section aria-label="문양 미리보기" className={cn("grid shrink-0 grid-cols-[64px_minmax(0,1fr)] items-center gap-[8px]", className)}>
        <span className={cn(TILE, "size-[64px]")}>{preview}</span>
        <span className="grid min-w-0 gap-[2px]">
          {caption ?? (
            <span className="text-[11px] leading-[1.45] text-muted-foreground">
              문양에 마우스를 올리면 크게 봅니다. {`확대경을 켜고 ${subject} 이미지를 누르면 그 자리에 고정해 나란히 비교합니다.`}
            </span>
          )}
        </span>
      </section>
    )
  }

  return (
    <section aria-label="확대 보기" data-slot="pattern-peek" data-pinned={lens.pinned ? "" : undefined} className={cn("flex shrink-0 flex-col gap-[5px]", className)}>
      <div className="flex h-[20px] items-center gap-[6px]">
        <b className="text-[11.5px] font-bold whitespace-nowrap text-foreground">확대 보기</b>
        {lens.pinned ? (
          <span
            role="status"
            title={`${subject} 이미지를 다시 누르거나 Esc 로 풉니다`}
            className="inline-flex shrink-0 items-center gap-[3px] rounded-[4px] bg-brand px-[5px] text-[10.5px] leading-[18px] font-semibold whitespace-nowrap text-paper"
          >
            <Pin aria-hidden="true" className="size-[10px]" strokeWidth={2.6} />
            고정됨
          </span>
        ) : null}
        <span className="min-w-0 flex-1 truncate text-[10.5px] text-muted-foreground">
          {lens.pinned ? "다시 누르거나 Esc 로 풀기" : `${subject} 이미지를 누르면 고정`}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-[6px]">
        <div data-theme="dark" className={cn(TILE, "h-[120px] border-border bg-canvas", lens.pinned && "border-2 border-brand")}>
          {lens.spot ? (
            <LensView spot={lens.spot} zoom={lens.zoom} source={lens.source} tune={lens.tune} slot="pattern-peek-lens" className="absolute inset-0" />
          ) : (
            <span className="absolute inset-0 grid place-items-center px-[8px] text-center text-[10.5px] leading-[1.4] text-muted-foreground">{`${subject} 이미지에 확대경을 대세요`}</span>
          )}
        </div>
        <div className={cn(TILE, "h-[120px]")}>{preview}</div>
      </div>
      {caption ?? <span aria-hidden="true" className="block h-[16px]" />}
    </section>
  )
}
