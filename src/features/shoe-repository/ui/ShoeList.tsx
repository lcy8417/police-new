import { ChevronLeft, ChevronRight, Footprints, Loader2 } from "lucide-react"

import type { Shoe } from "@/entities/shoe"
import { Button } from "@/shared/ui/button"
import { TechCorners } from "@/shared/ui/tech-corners"
import { cn } from "@/shared/lib/utils"

export interface ShoeListProps {
  /** 현재 페이지의 신발(서버 페이징 — 페이지당 최대 50). */
  shoes: Shoe[]
  /** 전체 신발 건수(count 엔드포인트). 헤더 배지에 표시한다. */
  total: number
  /** 0-base 현재 페이지. */
  page: number
  /** 전체 페이지 수(ceil(total / 서버 페이지 크기)). */
  totalPages: number
  /** 현재 선택된 신발 ID(URL `:ftwrId`, 앞자리 0 보존 문자열). 미선택이면 `""`. */
  selectedFtwrId: string
  isLoading: boolean
  /** 행 클릭 — 선택(편집 진입) 또는 이미 선택된 행이면 정보 Sheet 열기(페이지가 판단). */
  onSelect: (ftwrId: string) => void
  /** 페이지 이동 — 서버 재조회는 상위(페이지)가 담당한다. */
  onPageChange: (page: number) => void
}

type ShoeColumnKey =
  | "ftwrId"
  | "modlNm"
  | "ftwrGroupNm"
  | "brandCode"
  | "makrCode"
  | "colctPlace"
  | "colctYear"

/**
 * 테이블 컬럼 정의(설계서 §4-2 SCAS 신발 필드 7열). 공통코드표가 비어 있어 상표·제조사는
 * 코드값 그대로 보이고, 사람이 읽는 상표 이름은 그룹명(`ftwrGroupNm`)이 대신한다.
 */
const COLUMNS: { key: ShoeColumnKey; label: string }[] = [
  { key: "ftwrId", label: "신발ID" },
  { key: "modlNm", label: "모델명" },
  { key: "ftwrGroupNm", label: "그룹(상표)" },
  { key: "brandCode", label: "상표코드" },
  { key: "makrCode", label: "제조사코드" },
  { key: "colctPlace", label: "수집처" },
  { key: "colctYear", label: "수집연도" },
]

const PAGINATION_BUTTON_CLASS =
  "border border-[#1E2A3C] bg-[#0F1826] text-[#C7CEDB] hover:border-[#3B82F6]/50 hover:bg-[#141F30] hover:text-white"

/** 현재 페이지 기준 최대 5개 페이지 번호 윈도우(총 페이지 내로 clamp). */
const PAGE_WINDOW = 5

/**
 * 신발 목록 카드(프레젠테이셔널). 현재 페이지의 신발만 받아 그대로 표시하고,
 * 페이지 이동은 `onPageChange`로 상위에 위임한다(서버 페이징 — 페이지마다 재조회).
 * 헤더에 전체 건수(`total`)를 표시하고, 하단은 [이전][최대 5개 페이지 번호][다음].
 * 행 클릭은 `onSelect`(선택된 행 재클릭 시 페이지가 정보 Sheet를 연다).
 */
export function ShoeList({
  shoes,
  total,
  page,
  totalPages,
  selectedFtwrId,
  isLoading,
  onSelect,
  onPageChange,
}: ShoeListProps) {
  const windowStart = Math.max(0, Math.min(page - 2, totalPages - PAGE_WINDOW))
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
                // 신발 ID는 문자열 그대로 쓴다(앞자리 0 보존 — 숫자 변환 금지).
                const ftwrId = shoe.ftwrId ?? ""
                const isSelected = selectedFtwrId !== "" && ftwrId === selectedFtwrId
                return (
                  <tr
                    key={`${ftwrId}-${rowIndex}`}
                    onClick={() => onSelect(ftwrId)}
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
                          col.key === "ftwrId"
                            ? isSelected
                              ? "font-semibold text-[#4A9EFF]"
                              : "font-medium text-[#4A9EFF]"
                            : isSelected
                              ? "text-[#E5E9F0]"
                              : "text-[#C7CEDB]"
                        )}
                      >
                        {/* SCAS의 비어 있는(NULL) 메타데이터는 빈 칸으로 둔다. */}
                        {shoe[col.key] ?? ""}
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
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 0}
          aria-label="이전 페이지"
          className={PAGINATION_BUTTON_CLASS}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Button>

        {pageNumbers.map((p) =>
          p === page ? (
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
              onClick={() => onPageChange(p)}
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
          onClick={() => onPageChange(page + 1)}
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
