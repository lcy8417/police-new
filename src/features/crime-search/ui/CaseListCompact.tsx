import { Building2, Clock, Eye } from "lucide-react"

import { cn } from "@/shared/lib/utils"

import type { CrimeSearchRow } from "../model/case-row"

export interface CaseListCompactProps {
  /** 필터가 적용된 전체 사건 행. 전체를 스크롤 영역에 노출한다(페이저 없음). */
  rows: CrimeSearchRow[]
  /** 현재 열려 있는 감정물 번호(좌측 teal 액센트바로 강조). */
  currentAprthngNo: string
  /** 카드 좌측 정보 영역 클릭 시 해당 감정물 번호로 전환을 요청한다. */
  onSelect: (aprthngNo: string) => void
  /** 카드 우측 "상세 보기" 버튼 클릭 시 해당 감정물의 상세 시트 열기를 요청한다. */
  onOpenDetail: (aprthngNo: string) => void
}

/**
 * 채취 일시 표시 — 서버 형식 `YYYY-MM-DDTHH:MM:SS`를 입력 형식과 같은 `YYYY-MM-DD HH:mm`로
 * 줄여 보인다(초는 카드 폭에 비해 정보가 적다). 형식이 다르면 원문 그대로 둔다.
 */
function formatPickDt(pickDt: string | null | undefined): string {
  if (!pickDt) return "-"
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(pickDt)
  return match ? `${match[1]} ${match[2]}` : pickDt
}

/**
 * 사건 세로 카드 목록(프레젠테이셔널, teal 소스 톤). 카드 1건 = 좌측 정보 영역
 * (감정물 번호 mono 강조 + 사건명 + 의뢰관서·채취 일시 요약, 클릭=전환) + 우측
 * "상세 보기" 버튼(클릭=상세 시트). 두 액션은 형제 버튼으로 분리해 버튼 중첩을
 * 피한다. 현재 열린 사건은 좌측 teal 액센트바로 강조한다. 필터된 전체를 스크롤로
 * 노출하며(페이저 없음), 열의 남는 세로를 전부 차지한다.
 */
export function CaseListCompact({
  rows,
  currentAprthngNo,
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
            const aprthngNo = row.aprthngNo ?? ""
            const isCurrent = aprthngNo === currentAprthngNo
            return (
              <div
                key={`${aprthngNo}-${rowIndex}`}
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
                  onClick={() => onSelect(aprthngNo)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block font-mono text-[13px] font-semibold tracking-wide text-[#5FE0D0]">
                    {aprthngNo || "-"}
                  </span>
                  <span className="mt-0.5 block truncate text-[13px] font-medium text-[#C7CEDB]">
                    {row.crimeNm || "-"}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-[#8A93A6]">
                    <span className="flex items-center gap-1">
                      <Building2 className="size-3 text-[#5B6B85]" aria-hidden="true" />
                      {row.rqestGrfcNm || "-"}
                    </span>
                    <span className="flex items-center gap-1 font-mono tabular-nums">
                      <Clock className="size-3 text-[#5B6B85]" aria-hidden="true" />
                      {formatPickDt(row.pickDt)}
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenDetail(aprthngNo)}
                  aria-label={`감정물 ${aprthngNo} 상세 보기`}
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
