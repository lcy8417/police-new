import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

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

/** 유사도 값에 따른 뱃지 색(legacy high/mid/low 규칙 유지). */
function similarityBadgeClass(similarity: number | string): string {
  const value = typeof similarity === "number" ? similarity : parseFloat(similarity)
  if (Number.isNaN(value)) return "bg-[#ef4444] text-white"
  if (value >= 0.8) return "bg-[#16a34a] text-white"
  if (value >= 0.6) return "bg-[#f59e0b] text-white"
  return "bg-[#ef4444] text-white"
}

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

      {/* 헤더: 페이지 이동 입력 + 전체 건수 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#141D2C] bg-[#0D1420]/60 px-6 py-3">
        <span className="text-[15px] font-semibold text-[#E5E9F0]">검색 결과</span>

        <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums text-[#8A93A6]">
          <span>현재 페이지</span>
          <input
            type="number"
            value={inputPage}
            onChange={(e) => setInputPage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commitInputPage()}
            min={1}
            max={totalPages}
            className="w-14 rounded-md border border-[#1E2A3C] bg-[#0F1826] px-2 py-1 text-center text-[#4A9EFF] outline-none focus:border-[#3B82F6]/60"
          />
          <span>/ {totalPages}</span>
          <Button
            type="button"
            size="sm"
            onClick={commitInputPage}
            className="ml-1 h-7 border border-[#1E2A3C] bg-[#0F1826] text-[#C7CEDB] hover:border-[#3B82F6]/50 hover:bg-[#141F30] hover:text-white"
          >
            이동
          </Button>
        </div>

        <span className="font-mono text-[11px] tabular-nums text-[#8A93A6]">
          총 {totalCount}건
        </span>
      </div>

      {/* 결과 카드 그리드 */}
      <div
        ref={scrollRef}
        className="relative grid min-h-0 flex-1 auto-rows-max grid-cols-2 gap-4 overflow-y-auto p-5 sm:grid-cols-3 xl:grid-cols-5"
      >
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#05080D]/70 backdrop-blur-sm">
            <span className="font-mono text-sm tracking-wide text-[#4A9EFF]">
              신발 검색 중...
            </span>
          </div>
        )}

        {results.map((item, i) => {
          const ranking = pageSize * page + i + 1
          const clickable = Boolean(onSelect)
          return (
            <div
              key={`${item.shoesName}-${i}`}
              onClick={clickable ? () => onSelect?.(item, ranking) : undefined}
              className={cn(
                "group flex flex-col overflow-hidden rounded-xl border border-[#1E2A3C] bg-[#0F1826] transition-all",
                clickable &&
                  "cursor-pointer hover:border-[#3B82F6]/60 hover:shadow-[0_0_18px_rgba(37,99,235,0.35)]"
              )}
            >
              <div className="truncate border-b border-[#141D2C] px-3 py-2 text-sm font-semibold text-[#C7CEDB]">
                No. {item.shoesName}
              </div>
              <div className="flex flex-1 items-center justify-center overflow-hidden bg-[#05080D] p-2">
                <img
                  src={item.image}
                  alt={`신발 이미지 ${item.shoesName}`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-[#141D2C] px-3 py-2">
                <span className="font-mono text-[11px] tabular-nums text-[#8A93A6]">
                  {ranking} / {pageSize * (page + 1)}
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-[#8A93A6]">
                  유사도
                  <Badge className={similarityBadgeClass(item.similarity)}>
                    {item.similarity}
                  </Badge>
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* 페이지네이션 푸터 */}
      <div className="flex items-center justify-center gap-2 border-t border-[#141D2C] bg-[#0D1420]/60 px-6 py-3">
        <Button
          type="button"
          size="icon-sm"
          onClick={() => goToPage(page - 1)}
          disabled={page <= 0}
          aria-label="이전 페이지"
          className="border border-[#1E2A3C] bg-[#0F1826] text-[#C7CEDB] hover:border-[#3B82F6]/50 hover:bg-[#141F30] hover:text-white"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Button>
        <span className="min-w-16 text-center font-mono text-[11px] tabular-nums text-[#8A93A6]">
          {page + 1} / {totalPages}
        </span>
        <Button
          type="button"
          size="icon-sm"
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages - 1}
          aria-label="다음 페이지"
          className="border border-[#1E2A3C] bg-[#0F1826] text-[#C7CEDB] hover:border-[#3B82F6]/50 hover:bg-[#141F30] hover:text-white"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </section>
  )
}
