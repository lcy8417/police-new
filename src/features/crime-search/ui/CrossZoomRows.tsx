import { useEffect, useRef } from "react"
import { AlertTriangle, Layers, ScanLine } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"
import { matchColor, type SimilarityMatch } from "../model/similarity"

/** 컴팩트 줌 패치 한 칸(라벨 위첨자 + 작은 이미지). 에지 토글로 원본↔Canny 교체. */
function MiniPatch({ image, tone, alt }: { image?: string; tone: string; alt: string }) {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded border border-[#1E2A3C] bg-[#05080D]">
      {image ? (
        <img src={image} alt={alt} loading="lazy" className="absolute inset-0 size-full object-contain p-0.5" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center font-mono text-[8px] text-[#5B6B85]">
          —
        </span>
      )}
      <span
        aria-hidden="true"
        className="absolute top-0.5 left-0.5 rounded-[2px] bg-[#05080D]/80 px-1 font-mono text-[7px] tracking-wide uppercase"
        style={{ color: tone }}
      >
        {alt}
      </span>
    </div>
  )
}

/**
 * 미니 점수 막대(라벨 + 얇은 게이지 + 수치). 코사인과 구조 IoU를 **분리** 표기하기
 * 위한 공통 조각 — 두 축을 절대 합산하지 않는다.
 */
function MiniStat({
  label,
  pct,
  barClassName,
}: {
  label: string
  pct: number | null
  /** 채움 막대 색(코사인=blue, IoU=적→호박→녹 그라디언트). */
  barClassName: string
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="w-[26px] shrink-0 font-mono text-[8px] tracking-tight text-[#5B6B85] uppercase">
        {label}
      </span>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#05080D]">
        <div className={cn("h-full rounded-full transition-all", barClassName)} style={{ width: `${pct ?? 0}%` }} />
      </div>
      <span className="w-[22px] shrink-0 text-right font-mono text-[9px] font-semibold tabular-nums text-[#C7CEDB]">
        {pct !== null ? pct : "—"}
      </span>
    </div>
  )
}

export interface CrossZoomRowsProps {
  matches: SimilarityMatch[]
  /** 강조 중인 대응 index(1-based). 해당 카드로 스크롤·강조한다. */
  selectedIndex: number | null
  /** 카드 클릭 시 선택 잠금 토글. */
  onSelect: (index: number) => void
  /** 카드 hover 시 임시 강조(enter=index, leave=null). */
  onHover: (index: number | null) => void
  /** true면 `*_patch_edge`(Canny)를 표시. */
  showEdge: boolean
  /** 에지 토글 콜백. */
  onToggleEdge: (next: boolean) => void
}

/**
 * 화면 B — 국소 대응 크로스 줌(가로 컴팩트 번호 스트립). 대응들을 가로로 1·2·3…
 * 나열해 한눈에 훑게 한다(넘치면 가로 스크롤). 각 카드 = 번호 배지(index 색) + 족적·신발
 * 줌 패치(작게) + 코사인 score·구조 IoU를 **분리** 병기(미니 게이지, 합산 금지). 에지
 * 토글은 스트립 상단 공통 버튼. `align_overlay`는 밀도 우선이라 강조(hover/클릭)된 카드에서만
 * 펼친다. `informative=false`거나 `uninformative_reasons`가 있으면 회색·"검토" 소표시로
 * 낮춘다. 선택 index가 바뀌면 해당 카드로 스크롤·강조(화면 A와 양방향 동기).
 */
export function CrossZoomRows({
  matches,
  selectedIndex,
  onSelect,
  onHover,
  showEdge,
  onToggleEdge,
}: CrossZoomRowsProps) {
  const cardRefs = useRef<Map<number, HTMLButtonElement>>(new Map())

  // 화면 A에서 박스를 고르면 해당 카드로 부드럽게 가로 스크롤한다(가로 스트립이라 inline).
  useEffect(() => {
    if (selectedIndex === null) return
    const el = cardRefs.current.get(selectedIndex)
    el?.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" })
  }, [selectedIndex])

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-[#1E2A3C] bg-[#0B121D] p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#C7CEDB]">
          <Layers className="size-3.5 text-[#4A9EFF]" aria-hidden="true" />
          국소 대응 크로스 줌
          <span className="ml-1 rounded border border-[#1E2A3C] bg-[#0F1826] px-1.5 py-0.5 font-mono text-[9px] tabular-nums text-[#5B6B85]">
            {matches.length}
          </span>
        </span>
        <Button
          type="button"
          size="sm"
          onClick={() => onToggleEdge(!showEdge)}
          aria-pressed={showEdge}
          className={cn(
            "h-7 gap-1.5 border font-mono text-[10px] tracking-wide uppercase",
            showEdge
              ? "border-[#3B82F6]/50 bg-[#152238] text-[#4A9EFF] shadow-[0_0_10px_rgba(37,99,235,0.3)]"
              : "border-[#1E2A3C] bg-[#0F1826] text-[#8A93A6] hover:border-[#3B82F6]/40 hover:text-[#C7CEDB]"
          )}
        >
          <ScanLine className="size-3" aria-hidden="true" />
          에지 {showEdge ? "ON" : "OFF"}
        </Button>
      </div>

      {/* 가로 번호 스트립 — 카드는 고정폭 shrink-0, 넘치면 가로 스크롤. */}
      <div className="flex flex-row gap-2 overflow-x-auto pb-1">
        {matches.map((m) => {
          const color = matchColor(m.index)
          const selected = selectedIndex === m.index
          const dimmed = selectedIndex !== null && !selected
          const uninformative = m.informative === false || (m.uninformative_reasons?.length ?? 0) > 0
          const queryPatch = showEdge ? m.query_patch_edge ?? m.query_patch : m.query_patch
          const refPatch = showEdge ? m.ref_patch_edge ?? m.ref_patch : m.ref_patch
          const cosPct = Math.round(Math.max(0, Math.min(1, m.score)) * 100)
          const iouPct =
            typeof m.structural_iou === "number"
              ? Math.round(Math.max(0, Math.min(1, m.structural_iou)) * 100)
              : null

          return (
            <button
              key={m.index}
              type="button"
              ref={(el) => {
                if (el) cardRefs.current.set(m.index, el)
                else cardRefs.current.delete(m.index)
              }}
              onClick={() => onSelect(m.index)}
              onMouseEnter={() => onHover(m.index)}
              onMouseLeave={() => onHover(null)}
              aria-pressed={selected}
              title={uninformative ? m.uninformative_reasons?.join(" · ") : undefined}
              className={cn(
                "flex w-[132px] shrink-0 flex-col gap-2 rounded-lg border bg-[#0F1826] p-2 text-left transition-all duration-200",
                selected
                  ? "border-[#3B82F6]/60 shadow-[0_0_16px_rgba(37,99,235,0.28)]"
                  : "border-[#1E2A3C] hover:border-[#3B82F6]/40",
                dimmed && "opacity-45",
                uninformative && "grayscale"
              )}
            >
              {/* 카드 헤더: 번호 배지(색=index) + 검토 소표시. */}
              <div className="flex items-center gap-1.5">
                <span
                  className="flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold tabular-nums text-[#05080D]"
                  style={{ backgroundColor: uninformative ? "#5B6B85" : color }}
                >
                  {m.index}
                </span>
                <span className="text-[10px] font-semibold text-[#C7CEDB]">대응 #{m.index}</span>
                {uninformative && (
                  <span className="ml-auto flex items-center gap-0.5 rounded border border-[#F59E0B]/40 bg-[#241C0F] px-1 py-0.5 font-mono text-[8px] tracking-wide text-[#FBBF24] uppercase">
                    <AlertTriangle className="size-2" aria-hidden="true" />
                    검토
                  </span>
                )}
              </div>

              {/* 줌 패치(작게): 족적 · 신발 나란히. */}
              <div className="grid grid-cols-2 gap-1">
                <MiniPatch image={queryPatch} tone="#4A9EFF" alt="족적" />
                <MiniPatch image={refPatch} tone="#2DD4BF" alt="신발" />
              </div>

              {/* 두 점수를 분리 병기(코사인 · 구조 IoU) — 미니 게이지. */}
              <div className="flex flex-col gap-1">
                <MiniStat label="코사인" pct={cosPct} barClassName="bg-[#4A9EFF]" />
                <MiniStat
                  label="IoU"
                  pct={iouPct}
                  barClassName="bg-gradient-to-r from-[#EF4444] via-[#F59E0B] to-[#4ADE80]"
                />
              </div>

              {/* 정렬 겹침(align_overlay) — 밀도 우선이라 강조된 카드에서만 펼친다. */}
              {selected && m.align_overlay && (
                <div className="flex flex-col gap-1 border-t border-[#141D2C] pt-1.5">
                  <div className="relative aspect-square w-full overflow-hidden rounded border border-[#1E2A3C] bg-[#05080D]">
                    <img
                      src={m.align_overlay}
                      alt="정렬 겹침"
                      loading="lazy"
                      className="absolute inset-0 size-full object-contain p-0.5"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute top-0.5 left-0.5 rounded-[2px] bg-[#05080D]/80 px-1 font-mono text-[7px] tracking-wide text-[#F59E0B] uppercase"
                    >
                      정렬 겹침
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 font-mono text-[8px] tracking-wide text-[#5B6B85] uppercase">
                    <span className="flex items-center gap-0.5">
                      <span className="size-1.5 rounded-full bg-[#EF4444]" aria-hidden="true" />족
                    </span>
                    <span className="flex items-center gap-0.5">
                      <span className="size-1.5 rounded-full bg-[#22C55E]" aria-hidden="true" />신
                    </span>
                    <span className="flex items-center gap-0.5">
                      <span className="size-1.5 rounded-full bg-[#FDE047]" aria-hidden="true" />일치
                    </span>
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
