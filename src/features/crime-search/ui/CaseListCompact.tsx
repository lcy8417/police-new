import { Building2, Clock, Eye } from "lucide-react"

import { cn } from "@/shared/lib/utils"

import type { CrimeSearchRow } from "../model/case-row"

export interface CaseListCompactProps {
  /** 필터가 적용된 전체 사건 행. 전체를 스크롤 영역에 노출한다(페이저 없음). */
  rows: CrimeSearchRow[]
  /** 현재 열려 있는 사건번호(좌측 teal 액센트바로 강조). */
  currentCrimeNumber: string
  /** 카드 좌측 정보 영역 클릭 시 해당 사건번호로 전환을 요청한다. */
  onSelect: (crimeNumber: string) => void
  /** 카드 우측 "상세 보기" 버튼 클릭 시 해당 사건의 상세 시트 열기를 요청한다. */
  onOpenDetail: (crimeNumber: string) => void
}

/**
 * 사건 세로 카드 목록(프레젠테이셔널, teal 소스 톤). 카드 1건 = 좌측 정보 영역
 * (사건번호 mono 강조 + 사건명 + 의뢰관서·채취일시 요약, 클릭=전환) + 우측
 * "상세 보기" 버튼(클릭=상세 시트). 두 액션은 형제 버튼으로 분리해 버튼 중첩을
 * 피한다. 현재 열린 사건은 좌측 teal 액센트바로 강조한다. 필터된 전체를 스크롤로
 * 노출하며(페이저 없음), 열의 남는 세로를 전부 차지한다.
 */
export function CaseListCompact({
  rows,
  currentCrimeNumber,
  onSelect,
  onOpenDetail,
}: CaseListCompactProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5">
        {rows.length === 0 ? (
          <div className="flex h-full items-center justify-center px-3 py-10 text-center text-[13px] text-[#5B6B85]">
            조회된 사건이 없습니다.
          </div>
        ) : (
          rows.map((row, rowIndex) => {
            const crimeNumber = String(row.crimeNumber ?? "")
            const isCurrent = crimeNumber === String(currentCrimeNumber)
            return (
              <div
                key={`${crimeNumber}-${rowIndex}`}
                className={cn(
                  "relative flex items-center justify-between gap-2 overflow-hidden rounded-lg border px-3 py-2.5 transition-colors",
                  isCurrent
                    ? "border-[#2DD4BF]/50 bg-[#0F2624]/60"
                    : "border-[#183430] bg-[#0C1917]/60 hover:border-[#2DD4BF]/40 hover:bg-[#102523]"
                )}
              >
                {/* 현재 사건 좌측 teal 액센트바 */}
                {isCurrent && (
                  <span
                    className="absolute inset-y-0 left-0 w-[3px] bg-[#2DD4BF]"
                    aria-hidden="true"
                  />
                )}
                <button
                  type="button"
                  onClick={() => onSelect(crimeNumber)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block font-mono text-[13px] font-semibold tracking-wide text-[#5FE0D0]">
                    {crimeNumber || "-"}
                  </span>
                  <span className="mt-0.5 block truncate text-[13px] font-medium text-[#C7CEDB]">
                    {row.crimeName ?? "-"}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-[#8A93A6]">
                    <span className="flex items-center gap-1">
                      <Building2 className="size-3 text-[#5B6B85]" aria-hidden="true" />
                      {row.requestOffice ?? "-"}
                    </span>
                    <span className="flex items-center gap-1 font-mono tabular-nums">
                      <Clock className="size-3 text-[#5B6B85]" aria-hidden="true" />
                      {row.findTime ?? "-"}
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenDetail(crimeNumber)}
                  aria-label={`사건 ${crimeNumber} 상세 보기`}
                  className="inline-flex shrink-0 items-center gap-1 self-start rounded-md border border-[#183430] bg-[#0C1917]/80 px-2 py-1 text-[11px] font-medium text-[#8A93A6] transition-colors hover:border-[#2DD4BF]/50 hover:text-[#5FE0D0]"
                >
                  <Eye className="size-3.5" aria-hidden="true" />
                  상세 보기
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* 전체 건수 표시(페이저 없이 전체 스크롤) */}
      <div className="flex shrink-0 items-center justify-end pt-1">
        <span className="font-mono text-[11px] tabular-nums text-[#5B6B85]">
          전체 {rows.length}건
        </span>
      </div>
    </div>
  )
}
