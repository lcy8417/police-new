import { useState } from "react"
import { ImageOff, Loader2, Radar, SearchX } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import type { SimilarityResponse } from "../model/similarity"
import { CorrespondenceMap } from "./CorrespondenceMap"
import { CrossZoomRows } from "./CrossZoomRows"

export interface MatchViewerProps {
  /** 강화 `/similarity` 응답(query/ref/matches 또는 구버전 attn_map). */
  data?: SimilarityResponse
  /** 유사도 쿼리 진행 중 — 스피너로 대기. */
  loading?: boolean
  /** 폴백용 족적(질의) 이미지(matches 없을 때 원본 표시). */
  fallbackQuery?: string | null
  /** 폴백용 신발(참조) 이미지. */
  fallbackRef?: string | null
  className?: string
}

/** 스피너(유사도 분석 대기) — 하위 존카드와 같은 톤으로 대기시킨다. */
function LoadingState() {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border border-[#1E2A3C] bg-[#0D1420]/40 text-[#5B6B85]">
      <Loader2 className="size-7 animate-spin text-[#4A9EFF]" aria-hidden="true" />
      <span className="text-[12px] font-medium">국소 대응 분석 중…</span>
    </div>
  )
}

/** 폴백 이미지 한 장(구버전 히트맵 또는 원본). 문양 셀과 같은 leaf 톤(bg-[#0F1826]). */
function FallbackTile({ label, image }: { label: string; image?: string | null }) {
  return (
    <figure className="flex flex-1 flex-col gap-1.5 rounded-lg border border-[#1E2A3C] bg-[#0F1826] p-2.5">
      <figcaption className="font-mono text-[10px] tracking-[0.12em] text-[#8A93A6] uppercase">
        {label}
      </figcaption>
      <div className="relative flex min-h-[160px] flex-1 items-center justify-center overflow-hidden rounded-md border border-[#1E2A3C] bg-[#05080D]">
        {image ? (
          <img src={image} alt={label} className="mx-auto block max-h-[300px] w-auto object-contain p-2" />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-[#5B6B85]">
            <ImageOff className="size-6" aria-hidden="true" />
            <span className="text-[11px] font-medium">이미지 없음</span>
          </div>
        )}
      </div>
    </figure>
  )
}

/**
 * 컴팩트 Sheet의 "유사부위 대응" 섹션 — 아래 "문양 비교" 섹션과 **같은 카드 시스템**으로
 * 통일했다: rounded-2xl 섹션 셸(bg-[#0B121D]) + 헤더바(bg-[#0D1420]/60) 안에, 하위
 * 존카드(bg-[#0D1420]/40)로 화면 A(대응 지도)·화면 B(크로스 줌)를 담는다. 선택 index를
 * 두 화면이 공유해 핀↔카드를 양방향으로 강조·스크롤한다.
 *
 * 폴백 3단:
 *  1) 로딩 중 → 스피너.
 *  2) `matches`가 있으면 → A + B 대응 뷰어.
 *  3) `matches`가 없고 구버전 attn_map만 있으면 → 히트맵 쌍(질의/참조).
 *  4) 아무것도 없으면 → "대응 부위를 찾지 못했습니다" + 원본 족적/신발(폴백 이미지).
 */
export function MatchViewer({ data, loading = false, fallbackQuery, fallbackRef, className }: MatchViewerProps) {
  // 강조 상태는 두 축: 클릭으로 고정하는 locked, hover로 임시 강조하는 hovered.
  // 실효 강조 = hovered ?? locked → hover가 우선하되 손을 떼면 마지막 클릭으로 복귀,
  // 클릭 없이 훑을 때도 A↔B가 함께 밝아진다. 두 화면이 이 핸들러를 공유해 양방향 동기.
  const [locked, setLocked] = useState<number | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const activeIndex = hovered ?? locked

  const handleSelect = (index: number) =>
    setLocked((prev) => (prev === index ? null : index))
  const handleHover = (index: number | null) => setHovered(index)

  const matches = data?.matches ?? []
  const hasCorrespondence = Boolean(data?.query && data?.ref && matches.length > 0)
  const hasAttnFallback = Boolean(data?.query_attn_map || data?.ref_attn_map)

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D]",
        className
      )}
    >
      {/* 섹션 헤더바 — 아래 "문양 비교" 섹션과 동일한 시각 언어(아이콘 + 제목 + mono 코드). */}
      <div className="flex items-center gap-2 border-b border-[#141D2C] bg-[#0D1420]/60 px-4 py-2.5">
        <Radar className="size-4 text-[#4A9EFF]" aria-hidden="true" />
        <span className="text-[13px] font-semibold text-[#E5E9F0]">유사부위 대응</span>
        <span className="ml-auto font-mono text-[10px] tracking-[0.14em] text-[#5B6B85] uppercase">
          Correspondence
        </span>
      </div>

      {/* 본문 — "문양 비교"의 PatternGroups와 같은 p-4 여백 안에 하위 존카드를 담는다. */}
      <div className="p-4">
        {loading ? (
          <LoadingState />
        ) : hasCorrespondence && data?.query && data?.ref ? (
          // A(대응 지도)+B(크로스 줌)를 한 묶음으로. 넓으면 A=왼쪽·B=오른쪽 그리드,
          // 좁으면 세로로 접힌다(컨테이너 폭 기준 — 뷰포트가 아니라 Sheet 본문 폭에 반응).
          // items-stretch: B(크로스 줌)의 세로 높이를 A(대응 지도)에 맞춰 정렬한다.
          <div className="@container">
            <div className="grid items-stretch gap-3 @[820px]:grid-cols-[auto_minmax(0,1fr)]">
              <CorrespondenceMap
                query={data.query}
                ref={data.ref}
                matches={matches}
                selectedIndex={activeIndex}
                onSelect={handleSelect}
                onHover={handleHover}
              />
              <CrossZoomRows
                matches={matches}
                selectedIndex={activeIndex}
                onSelect={handleSelect}
                onHover={handleHover}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 rounded-xl border border-[#1E2A3C] bg-[#0D1420]/40 p-3.5">
            {/* 대응을 못 찾음 — 안내 + 원본(또는 구버전 히트맵) 표시로 회귀 안전. */}
            <div className="flex items-center gap-2 rounded-lg border border-[#1E2A3C] bg-[#0F1826] px-3 py-2 text-[#8A93A6]">
              <SearchX className="size-4 shrink-0 text-[#5B6B85]" aria-hidden="true" />
              <span className="text-[12px] font-medium">
                대응 부위를 찾지 못했습니다 — 원본 이미지를 표시합니다.
              </span>
            </div>
            <div className="flex items-stretch gap-2.5">
              <FallbackTile
                label={hasAttnFallback ? "질의 어텐션" : "족적 · 질의"}
                image={data?.query_attn_map || data?.query?.image || fallbackQuery}
              />
              <FallbackTile
                label={hasAttnFallback ? "참조 어텐션" : "신발 · 참조"}
                image={data?.ref_attn_map || data?.ref?.image || fallbackRef}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
