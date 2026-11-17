import * as React from "react"
import { Eye, Star } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { ConfidenceBar } from "@/shared/ui/ai"

import { useThumbSrc } from "../lib/use-thumb-src"
import { parseSimilarity } from "../model/similarity"
import type { ImageSearchResultItem } from "../model/types"

/** 부위 점수가 이 값 이상이면 「일치」(✓) */
export const ZONE_MATCH = 60

/** 한 줄 개수 → 그림 높이(정적 클래스) */
const THUMB_H: Record<1 | 3 | 5, string> = { 1: "h-[360px]", 3: "h-[280px]", 5: "h-[196px]" }

export interface WindowCardProps {
  item: ImageSearchResultItem
  rank: number
  /** 한 줄 개수 — 1 이면 그림 옆에 부위 점수를 펼친다 */
  per: 1 | 3 | 5
  selected: boolean
  seen: boolean
  /** 지금 화면 · 다음 한 화면 안 카드 — 그림을 바로 받는다(나머지는 브라우저가 가까워지면 받음 · 빈칸은 회색 틀 그대로) */
  eager?: boolean
  starred: boolean
  canStar: boolean
  /** 누름 = 고름. `detail` = 연달아 누른 횟수(마우스 click 의 detail — 두 번째 누름이면 2) */
  onSelect: (detail: number) => void
  /** Enter = 정밀 대조(두 번 누름은 목록이 받는다 — 첫 누름의 카드를 연다) */
  onOpen: () => void
  onStar: () => void
  /** 빠른 비교 — 마우스 올림 시작(지연은 부르는 쪽) · 초점(바로) · 나감 */
  onPeekStart: (el: HTMLElement, now: boolean) => void
  onPeekEnd: () => void
}

/** 상 ✓ · 중 ✓ · 하 ✕ — 어느 부위 문양이 일치했나 */
function ZoneMarks({ item }: { item: ImageSearchResultItem }) {
  if (!item.zoneScores?.length) return null
  return (
    <span className="inline-flex items-center gap-[5px] font-code text-[10px]">
      {item.zoneScores.map((z) => {
        const ok = z.score >= ZONE_MATCH
        return (
          <span key={z.zone} data-zone-mark={z.zone} data-match={ok ? "y" : "n"} className={ok ? "text-fg-2" : "text-faint"}>
            {z.zone}
            <span aria-hidden="true" className={ok ? "text-brand" : undefined}>
              {ok ? "✓" : "✕"}
            </span>
            <span className="sr-only">{ok ? " 일치" : " 다름"}</span>
          </span>
        )
      })}
    </span>
  )
}

/**
 * 사건 창 검색 결과 카드(11/17 「순위가 쭉 · 점수 잘 보이게 · 어느 문양 일치하는지 살짝 상단」).
 * 위: 순위 · 부위 일치 표식 · 본 것 / 가운데: 밑창(★ 겹침) / 아래: 화류번호 · 점수(크게) · 점수 막대.
 * 누름 = 고름(자동이면 멈춤), 두 번 누름 · Enter = 정밀 대조, S = 확인대상. ★ 는 버튼 안 버튼이 안 되어 겹친 형제 버튼.
 * 두 번 누름은 목록(SearchWindow)이 받는다 — 첫 누름 뒤 「여기까지 봤음」 줄 · 본 것 거르기로 카드가 밀려 두 번째 누름이 다른 카드에 떨어져도 첫 카드를 연다.
 */
