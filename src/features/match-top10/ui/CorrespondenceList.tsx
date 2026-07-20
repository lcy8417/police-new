import { Camera, Database, ImageOff, Loader2 } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import type { MatchCorrespondence } from "@/entities/match"

import { matchScoreToDisplayPercent } from "../lib/score-format"
import { matchTop10Color } from "../lib/match-colors"

/** 신발측 크롭 준비 상태 — 아직 없으면(undefined) 행 안에서 로딩/대체를 보인다. */
export type ShoeCropSlot = string | undefined

export interface CorrespondenceListProps {
  /** score 내림차순 top-10 대응 목록. */
  matches: MatchCorrespondence[]
  /** index별 신발측 크롭(클라이언트 생성) — 준비 전이면 undefined. */
  shoeCrops: ShoeCropSlot[]
  /** 현재 강조 중인 대응(hover가 locked를 덮어씀) — 오버레이 박스와 공유하는 상태. */
  activeIndex: number | null
  onSelect: (index: number) => void
  onHover: (index: number | null) => void
}

/** 한 행 — 족적(scene) 크롭 ↔ 신발(shoe) 크롭 짝 + 순위 배지 + score. */
function CorrespondenceRow({
  match,
  index,
  shoeCrop,
  selected,
  onSelect,
  onHover,
}: {
  match: MatchCorrespondence
  index: number
  shoeCrop: ShoeCropSlot
  selected: boolean
  onSelect: (index: number) => void
  onHover: (index: number | null) => void
}) {
  const rank = index + 1
  const color = matchTop10Color(rank)

  return (
    <button
      type="button"
      onClick={() => onSelect(index)}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      aria-label={`대응 ${rank}번 행 선택`}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg border p-2 text-left transition-colors",
        selected
          ? "border-[#3B82F6]/60 bg-[#152238] shadow-[0_0_12px_rgba(37,99,235,0.25)]"
          : "border-[#1E2A3C] bg-[#0F1826] hover:border-[#3B82F6]/40 hover:bg-[#111c2c]"
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold tabular-nums text-[#05080D] shadow-sm"
        style={{ backgroundColor: color }}
      >
        {rank}
      </span>

      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <div className="relative aspect-square w-14 shrink-0 overflow-hidden rounded-md border border-[#1E2A3C] bg-[#05080D]">
          <img
            src={match.box_image}
            alt={`대응 ${rank}번 족적 크롭`}
            className="absolute inset-0 size-full object-contain p-0.5"
          />
        </div>
        <span className="shrink-0 text-[#5B6B85]" aria-hidden="true">
          <Camera className="size-3" />
        </span>

        <span className="mx-0.5 shrink-0 text-[10px] text-[#5B6B85]" aria-hidden="true">
          ↔
        </span>

        <span className="shrink-0 text-[#5B6B85]" aria-hidden="true">
          <Database className="size-3" />
        </span>
        <div className="relative aspect-square w-14 shrink-0 overflow-hidden rounded-md border border-[#1E2A3C] bg-[#05080D]">
          {shoeCrop ? (
            <img
              src={shoeCrop}
              alt={`대응 ${rank}번 신발 크롭`}
              className="absolute inset-0 size-full object-contain p-0.5"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-0.5 text-[#5B6B85]">
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              <span className="text-[8px]">생성 중</span>
            </div>
          )}
        </div>
      </div>

      <span className="shrink-0 font-mono text-[11px] font-bold tabular-nums text-[#4A9EFF]">
        {matchScoreToDisplayPercent(match.score)}%
      </span>
    </button>
  )
}

/**
 * [CORRECTION 2] top-10 대응을 한 번에 비교하는 짝(pair) 리스트 — 기존
 * `DetailPanel`(단일 선택 세부사항)을 대체한다. 각 행은 족적 크롭(`box_image`,
 * 백엔드 제공)과 신발 크롭(클라이언트 생성, `useShoeCrops`)을 나란히 보여주며,
 * 클릭=선택 고정·hover=임시 강조로 오버레이 박스와 상태를 공유한다(양방향 연동).
 */
export function CorrespondenceList({
  matches,
  shoeCrops,
  activeIndex,
  onSelect,
  onHover,
}: CorrespondenceListProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-[#1E2A3C] bg-[#0D1420]/40 p-3">
      <div className="flex items-center gap-2.5">
        <span className="rounded-md border border-[#3B82F6]/50 bg-[#152238] px-2 py-0.5 font-mono text-[12px] font-semibold text-[#4A9EFF]">
          세부
        </span>
        <span className="font-mono text-[10px] tracking-[0.14em] text-[#8A93A6] uppercase">
          대응 목록
        </span>
        <span className="h-px flex-1 bg-[#1E2A3C]" aria-hidden="true" />
      </div>

      {matches.length > 0 ? (
        <div className="flex flex-col gap-1.5 overflow-y-auto">
          {matches.map((match, index) => (
            <CorrespondenceRow
              key={index}
              match={match}
              index={index}
              shoeCrop={shoeCrops[index]}
              selected={activeIndex === index}
              onSelect={onSelect}
              onHover={onHover}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 py-6 text-center text-[#5B6B85]">
          <ImageOff className="size-6" aria-hidden="true" />
          <span className="text-[11px] font-medium">대응 결과가 없습니다</span>
        </div>
      )}
    </div>
  )
}
