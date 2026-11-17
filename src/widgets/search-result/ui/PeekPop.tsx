import { cn } from "@/shared/lib/utils"
import { ConfidenceBar } from "@/shared/ui/ai"

import { useThumbSrc } from "../lib/use-thumb-src"
import { formatSimilarity, parseSimilarity } from "../model/similarity"
import type { ImageSearchResultItem, ZonePatternSet } from "../model/types"
import { ZONE_MATCH } from "./WindowCard"

/** 팝 폭(px) — 놓을 자리 계산에 쓴다 */
export const PEEK_W = 452
/** 팝 높이 어림(px) — 아래로 넘치지 않게 */
export const PEEK_H = 300

/** 그림 위 꼬리표 */
const TAG = "pointer-events-none absolute top-[4px] left-[4px] rounded-[4px] bg-canvas/85 px-[5px] py-[1px] font-code text-[10px] text-fg-2"

function PatternRow({ items }: { items: ZonePatternSet["patterns"] | undefined }) {
  if (!items || items.length === 0) return <span className="text-[10px] text-faint">—</span>
  return (
    <span className="flex flex-wrap gap-[3px]">
      {items.map((p) => (
        <span
          key={p.name}
          title={p.essential ? `${p.name} · 필수` : p.name}
          className={cn(
            "inline-grid size-[24px] place-items-center overflow-hidden rounded-[4px] border border-solid bg-picon",
            p.essential ? "border-2 border-brand" : "border-line-3",
          )}
        >
          <img src={p.src} alt={p.name} className="block size-full object-contain" />
        </span>
      ))}
    </span>
  )
}

/**
 * 마우스 올림(0.4초) · 키보드 초점 빠른 비교(11/17 사용자 「마우스 올렸을때 빠른 비교로 현재 선택한 문양이랑 … 비교해줘도 좋겠다」).
 * 현장 | 후보 그림, 상 · 중 · 하 일치 점수 막대 + 한 줄 근거, 문양 코드 탭에서 고른 문양 ↔ 후보 문양.
 * 누를 것이 없는 장식(`pointer-events-none`) — 옆 카드로 마우스가 옮겨 가도 가리지 않는다. Enter · S 는 카드가 받는다.
 * 자리(left · top)는 카드 위치에서 계산한 런타임 좌표라 인라인 style(CLAUDE.md 예외).
 */
export function PeekPop({
  item,
  rank,
  sceneImage,
  queryPatterns,
  left,
  top,
}: {
  item: ImageSearchResultItem
  rank: number
  sceneImage: string
  queryPatterns?: readonly ZonePatternSet[]
  left: number
  top: number
}) {
  const value = parseSimilarity(item.similarity)
  const shoe = useThumbSrc(item.image)
  const zones = item.zoneScores ?? []
  const cand = item.zonePatterns ?? []
  const rows = (queryPatterns ?? []).map((q) => q.zone)
  for (const c of cand) if (!rows.includes(c.zone)) rows.push(c.zone)
  return (
    <div
      data-quick-peek
      // 누를 것 없는 마우스 올림 설명이라 대화상자가 아니다(1회차 검수)
      role="tooltip"
      aria-label={`빠른 비교 ${rank}위 ${item.ftwrId}`}
      className="pointer-events-none absolute z-[20] grid gap-[8px] rounded-[10px] border border-solid border-line-3 bg-panel p-[10px] text-foreground [box-shadow:0_18px_44px_0_var(--t-panel-drop)]"
      style={{ left, top, width: PEEK_W }}
    >
      <div className="flex items-baseline gap-[8px]">
        {/* 글자 단계(tokens.md R6): 순위 꼬리표 13 · 보조 11 · 숫자 16 — 2회차 검수 */}
        <b className="font-code text-[13px] tabular-nums">{`${rank}위`}</b>
        <span className="font-code text-[11px] text-fg-2">{item.ftwrId}</span>
        <b className="ml-auto font-code text-[16px] leading-none tabular-nums">
          {value === null ? "—" : value.toFixed(1)}
          <span className="ml-[1px] text-[11px] font-semibold text-muted-foreground">%</span>
        </b>
      </div>
      <div className="grid grid-cols-[84px_84px_minmax(0,1fr)] gap-[8px]">
        <span className="relative h-[150px] overflow-hidden rounded-[6px] border border-solid border-border bg-canvas">
          <img src={sceneImage} alt="현장 족적" className="block size-full object-contain" />
          <span className={TAG}>현장</span>
        </span>
        <span className="relative h-[150px] overflow-hidden rounded-[6px] border border-solid border-border bg-paper">
          {/* 84px 칸 — 카드와 같은 썸네일(이미 받은 그림이라 바로 뜸), 없으면 원본 */}
          <img
            decoding="async"
            src={shoe.src}
            onError={shoe.onError}
            alt={`신발 ${item.ftwrId} 밑창`}
            className="block size-full object-contain"
          />
          <span className={TAG}>후보</span>
        </span>
        <div className="grid content-start gap-[7px]">
          {zones.map((z) => (
            <div key={z.zone} data-peek-zone={z.zone} className="grid gap-[2px]">
              <span className="flex items-center gap-[6px] text-[11px]">
                <b className="w-[14px]">{z.zone}</b>
                <ConfidenceBar value={z.score} scale="percent" threshold={ZONE_MATCH} label={`${z.zone} 부위 점수`} className="flex-1" />
              </span>
              <span className="truncate pl-[20px] text-[11px] text-muted-foreground">{z.why}</span>
            </div>
          ))}
          {zones.length === 0 ? <span className="text-[11px] text-muted-foreground">{`유사도 ${formatSimilarity(value)}`}</span> : null}
        </div>
      </div>
      {rows.length > 0 ? (
        <div className="grid grid-cols-[22px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-[8px] gap-y-[4px] border-0 border-t border-solid border-border pt-[7px]">
          <span />
          <span className="text-[10px] font-semibold text-muted-foreground">고른 문양</span>
          <span className="text-[10px] font-semibold text-muted-foreground">후보 문양</span>
          {rows.map((zone) => (
            <div key={zone} data-peek-patterns={zone} className="contents">
              <b className="text-[11px]">{zone}</b>
              <PatternRow items={queryPatterns?.find((q) => q.zone === zone)?.patterns} />
              <PatternRow items={cand.find((c) => c.zone === zone)?.patterns} />
            </div>
          ))}
        </div>
      ) : null}
      <span className="text-[10px] text-muted-foreground">두 번 누름 · Enter 정밀 대조 · S 확인대상</span>
    </div>
  )
}
