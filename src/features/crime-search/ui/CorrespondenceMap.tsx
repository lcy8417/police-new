import { useCallback, useLayoutEffect, useRef, useState } from "react"
import { ArrowLeftRight, Camera, Database } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { scaleBbox } from "../lib/match-geometry"
import { matchColor, type SimilarityImage, type SimilarityMatch } from "../model/similarity"

/** 한 이미지의 화면 표시 크기(px) — bbox 스케일의 분자. */
interface Disp {
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
  /** 현재 강조 중인 대응 index(1-based). null이면 전체 동일 강조. */
  selectedIndex: number | null
  /** 박스 클릭 시 선택 잠금 토글(같은 index 재클릭=해제). */
  onSelect: (index: number) => void
  /** 박스 hover 시 임시 강조(enter=index, leave=null). */
  onHover: (index: number | null) => void
}

/**
 * 한 이미지 위에 그리는 bbox 오버레이 한 겹. 각 대응의 `*_bbox`를 `scaleBbox`로 표시
 * 좌표로 환산해 index 색 사각 박스로 그리고, 좌상단 모서리에 번호 배지를 붙인다.
 * 족적과 신발이 같은 번호·색을 쓰므로 좌우 대응이 한눈에 읽힌다.
 */
function BoxLayer({
  size,
  disp,
  matches,
  side,
  selectedIndex,
  onSelect,
  onHover,
}: {
  size: SimilarityImage["size"]
  disp: Disp | null
  matches: SimilarityMatch[]
  side: "query" | "ref"
  selectedIndex: number | null
  onSelect: (index: number) => void
  onHover: (index: number | null) => void
}) {
  if (!disp) return null
  return (
    <>
      {matches.map((m) => {
        const bbox = side === "query" ? m.query_bbox : m.ref_bbox
        const [x, y, w, h] = scaleBbox(size, [disp.width, disp.height], bbox)
        const color = matchColor(m.index)
        const active = selectedIndex === null || selectedIndex === m.index
        const selected = selectedIndex === m.index
        const dimmed = selectedIndex !== null && selectedIndex !== m.index
        return (
          <button
            key={m.index}
            type="button"
            onClick={() => onSelect(m.index)}
            onMouseEnter={() => onHover(m.index)}
            onMouseLeave={() => onHover(null)}
            aria-label={`대응 ${m.index} ${side === "query" ? "족적" : "신발"} 영역`}
            aria-pressed={selected}
            // 런타임 좌표(bbox 스케일 결과)라 left/top/width/height·색은 인라인 style 예외.
            className={cn(
              "group absolute rounded-[3px] border-2 transition-all duration-200",
              dimmed ? "opacity-25" : "opacity-100",
              selected ? "z-20" : "z-10"
            )}
            style={{
              left: `${x}px`,
              top: `${y}px`,
              width: `${w}px`,
              height: `${h}px`,
              borderColor: active ? color : "#5B6B85",
              backgroundColor: selected ? `${color}26` : "transparent",
              boxShadow: selected ? `0 0 14px ${color}66, inset 0 0 10px ${color}22` : "none",
            }}
          >
            {/* 번호 배지 — 박스 좌상단 모서리에 얹어 좌우 동일 번호로 대응을 표현. */}
            <span
              aria-hidden="true"
              className={cn(
                "absolute -top-2.5 -left-2.5 flex size-[19px] items-center justify-center rounded-full border font-mono text-[10px] font-bold tabular-nums text-[#05080D] shadow-md transition-transform duration-200",
                selected ? "scale-[1.15]" : "group-hover:scale-110"
              )}
              style={{ backgroundColor: active ? color : "#5B6B85", borderColor: "#05080D" }}
            >
              {m.index}
            </span>
          </button>
        )
      })}
    </>
  )
}

/**
 * 두 이미지 사이에 놓는 세로 대응 배지(↔). 족적·신발이 '나란한 두 장'이 아니라
 * '비교 쌍'임을 시각적으로 잇는다(ShoeDetailContent의 CompareConnector와 같은 시각
 * 언어). 순수 장식이므로 pointer-events-none — 좌표 판정·박스 클릭을 막지 않는다.
 */
