import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, LayoutGrid, Loader2, Radar, SearchX } from "lucide-react"

import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { TechCorners } from "@/shared/ui/tech-corners"
import { cn } from "@/shared/lib/utils"

/** 검색결과 카드 한 건. 서버 응답을 `imageSearch`가 정규화한 형태를 그대로 받는다. */
export interface RetrievalResultItem {
  /** 신발 모델 번호(= 서버의 `image` 원문). 카드 제목·상세 이동 키로 쓰인다. */
  shoesName: string
  /** 전체 경로가 붙은 신발 이미지 URL. */
  image: string
  /** 유사도(0~1). 서버가 문자열로 줄 수도 있어 number|string 모두 허용. */
  similarity: number | string
}

export interface RetrievalResultsGridProps {
  /** 현재 페이지에 표시할 결과 목록. */
  results: RetrievalResultItem[]
  /** 전체 결과 건수(페이지네이션 계산용). */
  totalCount: number
  /** 0-based 현재 페이지 인덱스. */
  page: number
  /** 페이지당 건수. 순위·전체 페이지 계산에 쓰인다. 기본 50. */
  pageSize?: number
  /** 0-based 페이지 인덱스로 페이지 이동을 요청한다. */
  onPageChange: (page: number) => void
  /**
   * 카드 클릭 콜백. `ranking`은 1-based 전체 순위(`pageSize * page + i + 1`).
   * 넘기지 않으면 카드는 비-클릭(사건이력 재사용 시)으로 렌더된다.
   */
  onSelect?: (item: RetrievalResultItem, ranking: number) => void
  /** 검색 진행 중 오버레이 표시 여부. */
  isLoading?: boolean
}

type SimilarityTier = "high" | "mid" | "low" | "unknown"

/** 유사도 값을 0~1 숫자로 정규화(파싱 실패 시 null). */
function parseSimilarity(similarity: number | string): number | null {
  const raw = typeof similarity === "number" ? similarity : parseFloat(similarity)
  if (Number.isNaN(raw)) return null
  // 서버는 퍼센트(0~100, 예: 69.99)로 준다 — 1보다 크면 0~1로 정규화해 등급/게이지에 맞춘다.
  return raw > 1 ? raw / 100 : raw
}

/** 유사도 등급(legacy high/mid/low 임계값 유지: >=0.8 / >=0.6 / 미만). */
function similarityTier(value: number | null): SimilarityTier {
  if (value === null) return "unknown"
  if (value >= 0.8) return "high"
  if (value >= 0.6) return "mid"
  return "low"
}

/** 등급별 뱃지/게이지 톤 — 커맨드센터 다크 팔레트에 맞춘 저채도 + 글로우 처리. */
const TIER_STYLES: Record<SimilarityTier, { badge: string; bar: string }> = {
  high: {
    badge: "border-[#22C55E]/50 bg-[#12241A] text-[#4ADE80] shadow-[0_0_10px_rgba(34,197,94,0.35)]",
    bar: "bg-[#4ADE80] shadow-[0_0_8px_rgba(74,222,128,0.6)]",
  },
  mid: {
    badge: "border-[#F59E0B]/50 bg-[#241C0F] text-[#FBBF24] shadow-[0_0_10px_rgba(245,158,11,0.35)]",
    bar: "bg-[#FBBF24] shadow-[0_0_8px_rgba(251,191,36,0.6)]",
  },
  low: {
    badge: "border-[#EF4444]/50 bg-[#241212] text-[#F87171] shadow-[0_0_10px_rgba(239,68,68,0.35)]",
    bar: "bg-[#F87171] shadow-[0_0_8px_rgba(248,113,113,0.6)]",
  },
  unknown: {
    badge: "border-[#1E2A3C] bg-[#0F1826] text-[#8A93A6]",
    bar: "bg-[#5B6B85]",
  },
}

const PAGINATION_BUTTON_CLASS =
  "border border-[#1E2A3C] bg-[#0F1826] text-[#C7CEDB] hover:border-[#3B82F6]/50 hover:bg-[#141F30] hover:text-white"

/**
 * 공용 검색결과 그리드(프레젠테이셔널). ShoesResult와 Phase 2 CrimeHistory가
 * 함께 재사용한다. 라우팅·페이지크기·상태를 직접 갖지 않고 모두 props로 받아,
 * 하드코딩(경로 `/search/.../shoesResult`, 페이지크기 50)을 제거했다.
 */
