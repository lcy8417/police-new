import { useEffect, useRef } from "react"
import { ArrowLeftRight } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { matchColor, type SimilarityMatch } from "../model/similarity"

/** 컴팩트 줌 패치 한 칸(라벨 위첨자 + 작은 이미지). 족적/신발 크롭을 그대로 보인다. */
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
 * 족적↔신발 패치 사이에 놓는 소형 대응 배지. 두 패치가 '나란한 목록'이 아니라 '비교
 * 대상'임을 시각적으로 잇는다(화면 A의 CompareConnector와 같은 시각 언어의 축소판).
 */
function MiniConnector() {
  return (
    <span
      aria-hidden="true"
      className="flex size-4 shrink-0 items-center justify-center rounded-full border border-[#3B82F6]/50 bg-[#152238] text-[#4A9EFF] shadow-[0_0_6px_rgba(37,99,235,0.35)]"
    >
      <ArrowLeftRight className="size-2.5" />
    </span>
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
}

/**
 * 화면 B — 국소 대응 크로스 줌(컴팩트 그리드). 대응들을 번호순으로 **그리드 카드**로
 * 채운다(화면 A 오른쪽 여백을 세로가 아니라 격자로 활용). 각 카드는 **최소 구성**으로
 * 다듬었다: 번호 배지(index 색) + 족적↔신발 줌 패치(가운데 ↔ 대응 배지) + 코사인
 * 유사도(%)만. structural_iou·align_overlay·에지 토글 등 부가 축은 데이터로는 남기되
 * **표시하지 않는다**(밀도·가독 우선). 선택 index가 바뀌면 해당 카드로 스크롤·강조
 * (화면 A와 양방향 동기).
 */
export function CrossZoomRows({ matches, selectedIndex, onSelect, onHover }: CrossZoomRowsProps) {
  const cardRefs = useRef<Map<number, HTMLButtonElement>>(new Map())

  // 화면 A에서 박스를 고르면 해당 카드로 부드럽게 스크롤한다(그리드라 block 기준).
  useEffect(() => {
    if (selectedIndex === null) return
    const el = cardRefs.current.get(selectedIndex)
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" })
  }, [selectedIndex])

  return (
    <div className="@container flex min-w-0 flex-col gap-2.5 rounded-xl border border-[#1E2A3C] bg-[#0D1420]/40 p-3">
      {/* 존카드 헤더 — A(대응 지도)와 같은 배지+이름+룰 문법. B 배지로 하위 카드임을 명시하고,
          룰 뒤에 부제(족적↔신발·코사인)를 둔다. */}
      <div className="flex items-center gap-2.5">
        <span className="rounded-md border border-[#3B82F6]/50 bg-[#152238] px-2 py-0.5 font-mono text-[12px] font-semibold text-[#4A9EFF]">
          B
        </span>
        <span className="font-mono text-[10px] tracking-[0.14em] text-[#8A93A6] uppercase">
          크로스 줌
        </span>
        <span className="rounded border border-[#1E2A3C] bg-[#0F1826] px-1.5 py-0.5 font-mono text-[9px] tabular-nums text-[#5B6B85]">
          {matches.length}
        </span>
        <span className="h-px flex-1 bg-[#1E2A3C]" aria-hidden="true" />
        <span className="shrink-0 font-mono text-[9px] tracking-[0.14em] text-[#5B6B85] uppercase">
          족적 ↔ 신발 · 코사인
        </span>
      </div>

      {/* 대응 그리드 — 최대 2열로 제한(자체 @container 폭 기준)해 대응이 적어도 여러 행이
          만들어져 A(대응 지도)의 세로 높이를 채우게 한다. min-h-0 flex-1 + 내부 스크롤로
          높이를 A에 맞추고, 대응이 많으면 이 격자만 스크롤한다. */}
      <div className="grid min-h-0 flex-1 content-start grid-cols-1 gap-2 overflow-y-auto @[300px]:grid-cols-2">
        {matches.map((m) => {
          const color = matchColor(m.index)
          const selected = selectedIndex === m.index
          const dimmed = selectedIndex !== null && !selected
          const cosPct = Math.round(Math.max(0, Math.min(1, m.score)) * 100)

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
              aria-label={`대응 ${m.index} · 코사인 ${cosPct}%`}
              className={cn(
                "flex flex-col gap-2 rounded-lg border bg-[#0F1826] p-2 text-left transition-all duration-200",
                selected
                  ? "border-[#3B82F6]/60 shadow-[0_0_16px_rgba(37,99,235,0.28)]"
                  : "border-[#1E2A3C] hover:border-[#3B82F6]/40",
                dimmed && "opacity-45"
              )}
            >
              {/* 카드 헤더: 번호 배지(색=index) + 라벨 + 코사인 % 칩. */}
              <div className="flex items-center gap-1.5">
                <span
                  className="flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold tabular-nums text-[#05080D]"
                  style={{ backgroundColor: color }}
                >
                  {m.index}
                </span>
                <span className="text-[10px] font-semibold text-[#C7CEDB]">대응 #{m.index}</span>
                <span className="ml-auto flex items-baseline gap-0.5 rounded border border-[#3B82F6]/40 bg-[#152238] px-1.5 py-0.5 text-[#4A9EFF]">
                  <span className="font-mono text-[7px] tracking-wide uppercase opacity-70">코사인</span>
                  <span className="font-mono text-[11px] font-bold tabular-nums">{cosPct}%</span>
                </span>
              </div>

              {/* 줌 패치: 족적 ↔ 신발(가운데 소형 대응 배지로 '비교'임을 명시). */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1">
                <MiniPatch image={m.query_patch} tone="#4A9EFF" alt="족적" />
                <MiniConnector />
                <MiniPatch image={m.ref_patch} tone="#2DD4BF" alt="신발" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
