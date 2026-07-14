import { useEffect, useRef } from "react"
import { AlertTriangle, Layers, ScanLine, SquareStack } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"
import { matchColor, type SimilarityMatch } from "../model/similarity"

/** 한 줌 패치 타일(라벨 + 이미지). 에지 토글로 원본↔Canny를 교체한다. */
function PatchTile({
  label,
  image,
  tone,
}: {
  label: string
  image?: string
  /** 라벨 강조 톤(query=blue, overlay=amber, ref=teal). */
  tone: string
}) {
  return (
    <figure className="flex min-w-0 flex-col gap-1">
      <figcaption
        className="font-mono text-[9px] tracking-[0.1em] uppercase"
        style={{ color: tone }}
      >
        {label}
      </figcaption>
      <div className="relative aspect-square w-full overflow-hidden rounded-md border border-[#1E2A3C] bg-[#05080D]">
        {image ? (
          <img
            src={image}
            alt={label}
            loading="lazy"
            className="absolute inset-0 size-full object-contain p-1"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] text-[#5B6B85]">
            없음
          </span>
        )}
      </div>
    </figure>
  )
}

/** 구조적 IoU 미터(0~1) — 코사인 score와 **분리** 표기하는 두 번째 축. */
function IouMeter({ iou }: { iou?: number }) {
  const value = typeof iou === "number" ? Math.max(0, Math.min(1, iou)) : null
  const pct = value !== null ? Math.round(value * 100) : null
  // 0(빨강)→0.5(호박)→1(초록) 그라디언트를 채움 비율로 잘라 강도를 색으로도 전달.
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between font-mono text-[9px] tracking-[0.12em] text-[#8A93A6] uppercase">
        <span>구조 IoU</span>
        <span className="tabular-nums text-[#C7CEDB]">{pct !== null ? `${pct}%` : "—"}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#05080D]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#EF4444] via-[#F59E0B] to-[#4ADE80] transition-all"
          style={{ width: `${pct ?? 0}%` }}
        />
      </div>
    </div>
  )
}

/** 코사인 유사도 배지 — IoU와 **다른 축**임을 라벨로 명시(합산 금지). */
function CosineBadge({ score }: { score: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, score)) * 100)
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[9px] tracking-[0.12em] text-[#8A93A6] uppercase">코사인 유사도</span>
      <span className="inline-flex w-fit items-center gap-1 rounded-md border border-[#3B82F6]/40 bg-[#152238] px-2 py-0.5 font-mono text-[13px] font-bold tabular-nums text-[#4A9EFF]">
        {pct}
        <span className="text-[9px] font-medium text-[#8A93A6]">%</span>
      </span>
    </div>
  )
}

export interface CrossZoomRowsProps {
  matches: SimilarityMatch[]
  /** 선택된 대응 index(1-based). 해당 행으로 스크롤·강조한다. */
  selectedIndex: number | null
  /** 행 클릭 시 선택 index 콜백(같은 index 재클릭=해제). */
  onSelect: (index: number | null) => void
  /** true면 `*_patch_edge`(Canny)를 표시. */
  showEdge: boolean
  /** 에지 토글 콜백. */
  onToggleEdge: (next: boolean) => void
}

/**
 * 화면 B — 크로스 줌. 대응별 행: 번호 배지(색=index) + `query_patch`·`align_overlay`·
 * `ref_patch` 3패치 + 우측 `structural_iou` 미터와 코사인 `score`를 **분리 병기**(합산
 * 금지). 에지 토글로 `*_patch`↔`*_patch_edge`를 교체한다. `informative=false`거나
 * `uninformative_reasons`가 있으면 회색·"검토 필요"로 낮춘다. 선택 index가 바뀌면 해당
 * 행으로 스크롤·강조(화면 A와 양방향 동기).
 */