function CompareConnector() {
  return (
    <div
      className="pointer-events-none flex shrink-0 flex-col items-center justify-center self-stretch py-2"
      aria-hidden="true"
    >
      <span className="h-full w-px bg-gradient-to-b from-transparent via-[#3B82F6]/40 to-transparent" />
      <span className="my-1 flex size-7 items-center justify-center rounded-full border border-[#3B82F6]/50 bg-[#152238] text-[#4A9EFF] shadow-[0_0_10px_rgba(37,99,235,0.4)]">
        <ArrowLeftRight className="size-3.5" />
      </span>
      <span className="h-full w-px bg-gradient-to-b from-[#3B82F6]/40 via-[#3B82F6]/40 to-transparent" />
    </div>
  )
}

/**
 * 화면 A — 대응 지도. 족적(query)·신발(ref)을 같은 높이로 나란히 두고, 각 대응의 매칭
 * 위치를 **바운딩 박스**로 그린다(족적엔 `query_bbox`, 신발엔 `ref_bbox`). 박스는 index
 * 색 테두리 + 좌상단 번호 배지 — 좌우가 같은 번호·색을 공유해 "이 영역이 저 영역"임을
 * 색·번호만으로 전달한다(연결선 없음). 박스 hover/클릭 시 해당 대응만 강조하고 나머지는
 * 흐리며, 선택 index를 상위로 올려 화면 B와 양방향 동기한다.
 *
 * 좌표 정렬: 두 이미지를 각자 종횡비로 표시하되(높이만 CSS로 맞춤), 각 이미지의 표시
 * 크기를 로드/리사이즈 후 재측정해(onLoad + ResizeObserver) `scaleBbox`로 원본 bbox를
 * 표시 좌표로 환산한다(`query_*`=query.size, `ref_*`=ref.size, size=[h,w]). 박스는 각
 * 이미지(figure)에 밀착 배치되므로 figure 기준 좌표가 곧 이미지 좌표다.
 */
export function CorrespondenceMap({
  query,
  ref: refImg,
  matches,
  selectedIndex,
  onSelect,
  onHover,
}: CorrespondenceMapProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const queryImgRef = useRef<HTMLImageElement>(null)
  const refImgRef = useRef<HTMLImageElement>(null)
  const [disp, setDisp] = useState<{ query: Disp; ref: Disp } | null>(null)

  // 각 이미지의 표시 크기를 재측정한다. 로드 완료(natural 크기 확정) 후와 리사이즈마다
  // 호출해 박스가 표시 이미지 위에 정확히 앉게 한다.
  const measure = useCallback(() => {
    const qImg = queryImgRef.current
    const rImg = refImgRef.current
    if (!qImg || !rImg || !qImg.complete || !rImg.complete) return
    const q = qImg.getBoundingClientRect()
    const r = rImg.getBoundingClientRect()
    setDisp({
      query: { width: q.width, height: q.height },
      ref: { width: r.width, height: r.height },
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

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[#1E2A3C] bg-[#0B121D] p-3">
      {/* 두 이미지 위 라벨 — 좌 족적 · 우 신발. */}
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

      {/* 이미지 2장 + bbox 오버레이. 각 figure가 이미지에 밀착돼 박스의 좌표 기준면이 된다. */}
      <div
        ref={wrapRef}
        className="flex items-stretch justify-center gap-3 rounded-lg bg-[#05080D] p-4"
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
          <BoxLayer
            size={query.size}
            disp={disp?.query ?? null}
            matches={matches}
            side="query"
            selectedIndex={selectedIndex}
            onSelect={onSelect}
            onHover={onHover}
          />
        </figure>
        {/* 족적 ↔ 신발 비교 배지 — 두 이미지가 '비교 쌍'임을 명시(순수 장식). */}
        <CompareConnector />
        <figure className="relative shrink-0">
          <img
            ref={refImgRef}
            src={refImg.image}
            alt="신발 참조 이미지"
            onLoad={measure}
            draggable={false}
            className="block h-[260px] w-auto select-none rounded-md sm:h-[300px]"
          />
          <BoxLayer
            size={refImg.size}
            disp={disp?.ref ?? null}
            matches={matches}
            side="ref"
            selectedIndex={selectedIndex}
            onSelect={onSelect}
            onHover={onHover}
          />
        </figure>
      </div>

      {/* 범례: 박스 = 매칭 영역, 좌우 같은 번호·색이 대응. */}
      <div className="flex items-center gap-2 px-0.5 font-mono text-[9px] tracking-wide text-[#5B6B85] uppercase">
        <span
          className="flex size-3.5 items-center justify-center rounded-[3px] border-2 border-[#4A9EFF] text-[7px] font-bold text-[#4A9EFF]"
          aria-hidden="true"
        >
          1
        </span>
        <span>매칭 영역 · 좌우 같은 번호·색이 대응</span>
      </div>
    </div>
  )
}
