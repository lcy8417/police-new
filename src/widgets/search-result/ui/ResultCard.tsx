import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { AiProgress, AiTag, ScanOverlay } from "@/shared/ui/ai"
import { Chip, StatusDot } from "@/shared/ui/kit"

import { formatSimilarity, GRADE_DOT, parseSimilarity, similarityGrade } from "../model/similarity"
import type { ImageSearchResultItem } from "../model/types"
import { CHIP_TEAL } from "./plus-style"
import { SoleHeat } from "./SoleHeat"

/** 카드에 얹는 +α 표시(showPlus 일 때만 넘어온다) */
export interface ResultCardPlus {
  /** 이미 본 카드 — 흐리게(보기 거르기 「이미 본 것 흐리게」가 켜졌을 때) */
  dim: boolean
  /** 키보드 초점 카드 — 파란 테 · 일치 부위 · 훑기 */
  focus: boolean
  /** 확인대상(★) */
  starred: boolean
  /** AI 순위 다시 매김으로 오른 계단(0 이면 없음) */
  rerankUp: number
  /** ★ 를 누를 수 있나(감정관 · 관리자) */
  canStar: boolean
  onStar: () => void
  /** 빠른 비교 창(초점 카드 옆) */
  peek?: React.ReactNode
}

// 결과 카드: 지금 기능(F23 #순위 · No. 신발ID · 유사도 % 색 등급 · TOP 3)은 그대로, 시안 r3 +α(유사도 막대 · ▲ 계단 · ☆ · 초점 · 일치 부위)를 얹는다.
// ☆ 는 카드 버튼 안에 넣을 수 없어(버튼 안 버튼 금지) 카드 오른쪽 아래에 겹친 형제 버튼이다.
export function ResultCard({
  item,
  ranking,
  compact,
  onOpen,
  plus,
}: {
  item: ImageSearchResultItem
  ranking: number
  /** 촘촘 8열 — 사진 높이 104(시안), 아니면 150 */
  compact: boolean
  onOpen: () => void
  plus?: ResultCardPlus
}) {
  const value = parseSimilarity(item.similarity)
  const grade = similarityGrade(value)
  const dot = GRADE_DOT[grade]
  const pct = formatSimilarity(value)
  // 시안 막대 폭 = (유사도 − 50) × 8 %
  const bar = value === null ? 0 : Math.min(1, Math.max(0, ((value - 50) * 8) / 100))
  return (
    <li className={cn("relative min-w-0", plus?.focus && "z-[5]")}>
      <button
        type="button"
        data-result-card
        data-rank={ranking}
        data-seen={plus?.dim ? "true" : undefined}
        data-focus={plus?.focus ? "true" : undefined}
        onClick={onOpen}
        className={cn(
          "grid w-full min-w-0 cursor-pointer gap-[4px] rounded-[9px] border border-solid border-border bg-panel-2 p-[4px] text-left hover:border-brand-line focus-visible:outline-2 focus-visible:outline-brand",
          plus?.dim && "opacity-50",
          plus?.focus && "border-brand [box-shadow:0_0_0_2px_var(--t-brand),0_0_14px_0_var(--t-corner-glow)]",
        )}
      >
        <span
          className={cn(
            "relative block overflow-hidden rounded-[6px] bg-foreground",
            compact ? "h-[104px]" : "h-[150px]",
          )}
        >
          <img src={item.image} alt={`신발 ${item.ftwrId} 밑창`} className="block size-full object-contain" />
          {plus?.focus ? <SoleHeat /> : null}
          <span className="absolute top-[4px] left-[4px] flex flex-col items-start gap-[2px]">
            {ranking <= 3 ? (
              <Chip variant="blue-h20" className="font-code">
                {`TOP ${ranking}`}
              </Chip>
            ) : null}
            {plus && plus.rerankUp > 0 ? (
              <Chip
                data-plus
                title={`AI 순위 다시 매김 — ${plus.rerankUp}계단 올라옴`}
                className={cn(CHIP_TEAL, "h-[17px] px-[5px] font-code text-[10px]")}
              >
                {`▲${plus.rerankUp}`}
              </Chip>
            ) : null}
          </span>
          {plus?.focus ? (
            <span data-plus>
              <ScanOverlay active className="motion-safe:[animation-duration:2.8s]" />
              <AiTag className="absolute right-[4px] bottom-[4px] h-[15px] text-[9px]">일치 부위</AiTag>
            </span>
          ) : null}
        </span>
        {plus ? (
          <AiProgress
            data-plus
            state="done"
            value={bar}
            label={`${ranking}위 유사도`}
            className={cn("h-[3px]", plus.dim && "[&>i]:bg-none [&>i]:bg-dim")}
          />
        ) : null}
        <span
          className={cn(
            "flex min-w-0 items-center gap-[6px] text-[11px] leading-[1.2] whitespace-nowrap",
            plus && !compact && "pr-[16px]",
          )}
        >
          <b className="font-code tabular-nums text-foreground">{`#${ranking}`}</b>
          {compact ? null : <span className="min-w-0 truncate font-code text-fg-2">{`No. ${item.ftwrId}`}</span>}
          <span data-grade={grade} title={`유사도 ${dot.text}`} className="ml-auto inline-flex items-center">
            <StatusDot tone={dot.tone} label={pct} className="font-code text-[11px] tabular-nums" />
            <span className="sr-only">{` 유사도 ${dot.text}`}</span>
          </span>
        </span>
        {/* 촘촘 8열은 폭이 좁아 신발 번호를 둘째 줄로 내린다(시안 카드는 「순위 · 유사도」 한 줄) */}
        {compact ? (
          <span className={cn("min-w-0 truncate font-code text-[10.5px] leading-[1.2] text-fg-2", plus && "pr-[16px]")}>
            {`No. ${item.ftwrId}`}
          </span>
        ) : null}
      </button>
      {plus ? (
        <button
          type="button"
          data-plus
          data-star={plus.starred ? "on" : "off"}
          aria-pressed={plus.starred}
          aria-label={`${ranking}위 ${item.ftwrId} 확인대상 ${plus.starred ? "빼기" : "넣기"}`}
          disabled={!plus.canStar}
          onClick={plus.onStar}
          className={cn(
            "absolute right-[6px] bottom-[3px] cursor-pointer border-none bg-transparent p-0 text-[13px] leading-none",
            plus.starred ? "text-warn" : "text-faint",
            "disabled:cursor-default disabled:opacity-30 disabled:grayscale",
          )}
        >
          {plus.starred ? "★" : "☆"}
        </button>
      ) : null}
      {plus?.peek}
    </li>
  )
}