export function CrossZoomRows({
  matches,
  selectedIndex,
  onSelect,
  showEdge,
  onToggleEdge,
}: CrossZoomRowsProps) {
  const rowRefs = useRef<Map<number, HTMLButtonElement>>(new Map())

  // 화면 A에서 핀을 고르면 해당 행으로 부드럽게 스크롤한다.
  useEffect(() => {
    if (selectedIndex === null) return
    const el = rowRefs.current.get(selectedIndex)
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [selectedIndex])

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-[#1E2A3C] bg-[#0B121D] p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#C7CEDB]">
          <Layers className="size-3.5 text-[#4A9EFF]" aria-hidden="true" />
          국소 대응 크로스 줌
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

      {matches.map((m) => {
        const color = matchColor(m.index)
        const selected = selectedIndex === m.index
        const dimmed = selectedIndex !== null && !selected
        const uninformative = m.informative === false || (m.uninformative_reasons?.length ?? 0) > 0
        const queryPatch = showEdge ? m.query_patch_edge ?? m.query_patch : m.query_patch
        const refPatch = showEdge ? m.ref_patch_edge ?? m.ref_patch : m.ref_patch

        return (
          <button
            key={m.index}
            type="button"
            ref={(el) => {
              if (el) rowRefs.current.set(m.index, el)
              else rowRefs.current.delete(m.index)
            }}
            onClick={() => onSelect(selected ? null : m.index)}
            aria-pressed={selected}
            className={cn(
              "group flex flex-col gap-2.5 rounded-lg border bg-[#0F1826] p-2.5 text-left transition-all duration-200",
              selected
                ? "border-[#3B82F6]/60 shadow-[0_0_16px_rgba(37,99,235,0.28)]"
                : "border-[#1E2A3C] hover:border-[#3B82F6]/40",
              dimmed && "opacity-45",
              uninformative && "grayscale"
            )}
          >
            {/* 행 헤더: 번호 배지(색=index) + 상태. */}
            <div className="flex items-center gap-2">
              <span
                className="flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold tabular-nums text-[#05080D]"
                style={{ backgroundColor: uninformative ? "#5B6B85" : color }}
              >
                {m.index}
              </span>
              <span className="text-[11px] font-semibold text-[#C7CEDB]">대응 #{m.index}</span>
              {uninformative && (
                <span className="ml-auto flex items-center gap-1 rounded-md border border-[#F59E0B]/40 bg-[#241C0F] px-1.5 py-0.5 font-mono text-[9px] tracking-wide text-[#FBBF24] uppercase">
                  <AlertTriangle className="size-2.5" aria-hidden="true" />
                  검토 필요
                </span>
              )}
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-3">
              {/* 좌: 3패치(질의 / 정렬겹침 / 참조). */}
              <div className="grid grid-cols-3 gap-2">
                <PatchTile label="족적" image={queryPatch} tone="#4A9EFF" />
                <PatchTile label="정렬 겹침" image={m.align_overlay} tone="#F59E0B" />
                <PatchTile label="신발" image={refPatch} tone="#2DD4BF" />
              </div>

              {/* 우: 두 점수를 분리 병기(코사인 · 구조 IoU) + 정렬겹침 범례. */}
              <div className="flex w-32 shrink-0 flex-col justify-between gap-2">
                <CosineBadge score={m.score} />
                <IouMeter iou={m.structural_iou} />
                <div className="flex items-center gap-2 font-mono text-[8px] tracking-wide text-[#5B6B85] uppercase">
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-[#EF4444]" aria-hidden="true" />족
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-[#22C55E]" aria-hidden="true" />신
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-[#FDE047]" aria-hidden="true" />일치
                  </span>
                </div>
              </div>
            </div>

            {/* 비유효 사유(있으면). */}
            {uninformative && (m.uninformative_reasons?.length ?? 0) > 0 && (
              <div className="flex items-start gap-1.5 border-t border-[#141D2C] pt-2 font-mono text-[9px] text-[#8A93A6]">
                <SquareStack className="mt-px size-2.5 shrink-0 text-[#5B6B85]" aria-hidden="true" />
                <span>{m.uninformative_reasons?.join(" · ")}</span>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