export function WindowCard({
  item,
  rank,
  per,
  selected,
  seen,
  eager = false,
  starred,
  canStar,
  onSelect,
  onOpen,
  onStar,
  onPeekStart,
  onPeekEnd,
}: WindowCardProps) {
  const value = parseSimilarity(item.similarity)
  const row = per === 1
  // 196px 칸(5개 보기)만 224px 썸네일 — 1 · 3개 보기(280 · 360px)는 원본. 썸네일이 없으면 원본으로 저절로
  const shown = useThumbSrc(item.image, per === 5)
  const score = (
    <b className="font-code text-[16px] font-bold leading-none tabular-nums text-foreground">
      {value === null ? "—" : value.toFixed(1)}
      <span className="ml-[1px] text-[11px] font-semibold text-muted-foreground">%</span>
    </b>
  )
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      onOpen()
    } else if ((e.key === "s" || e.key === "S" || e.code === "KeyS") && canStar && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault()
      onStar()
    }
  }
  return (
    <li className="relative min-w-0">
      <button
        type="button"
        data-result-card
        data-rank={rank}
        data-seen={seen ? "true" : undefined}
        data-selected={selected ? "true" : undefined}
        aria-pressed={selected}
        aria-label={`${rank}위 ${item.ftwrId} 유사도 ${value === null ? "—" : value.toFixed(1)}%${seen ? " · 본 것" : ""}${starred ? " · 확인대상" : ""}`}
        onClick={(e) => onSelect(e.detail)}
        onKeyDown={onKey}
        onMouseEnter={(e) => onPeekStart(e.currentTarget, false)}
        onMouseLeave={onPeekEnd}
        onFocus={(e) => onPeekStart(e.currentTarget, true)}
        onBlur={onPeekEnd}
        className={cn(
          "grid w-full min-w-0 cursor-pointer gap-[6px] rounded-[9px] border border-solid border-border bg-panel-2 p-[6px] text-left text-foreground transition-colors duration-150 hover:border-brand-line focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-brand motion-reduce:transition-none",
          row && "grid-cols-[220px_minmax(0,1fr)] gap-[14px]",
          selected && "border-brand [box-shadow:0_0_0_1px_var(--t-brand)]",
        )}
      >
        {!row ? (
          <span className="flex min-w-0 items-center gap-[6px]">
            <b className="font-code text-[12.5px] tabular-nums">{`#${rank}`}</b>
            <ZoneMarks item={item} />
            {seen ? <Eye aria-hidden="true" className="ml-auto size-[12px] shrink-0 text-faint" strokeWidth={2} /> : null}
          </span>
        ) : null}
        <span className={cn("relative block overflow-hidden rounded-[6px] bg-paper", THUMB_H[per])}>
          {/* loading 을 src 보다 먼저(일부 브라우저는 src 가 먼저 붙으면 바로 받음) */}
          <img
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            src={shown.src}
            onError={shown.onError}
            alt={`신발 ${item.ftwrId} 밑창`}
            className={cn("block size-full object-contain", seen && "opacity-60")}
          />
        </span>
        {row ? (
          <span className="grid min-w-0 content-start gap-[10px] py-[4px]">
            <span className="flex items-center gap-[8px]">
              <b className="font-code text-[13px] tabular-nums">{`#${rank}`}</b>
              <span className="font-code text-[12.5px] text-fg-2">{item.ftwrId}</span>
              {seen ? <Eye aria-hidden="true" className="size-[13px] text-faint" strokeWidth={2} /> : null}
              <span className="ml-auto pr-[28px]">{score}</span>
            </span>
            <ConfidenceBar value={value ?? NaN} scale="percent" label={`${rank}위 유사도`} className="[&>span]:hidden" />
            {item.zoneScores?.map((z) => (
              <span key={z.zone} className="grid grid-cols-[18px_minmax(0,1fr)] items-center gap-x-[8px] gap-y-[2px] text-[11px]">
                <b className={z.score >= ZONE_MATCH ? "text-foreground" : "text-faint"}>{z.zone}</b>
                <ConfidenceBar value={z.score} scale="percent" threshold={ZONE_MATCH} label={`${z.zone} 부위 점수`} />
                <span />
                <span className="truncate text-[11px] text-muted-foreground">{z.why}</span>
              </span>
            ))}
          </span>
        ) : (
          <span className="grid gap-[4px]">
            <span className="flex min-w-0 items-end gap-[6px]">
              <span className="min-w-0 truncate font-code text-[11px] text-fg-2">{item.ftwrId}</span>
              <span className="ml-auto">{score}</span>
            </span>
            <ConfidenceBar value={value ?? NaN} scale="percent" label={`${rank}위 유사도`} className="[&>span]:hidden" />
          </span>
        )}
      </button>
      <button
        type="button"
        data-star={starred ? "on" : "off"}
        aria-pressed={starred}
        aria-label={`${rank}위 ${item.ftwrId} 확인대상 ${starred ? "빼기" : "넣기"}`}
        title="확인대상 (S)"
        disabled={!canStar}
        onClick={onStar}
        className={cn(
          "absolute grid size-[24px] cursor-pointer place-items-center rounded-[6px] border-none bg-canvas/70 p-0 disabled:cursor-default disabled:opacity-30",
          row ? "top-[12px] right-[12px]" : "top-[36px] right-[10px]",
          starred ? "text-warn" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Star aria-hidden="true" className={cn("size-[14px]", starred && "fill-current")} strokeWidth={2} />
      </button>
    </li>
  )
}
