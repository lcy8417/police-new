import { useState } from "react"
import { ChevronLeft, ChevronRight, Footprints, Loader2 } from "lucide-react"

import type { Shoe } from "@/entities/shoe"
import { Button } from "@/shared/ui/button"
import { TechCorners } from "@/shared/ui/tech-corners"
import { cn } from "@/shared/lib/utils"

export interface ShoeListProps {
  /** 전체 신발 목록(모든 페이지를 집계한 배열). 페이지네이션은 이 컴포넌트가 내부에서 한다. */
  shoes: Shoe[]
  selectedModelNumber: string
  isLoading: boolean
  /** 행 클릭 — 선택(편집 진입) 또는 이미 선택된 행이면 정보 Sheet 열기(페이지가 판단). */
  onSelect: (modelNumber: string) => void
  /** 한 페이지에 보여줄 행 수. */
  pageSize?: number
}

/** 테이블 컬럼 정의(레거시 `SearchResults.jsx:41` 신발 매핑과 동일한 5열). */
const COLUMNS: { key: keyof Shoe; label: string }[] = [
  { key: "modelNumber", label: "모델번호" },
  { key: "findLocation", label: "수집장소" },
  { key: "manufacturer", label: "제조사" },
  { key: "findYear", label: "수집년도" },
  { key: "emblem", label: "상표명" },
]

const PAGINATION_BUTTON_CLASS =
  "border border-[#1E2A3C] bg-[#0F1826] text-[#C7CEDB] hover:border-[#3B82F6]/50 hover:bg-[#141F30] hover:text-white"

/** 현재 페이지 기준 최대 5개 페이지 번호 윈도우(총 페이지 내로 clamp). */
const PAGE_WINDOW = 5

/**
 * 신발 목록 카드(프레젠테이셔널). 전체 신발을 받아 내부에서 클라이언트 페이지네이션
 * 한다. 헤더에 전체 건수를 표시하고, 하단은 [이전][최대 5개 페이지 번호][다음].
 * 행 클릭은 `onSelect`(선택된 행 재클릭 시 페이지가 정보 Sheet를 연다).
 */
export function ShoeList({
  shoes,
  selectedModelNumber,
  isLoading,
  onSelect,
  pageSize = 12,
}: ShoeListProps) {
  const [page, setPage] = useState(0)

  const total = shoes.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  // 목록이 줄어들어도 안전하도록 현재 페이지를 총 페이지 내로 clamp한다.
  const safePage = Math.min(page, totalPages - 1)
  const pageShoes = shoes.slice(safePage * pageSize, safePage * pageSize + pageSize)

  const windowStart = Math.max(0, Math.min(safePage - 2, totalPages - PAGE_WINDOW))
  const pageNumbers = Array.from(
    { length: Math.min(PAGE_WINDOW, totalPages) },
    (_, i) => Math.max(0, windowStart) + i
  )

  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
      <TechCorners size={22} />

      {/* 헤더 — 전체 신발 건수를 표시한다. */}
      <div className="flex items-center justify-between gap-3 border-b border-[#141D2C] bg-[#0D1420]/60 px-6 py-3.5">
        <span className="text-[15px] font-semibold text-[#E5E9F0]">신발 목록</span>
        <span className="rounded-md border border-[#3B82F6]/40 bg-[#152238] px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-[#4A9EFF]">
          {isLoading ? "…" : `${total}건`}
        </span>
      </div>

      {/* 테이블 */}
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#0D1420]">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="border-b border-[#1E2A3C] px-4 py-3 font-medium whitespace-nowrap text-[#8A93A6]"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-[#5B6B85]">
                    <Loader2 className="size-7 animate-spin text-[#4A9EFF]" aria-hidden="true" />
                    <span className="text-[13px] font-medium">신발 목록을 불러오는 중...</span>
                  </div>
                </td>
              </tr>
            ) : pageShoes.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-[#5B6B85]">
                    <Footprints className="size-7" aria-hidden="true" />
                    <span className="text-[13px] font-medium">등록된 신발이 없습니다.</span>
                  </div>
                </td>
              </tr>
            ) : (
              pageShoes.map((shoe, rowIndex) => {
                const modelNumber = String(shoe.modelNumber ?? "")
                const isSelected =
                  selectedModelNumber !== "" && modelNumber === String(selectedModelNumber)
                return (
                  <tr
                    key={`${modelNumber}-${rowIndex}`}
                    onClick={() => onSelect(modelNumber)}
                    title={isSelected ? "한 번 더 클릭하면 기본 정보 편집" : undefined}
                    className={cn(
                      "cursor-pointer border-b border-[#141D2C] transition-colors",
                      isSelected
                        ? "bg-[#152238]/60 shadow-[inset_2px_0_0_0_rgba(74,158,255,0.9)]"
                        : "hover:bg-[#141F30] hover:shadow-[inset_2px_0_0_0_rgba(59,130,246,0.6)]"
                    )}
                  >
                    {COLUMNS.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4 py-3 whitespace-nowrap",
                          col.key === "modelNumber"
                            ? isSelected
                              ? "font-semibold text-[#4A9EFF]"
                              : "font-medium text-[#4A9EFF]"
                            : isSelected
                              ? "text-[#E5E9F0]"
                              : "text-[#C7CEDB]"
                        )}
                      >
                        {shoe[col.key] === null ||
                        shoe[col.key] === undefined ||
                        shoe[col.key] === ""
                          ? "-"
                          : String(shoe[col.key])}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 푸터: [이전] [최대 5개 페이지 번호] [다음] + 현재/총 페이지 */}
      <div className="flex items-center justify-center gap-1.5 border-t border-[#141D2C] bg-[#0D1420]/60 px-6 py-3">
        <Button
          type="button"
          size="icon-sm"
          onClick={() => setPage(safePage - 1)}
          disabled={safePage <= 0}
          aria-label="이전 페이지"
          className={PAGINATION_BUTTON_CLASS}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Button>

        {pageNumbers.map((p) =>
          p === safePage ? (
            <span
              key={p}
              aria-current="page"
              className="inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-[#3B82F6]/60 bg-[#152238] px-3 font-mono text-[12px] font-semibold tabular-nums text-[#4A9EFF] shadow-[0_0_14px_rgba(37,99,235,0.3)]"
            >
              {p + 1}
            </span>
          ) : (
            <Button
              key={p}
              type="button"
              size="icon-sm"
              onClick={() => setPage(p)}
              aria-label={`${p + 1} 페이지`}
              className={cn(PAGINATION_BUTTON_CLASS, "min-w-8 px-2 font-mono tabular-nums")}
            >
              {p + 1}
            </Button>
          )
        )}

        <Button
          type="button"
          size="icon-sm"
          onClick={() => setPage(safePage + 1)}
          disabled={safePage >= totalPages - 1}
          aria-label="다음 페이지"
          className={PAGINATION_BUTTON_CLASS}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </section>
  )
}
