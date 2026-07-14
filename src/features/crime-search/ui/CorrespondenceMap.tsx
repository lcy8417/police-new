import { useCallback, useLayoutEffect, useRef, useState } from "react"
import { Camera, Database } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { scalePoint } from "../lib/match-geometry"
import { matchColor, type SimilarityImage, type SimilarityMatch } from "../model/similarity"

/** 부모 기준으로 잰 한 이미지의 표시 사각형(px). */
interface Rect {
  left: number
  top: number
  width: number
  height: number
}

export interface CorrespondenceMapProps {
  /** 족적(질의) 이미지 + 원본 크기. */
  query: SimilarityImage
  /** 신발(참조) 이미지 + 원본 크기. */
  ref: SimilarityImage
  /** score 내림차순 대응 목록. */
  matches: SimilarityMatch[]
  /** 현재 선택된 대응 index(1-based). null이면 전체 동일 강조. */
  selectedIndex: number | null
  /** 핀/선 클릭·호버 시 선택 index 콜백(같은 index 재클릭=해제). */
  onSelect: (index: number | null) => void
}

/**
 * 화면 A — 대응 지도. 족적·신발을 같은 높이로 나란히 두고, 각 대응의 `query_point ↔
 * ref_point`를 번호 핀 + 연결선으로 잇는다. 색=대응 index(좌우 동일), 선 굵기·불투명도=
 * 코사인 score. 핀/선 hover·클릭으로 해당 쌍을 강조(나머지는 흐림)하고 선택 index를
 * 상위로 올린다.
 *
 * 좌표 정렬: 두 이미지를 각자 종횡비로 표시하되(높이만 CSS로 맞춤), 연결선은 부모
 * `relative` 위 단일 SVG(`absolute inset-0 pointer-events-none`)에 그린다. 각 핀의
 * 부모기준 px = (이미지 표시 rect) + scalePoint(원본좌표). 이미지 로드/리사이즈 후 rect를
 * 재측정한다(ResizeObserver + onLoad). 순수 스케일 수학은 `../lib/match-geometry`.
 */