export function RetrievalResultsGrid({
  results,
  totalCount,
  page,
  pageSize = 50,
  onPageChange,
  onSelect,
  isLoading = false,
}: RetrievalResultsGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const [inputPage, setInputPage] = useState(String(page + 1))

  // 외부에서 페이지가 바뀌면 입력창을 동기화한다(1-based 표시).
  useEffect(() => {
    setInputPage(String(page + 1))
  }, [page])

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })
  }

  const goToPage = (next: number) => {
    const clamped = Math.max(0, Math.min(next, totalPages - 1))
    scrollToTop()
    onPageChange(clamped)
  }

  const commitInputPage = () => {
    const parsed = parseInt(inputPage, 10)
    const target = Number.isNaN(parsed) ? 1 : parsed
    // 입력은 1-based, 내부는 0-based.
    goToPage(target - 1)
  }

  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
      <TechCorners size={22} />

      {/* 헤더: 섹션 라벨 + 전체 건수 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#141D2C] bg-[#0D1420]/60 px-6 py-3.5">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold text-[#E5E9F0]">검색 결과</span>
          <span className="rounded-full border border-[#1E2A3C] bg-[#0F1826] px-2 py-0.5 font-mono text-[10px] tracking-wide text-[#8A93A6] uppercase">
            Page Size {pageSize}
          </span>
        </div>
        <span className="flex items-center gap-1.5 font-mono text-[11px] tabular-nums text-[#8A93A6]">
          <LayoutGrid className="size-3.5 text-[#4A9EFF]" aria-hidden="true" />총 {totalCount}건
        </span>
      </div>

      {/* 결과 카드 그리드 */}
      <div
        ref={scrollRef}
        className="relative grid min-h-0 flex-1 auto-rows-max grid-cols-2 gap-3 overflow-y-auto p-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
      >
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-[#05080D]/85 backdrop-blur-md">
            <div className="relative flex size-24 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4A9EFF]/20" />
              <span className="absolute inline-flex size-20 rounded-full border border-[#4A9EFF]/20" />
              <Radar className="absolute size-[88px] text-[#4A9EFF]/25" aria-hidden="true" />
              <Loader2 className="size-9 animate-spin text-[#4A9EFF]" aria-hidden="true" />
            </div>
            <span className="font-mono text-[15px] tracking-[0.2em] text-[#4A9EFF] uppercase">
              신발 검색 중
            </span>
            <span className="font-mono text-[12px] tracking-wide text-[#5B6B85]">
              DB 매칭 분석 진행 중...
            </span>
          </div>
        )}

        {!isLoading && results.length === 0 && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-[#5B6B85]">
            <SearchX className="size-14" aria-hidden="true" />
            <span className="text-[16px] font-semibold text-[#8A93A6]">
              검색 결과가 없습니다
            </span>
            <span className="font-mono text-[12px] tracking-wide text-[#5B6B85]">
              필수 문양을 조정해 다시 검색해 보세요
            </span>
          </div>
        )}

        {results.map((item, i) => {
          const ranking = pageSize * page + i + 1
          const clickable = Boolean(onSelect)
          const value = parseSimilarity(item.similarity)
          const tier = similarityTier(value)
          const tierStyle = TIER_STYLES[tier]
          const pct = value !== null ? Math.round(Math.max(0, Math.min(1, value)) * 100) : null

          return (
            <div
              key={`${item.shoesName}-${i}`}
              onClick={clickable ? () => onSelect?.(item, ranking) : undefined}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-xl border border-[#1E2A3C] bg-[#0F1826] transition-all",
                clickable &&
                  "cursor-pointer hover:border-[#3B82F6]/60 hover:shadow-[0_0_18px_rgba(37,99,235,0.35)]"
              )}
            >
              <TechCorners
                size={14}
                className={cn(
                  "opacity-0 transition-opacity",
                  clickable && "group-hover:opacity-100"
                )}
              />

              {/* 전체 순위 뱃지(좌) + 상위 3위 강조(우) */}
              <span className="absolute top-2 left-2 z-10 rounded-md border border-[#1E2A3C] bg-[#05080D]/85 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-[#8A93A6] backdrop-blur-sm">
                #{ranking}
              </span>
              {ranking <= 3 && (
                <span className="absolute top-2 right-2 z-10 rounded-md border border-[#3B82F6]/50 bg-[#152238]/90 px-1.5 py-0.5 font-mono text-[9px] tracking-[0.08em] text-[#4A9EFF] shadow-[0_0_10px_rgba(37,99,235,0.4)] backdrop-blur-sm">
                  TOP {ranking}
                </span>
              )}

              {/* 신발 이미지는 세로형이라 카드도 세로로 길게(2:3) — 이미지가 카드를 꽉 채우게 여백 축소. */}
              <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#05080D]">
                <img
                  src={item.image}
                  alt={`신발 이미지 ${item.shoesName}`}
                  className="absolute inset-0 size-full object-contain p-1.5"
                />
              </div>

              <div className="flex flex-col gap-1.5 border-t border-[#141D2C] px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-semibold text-[#C7CEDB]">
                    No. {item.shoesName}
                  </span>
                  <Badge className={cn("border font-mono text-[10px] tabular-nums", tierStyle.badge)}>
                    {pct !== null ? `${pct}%` : item.similarity}
                  </Badge>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-[#05080D]">
                  <div
                    className={cn("h-full rounded-full transition-all", tierStyle.bar)}
                    style={{ width: `${pct ?? 0}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 페이지네이션 푸터: 이전 · 직접입력 · 다음을 한 줄로 통일 */}
      <div className="flex items-center justify-center gap-3 border-t border-[#141D2C] bg-[#0D1420]/60 px-6 py-3">
        <Button
          type="button"
          size="icon-sm"
          onClick={() => goToPage(page - 1)}
          disabled={page <= 0}
          aria-label="이전 페이지"
          className={PAGINATION_BUTTON_CLASS}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Button>

        <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums text-[#8A93A6]">
          <input
            type="number"
            value={inputPage}
            onChange={(e) => setInputPage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commitInputPage()}
            onBlur={commitInputPage}
            min={1}
            max={totalPages}
            aria-label="이동할 페이지"
            className="w-14 rounded-md border border-[#1E2A3C] bg-[#0F1826] px-2 py-1 text-center text-[#4A9EFF] outline-none focus:border-[#3B82F6]/60"
          />
          <span>/ {totalPages}</span>
        </div>

        <Button
          type="button"
          size="icon-sm"
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages - 1}
          aria-label="다음 페이지"
          className={PAGINATION_BUTTON_CLASS}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </section>
  )
}
