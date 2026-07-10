import { ChevronLeft, ChevronRight, Eye } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { TechCorners } from "@/shared/ui/tech-corners"
import { cn } from "@/shared/lib/utils"

/**
 * 사건 목록 테이블에 투영되는 행 형태(`Crime`의 표시 컬럼 부분집합). 모든
 * 필드는 서버 응답에 따라 비어 있을 수 있어 optional로 둔다. 페이지가
 * `Crime` → `CrimeSearchRow`로 투영(`toRow`)해 넘긴다.
 */
export interface CrimeSearchRow {
  crimeNumber?: string
  imageNumber?: string
  crimeName?: string
  findTime?: string
  requestOffice?: string
  findMethod?: string
}

/** 테이블 컬럼 정의(라벨 + 행 접근 키). 액션 컬럼은 별도로 렌더한다. */
const COLUMNS: { key: keyof CrimeSearchRow; label: string }[] = [
  { key: "crimeNumber", label: "사건등록번호" },
  { key: "imageNumber", label: "이미지번호" },
  { key: "crimeName", label: "사건명" },
  { key: "findTime", label: "채취일시" },
  { key: "requestOffice", label: "의뢰관서" },
  { key: "findMethod", label: "채취방법" },
]

export interface SearchResultsProps {
  /** 현재 페이지에 표시할 행(필터 → 페이지 slice 이후). */
  rows: CrimeSearchRow[]
  /** 필터 적용 후 전체 건수(페이지네이션 · "전체 N건" 표시용). */
  totalCount: number
  /** 0-based 현재 페이지 인덱스. */
  page: number
  /** 페이지당 건수. */
  pageSize: number
  /** "N개씩 보기" 셀렉트 옵션(기본 10/20/50). */
  pageSizeOptions?: number[]
  /** 0-based 페이지 인덱스로 페이지 이동을 요청한다. */
  onPageChange: (page: number) => void
  /** 페이지당 건수 변경을 요청한다. */
  onPageSizeChange: (size: number) => void
  /** 행(또는 눈 아이콘) 클릭 시 해당 사건등록번호로 이동을 요청한다. */
  onRowClick: (crimeNumber: string) => void
}

/**
 * 페이지네이션 번호 배열을 만든다: `< 1 2 3 4 5 … 마지막 >` 형태로,
 * 현재 페이지 주변 창(window)만 노출하고 나머지는 생략 기호로 접는다.
 * 반환값은 0-based 페이지 인덱스이거나 생략 표시("ellipsis")다.
 */
function getPageItems(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i)
  }
  const items: (number | "ellipsis")[] = [0]
  const start = Math.max(1, current - 1)
  const end = Math.min(total - 2, current + 1)

  if (start > 1) items.push("ellipsis")
  for (let i = start; i <= end; i++) items.push(i)
  if (end < total - 2) items.push("ellipsis")

  items.push(total - 1)
  return items
}

const PAGINATION_BUTTON_CLASS =
  "border border-[#1E2A3C] bg-[#0F1826] text-[#C7CEDB] hover:border-[#3B82F6]/50 hover:bg-[#141F30] hover:text-white"

/**
 * 사건 목록 카드(프레젠테이셔널). 다크 커맨드센터 테이블 + 하단 푸터
 * (전체 건수 · N개씩 보기 셀렉트 · 페이지네이션)로 구성된다. 필터/페이지
 * 상태는 모두 `CrimeSearchPage`가 소유하고, 이 컴포넌트는 표시와 이벤트
 * 위임만 담당한다.
 */
export function SearchResults({
  rows,
  totalCount,
  page,
  pageSize,
  pageSizeOptions = [10, 20, 50],
  onPageChange,
  onPageSizeChange,
  onRowClick,
}: SearchResultsProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const pageItems = getPageItems(page, totalPages)

  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
      <TechCorners size={22} />

      {/* 헤더 */}
      <div className="flex items-center justify-between gap-3 border-b border-[#141D2C] bg-[#0D1420]/60 px-6 py-3.5">
        <span className="text-[15px] font-semibold text-[#E5E9F0]">사건 목록</span>
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
              <th className="border-b border-[#1E2A3C] px-4 py-3 text-center font-medium whitespace-nowrap text-[#8A93A6]">
                보기
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMNS.length + 1}
                  className="px-4 py-16 text-center text-[13px] text-[#5B6B85]"
                >
                  조회된 사건이 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => {
                const crimeNumber = String(row.crimeNumber ?? "")
                return (
                  <tr
                    key={`${crimeNumber}-${rowIndex}`}
                    onClick={() => onRowClick(crimeNumber)}
                    className="cursor-pointer border-b border-[#141D2C] transition-colors hover:bg-[#111C2C]"
                  >
                    {COLUMNS.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4 py-3 whitespace-nowrap",
                          col.key === "crimeNumber"
                            ? "font-medium text-[#4A9EFF]"
                            : "text-[#C7CEDB]"
                        )}
                      >
                        {row[col.key] ?? "-"}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRowClick(crimeNumber)
                        }}
                        aria-label={`사건 ${crimeNumber} 상세 보기`}
                        className="inline-flex size-7 items-center justify-center rounded-md border border-[#1E2A3C] bg-[#0F1826] text-[#8A93A6] transition-colors hover:border-[#3B82F6]/50 hover:text-[#4A9EFF]"
                      >
                        <Eye className="size-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 푸터: 전체 건수 · N개씩 보기 · 페이지네이션 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#141D2C] bg-[#0D1420]/60 px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[12px] tabular-nums text-[#8A93A6]">
            전체 {totalCount}건
          </span>
          <label className="flex items-center gap-1.5 text-[12px] text-[#8A93A6]">
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="페이지당 표시 건수"
              className="rounded-md border border-[#1E2A3C] bg-[#0F1826] px-2 py-1 text-[12px] text-[#C7CEDB] outline-none focus:border-[#3B82F6]/60"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}개씩 보기
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center gap-1.5">
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

          {pageItems.map((item, i) =>
            item === "ellipsis" ? (
              <span
                key={`ellipsis-${i}`}
                className="px-1.5 font-mono text-[12px] text-[#5B6B85]"
              >
                …
              </span>
            ) : (
              <Button
                key={item}
                type="button"
                size="icon-sm"
                onClick={() => onPageChange(item)}
                aria-label={`${item + 1}페이지`}
                aria-current={item === page ? "page" : undefined}
                className={cn(
                  "font-mono tabular-nums",
                  item === page
                    ? "border border-[#3B82F6]/60 bg-[#152238] text-[#4A9EFF] shadow-[0_0_14px_rgba(37,99,235,0.3)]"
                    : PAGINATION_BUTTON_CLASS
                )}
              >
                {item + 1}
              </Button>
            )
          )}

          <Button
            type="button"
            size="icon-sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
            aria-label="다음 페이지"
            className={PAGINATION_BUTTON_CLASS}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  )
}
