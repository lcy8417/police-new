import { ChevronLeft, ChevronRight, Footprints, Loader2 } from "lucide-react"

import type { Shoe } from "@/entities/shoe"
import { Button } from "@/shared/ui/button"
import { TechCorners } from "@/shared/ui/tech-corners"
import { cn } from "@/shared/lib/utils"

export interface ShoeListProps {
  shoes: Shoe[]
  selectedModelNumber: string
  page: number
  isLoading: boolean
  onSelect: (modelNumber: string) => void
  onEdit: (modelNumber: string) => void
  onPageChange: (page: number) => void
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

/**
 * 신발 목록 카드(프레젠테이셔널). 다크 커맨드센터 테이블 + 하단
 * [이전][현재 page][다음] 페이지네이션 푸터로 구성된다. 행 단일클릭은
 * `onSelect`(선택 갱신), 더블클릭은 `onEdit`(편집 이동)으로 분리한다
 * — 레거시 `SearchResults.jsx`의 `tableClick`/`doubleClick` 분리와 동일한 계약.
 */
export function ShoeList({
  shoes,
  selectedModelNumber,
  page,
  isLoading,
  onSelect,
  onEdit,
  onPageChange,
}: ShoeListProps) {
  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
      <TechCorners size={22} />

      {/* 헤더 */}
      <div className="flex items-center justify-between gap-3 border-b border-[#141D2C] bg-[#0D1420]/60 px-6 py-3.5">
        <span className="text-[15px] font-semibold text-[#E5E9F0]">신발 목록</span>
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
            ) : shoes.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-[#5B6B85]">
                    <Footprints className="size-7" aria-hidden="true" />
                    <span className="text-[13px] font-medium">등록된 신발이 없습니다.</span>
                  </div>
                </td>
              </tr>
            ) : (
              shoes.map((shoe, rowIndex) => {
                const modelNumber = String(shoe.modelNumber ?? "")
                const isSelected =
                  selectedModelNumber !== "" && modelNumber === String(selectedModelNumber)
                return (
                  <tr
                    key={`${modelNumber}-${rowIndex}`}
                    onClick={() => onSelect(modelNumber)}
                    onDoubleClick={() => onEdit(modelNumber)}
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

      {/* 푸터: [이전][현재 page][다음] */}
      <div className="flex items-center justify-center gap-1.5 border-t border-[#141D2C] bg-[#0D1420]/60 px-6 py-3">
        <Button
          type="button"
          size="icon-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 0}
          aria-label="이전 페이지"
          className={PAGINATION_BUTTON_CLASS}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Button>

        <span
          aria-current="page"
          className="inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-[#3B82F6]/60 bg-[#152238] px-3 font-mono text-[12px] font-semibold tabular-nums text-[#4A9EFF] shadow-[0_0_14px_rgba(37,99,235,0.3)]"
        >
          {page + 1}
        </span>

        <Button
          type="button"
          size="icon-sm"
          onClick={() => onPageChange(page + 1)}
          aria-label="다음 페이지"
          className={PAGINATION_BUTTON_CLASS}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </section>
  )
}