export function CorrespondenceMap({
  query,
  ref: refImg,
  matches,
  selectedIndex,
  onSelect,
}: CorrespondenceMapProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const queryImgRef = useRef<HTMLImageElement>(null)
  const refImgRef = useRef<HTMLImageElement>(null)
  const [rects, setRects] = useState<{ query: Rect; ref: Rect } | null>(null)

  // 이미지 표시 rect를 부모 기준 좌표로 재측정한다. 로드 완료(natural 크기 확정) 후와
  // 리사이즈마다 호출해 핀이 표시 이미지 위에 정확히 앉게 한다.
  const measure = useCallback(() => {
    const wrap = wrapRef.current
    const qImg = queryImgRef.current
    const rImg = refImgRef.current
    if (!wrap || !qImg || !rImg) return
    if (!qImg.complete || !rImg.complete) return
    const base = wrap.getBoundingClientRect()
    const q = qImg.getBoundingClientRect()
    const r = rImg.getBoundingClientRect()
    setRects({
      query: { left: q.left - base.left, top: q.top - base.top, width: q.width, height: q.height },
      ref: { left: r.left - base.left, top: r.top - base.top, width: r.width, height: r.height },
    })
  }, [])

  useLayoutEffect(() => {
    measure()
    const wrap = wrapRef.current
    if (!wrap || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(() => measure())
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [measure, query.image, refImg.image])

  const isActive = (index: number) => selectedIndex === null || selectedIndex === index
  const dimmed = (index: number) => selectedIndex !== null && selectedIndex !== index

  // 각 핀의 부모기준 px 위치를 계산한다(측정 완료 후에만).
  const pins = rects
    ? matches.flatMap((m) => {
        const [qx, qy] = scalePoint(query.size, [rects.query.width, rects.query.height], m.query_point)
        const [rx, ry] = scalePoint(refImg.size, [rects.ref.width, rects.ref.height], m.ref_point)
        return [
          {
            match: m,
            side: "query" as const,
            x: rects.query.left + qx,
            y: rects.query.top + qy,
          },
          {
            match: m,
            side: "ref" as const,
            x: rects.ref.left + rx,
            y: rects.ref.top + ry,
          },
        ]
      })
    : []

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[#1E2A3C] bg-[#0B121D] p-3">
      {/* 두 이미지 위 라벨 */}
      <div className="flex items-center justify-between px-0.5">
        <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.12em] text-[#8A93A6] uppercase">
          <Camera className="size-3 text-[#4A9EFF]" aria-hidden="true" />
          족적 · 질의
        </span>
        <span className="font-mono text-[9px] tracking-[0.14em] text-[#5B6B85] uppercase">
          Correspondence
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.12em] text-[#8A93A6] uppercase">
          신발 · 참조
          <Database className="size-3 text-[#2DD4BF]" aria-hidden="true" />
        </span>
      </div>

      {/* 이미지 2장 + 오버레이. 부모 relative가 핀·선의 좌표 기준면. */}
      <div
        ref={wrapRef}
        className="relative flex items-start justify-center gap-6 rounded-lg bg-[#05080D] p-3"
      >
        <figure className="relative shrink-0">
          <img
            ref={queryImgRef}
            src={query.image}
            alt="족적 질의 이미지"
            onLoad={measure}
            draggable={false}
            className="block h-[260px] w-auto select-none rounded-md sm:h-[300px]"
          />
        </figure>
        <figure className="relative shrink-0">
          <img
            ref={refImgRef}
            src={refImg.image}
            alt="신발 참조 이미지"
            onLoad={measure}
            draggable={false}
            className="block h-[260px] w-auto select-none rounded-md sm:h-[300px]"
          />
        </figure>

        {/* 연결선 레이어(순수 장식, 클릭 판정은 핀 버튼이 담당). */}
        {rects && (
          <svg
            className="pointer-events-none absolute inset-0 size-full overflow-visible"
            aria-hidden="true"
          >
            {matches.map((m) => {
              const [qx, qy] = scalePoint(
                query.size,
                [rects.query.width, rects.query.height],
                m.query_point
              )
              const [rx, ry] = scalePoint(refImg.size, [rects.ref.width, rects.ref.height], m.ref_point)
              const x1 = rects.query.left + qx
              const y1 = rects.query.top + qy
              const x2 = rects.ref.left + rx
              const y2 = rects.ref.top + ry
              const color = matchColor(m.index)
              const active = isActive(m.index)
              // 선 굵기·불투명도로 score를 인코딩(강한 대응일수록 두껍고 진하게).
              const width = 1 + m.score * 3
              const opacity = active ? 0.35 + m.score * 0.5 : 0.08
              return (
                <line
                  key={m.index}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={color}
                  strokeWidth={width}
                  strokeOpacity={opacity}
                  strokeLinecap="round"
                  className="transition-opacity duration-200"
                />
              )
            })}
          </svg>
        )}

        {/* 번호 핀(클릭·호버 대상). 런타임 좌표라 top/left만 인라인 style 예외. */}
        {pins.map((p) => {
          const color = matchColor(p.match.index)
          const active = isActive(p.match.index)
          const selected = selectedIndex === p.match.index
          return (
            <button
              key={`${p.match.index}-${p.side}`}
              type="button"
              onClick={() => onSelect(selected ? null : p.match.index)}
              onMouseEnter={() => onSelect(p.match.index)}
              onMouseLeave={() => onSelect(null)}
              aria-label={`대응 ${p.match.index} ${p.side === "query" ? "족적" : "신발"} 지점`}
              aria-pressed={selected}
              className={cn(
                "absolute z-10 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 font-mono text-[11px] font-bold tabular-nums text-[#05080D] shadow-md transition-all duration-200 hover:scale-125",
                dimmed(p.match.index) && "opacity-25",
                selected && "scale-125 ring-2 ring-white/70"
              )}
              style={{
                left: `${p.x}px`,
                top: `${p.y}px`,
                backgroundColor: active ? color : "#5B6B85",
                borderColor: "#05080D",
              }}
            >
              {p.match.index}
            </button>
          )
        })}
      </div>

      {/* 범례: 선 굵기=유사도. */}
      <div className="flex items-center gap-2 px-0.5 font-mono text-[9px] tracking-wide text-[#5B6B85] uppercase">
        <span className="h-0.5 w-4 rounded-full bg-[#5B6B85]" aria-hidden="true" />
        <span>얇음 · 약</span>
        <span className="h-1 w-6 rounded-full bg-[#4A9EFF]" aria-hidden="true" />
        <span>두꺼움 · 강 (선 굵기 = 유사도)</span>
      </div>
    </div>
  )
}
