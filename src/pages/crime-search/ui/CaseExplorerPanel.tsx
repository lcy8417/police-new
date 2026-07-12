import { useMemo, useState } from "react"
import { Compass, FileText } from "lucide-react"

import type { Crime } from "@/entities/crime"
import {
  CaseListCompact,
  QuickSearchBar,
  type CrimeSearchRow,
  type QuickSearchFilters,
} from "@/features/crime-search"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet"
import { TechCorners } from "@/shared/ui/tech-corners"
import { cn } from "@/shared/lib/utils"

export interface CaseExplorerPanelProps {
  /** 탐색 대상 전체 사건(store의 crimeData). */
  crimeData: Crime[]
  /** 현재 열린 사건. 미조회/미존재(index===-1)면 undefined. */
  currentCrimeData: Crime | undefined
  /** URL 사건번호 — currentCrimeData 미조회 시 핀 카드 플레이스홀더로 쓴다. */
  crimeNumber: string
  /** 목록에서 사건 선택 시 호출(부모가 navigate로 URL 전환). */
  onSelect: (crimeNumber: string) => void
}

const EMPTY_FILTERS: QuickSearchFilters = {
  findTime: "",
  requestOffice: "",
  findMethod: "",
}

/** `Crime` → 세로 카드 행으로 투영한다(표시 필드만). */
function toRow(item: Crime): CrimeSearchRow {
  return {
    crimeNumber: item.crimeNumber,
    imageNumber: item.imageNumber,
    crimeName: item.crimeName,
    findTime: item.findTime,
    requestOffice: item.requestOffice,
    findMethod: item.findMethod,
  }
}

/** crimeData에서 특정 필드의 distinct(빈 값 제외) 목록을 뽑아 select 옵션으로 쓴다. */
function distinctValues(data: Crime[], key: keyof Crime): string[] {
  const seen = new Set<string>()
  for (const item of data) {
    const value = item[key]
    if (typeof value === "string" && value !== "") seen.add(value)
  }
  return Array.from(seen)
}

/** 상세 시트 항목(라벨 위 / 값 아래). */
function DetailField({
  label,
  value,
}: {
  label: string
  value: string | number | null | undefined
}) {
  const isEmpty = value === null || value === undefined || value === ""
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="font-mono text-[10px] font-medium tracking-wider text-[#8A93A6] uppercase">
        {label}
      </span>
      <span
        className={cn(
          "text-[13px] font-semibold break-words",
          isEmpty ? "text-[#75829B]" : "text-[#E5E9F0]"
        )}
      >
        {isEmpty ? "-" : value}
      </span>
    </div>
  )
}

/**
 * 사건 탐색 패널(페이지 로컬 조립, teal 소스 톤). 통합 커맨드센터 상세(`CrimeDetailPage`)
 * 4번째 열에서 [현재 사건 컴팩트 인디케이터 + 통합검색(QuickSearchBar) + 세로 카드
 * 목록(CaseListCompact)]을 조립한다. keyword·필터 상태를 소유하고 자체 완결 필터링을
 * 수행한다(공유 검색 훅과 독립): keyword는 사건번호·이미지번호·사건명 부분일치 OR,
 * 필터는 정확일치 AND. 목록 카드 좌측 클릭은 `onSelect`로 URL을 전환해 워크벤치를
 * 갱신하고, 우측 "상세 보기"는 이 패널이 소유하는 상세 시트를 연다.
 */
export function CaseExplorerPanel({
  crimeData,
  currentCrimeData,
  crimeNumber,
  onSelect,
}: CaseExplorerPanelProps) {
  const [keyword, setKeyword] = useState("")
  const [filters, setFilters] = useState<QuickSearchFilters>(EMPTY_FILTERS)
  // 상세 시트 대상 사건번호(null이면 닫힘). 목록 카드 "상세 보기"로 설정한다.
  const [detailNumber, setDetailNumber] = useState<string | null>(null)

  const requestOfficeOptions = useMemo(
    () => distinctValues(crimeData, "requestOffice"),
    [crimeData]
  )
  const findMethodOptions = useMemo(
    () => distinctValues(crimeData, "findMethod"),
    [crimeData]
  )

  const handleFilterChange = (name: keyof QuickSearchFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  // 자체 완결 필터링: keyword는 3필드 부분일치 OR, 필터는 정확일치 AND(빈 값은 통과).
  const filteredRows = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return crimeData
      .filter((item) => {
        if (kw !== "") {
          const hit = [item.crimeNumber, item.imageNumber, item.crimeName].some(
            (field) => typeof field === "string" && field.toLowerCase().includes(kw)
          )
          if (!hit) return false
        }
        if (filters.findTime !== "" && String(item.findTime ?? "") !== filters.findTime)
          return false
        if (
          filters.requestOffice !== "" &&
          String(item.requestOffice ?? "") !== filters.requestOffice
        )
          return false
        if (
          filters.findMethod !== "" &&
          String(item.findMethod ?? "") !== filters.findMethod
        )
          return false
        return true
      })
      .map(toRow)
  }, [crimeData, keyword, filters])

  // 핀 식별자: 조회된 사건번호 우선, 미조회면 URL 사건번호 플레이스홀더.
  const pinNumber = currentCrimeData?.crimeNumber ?? crimeNumber

  // 상세 시트 대상 사건 — crimeData에서 사건번호로 조회한다.
  const detailCrime = useMemo(
    () =>
      detailNumber === null
        ? undefined
        : crimeData.find((item) => String(item.crimeNumber) === detailNumber),
    [crimeData, detailNumber]
  )

  return (
    <section className="relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-[#183430] bg-[#0C1917] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
      <TechCorners size={18} />

      <div className="flex items-center justify-between border-b border-[#132a27] bg-[#0E1F1D]/60 px-4 py-3">
        <span className="flex items-center gap-2 text-[14px] font-semibold text-[#E5E9F0]">
          <Compass className="size-4 text-[#2DD4BF]" aria-hidden="true" />
          사건 탐색
        </span>
        <span className="font-mono text-[10px] font-medium tracking-[0.14em] text-[#5FE0D0]/70 uppercase">
          Explore
        </span>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 px-3 py-3">
        {/* 현재 사건 컴팩트 인디케이터 — 번호·상태·사건명만(상세는 목록 카드 시트로). */}
        <div className="shrink-0 rounded-xl border border-[#2DD4BF]/30 bg-[#0E1F1D]/60 px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="w-fit max-w-full rounded-md border border-[#2DD4BF]/40 bg-[#0F2624]/60 px-2.5 py-1 font-mono text-[12px] font-semibold tracking-wide break-words text-[#5FE0D0]">
              {pinNumber || "사건 미선택"}
            </span>
            {currentCrimeData?.state && (
              <span className="inline-flex shrink-0 items-center rounded-full border border-[#2DD4BF]/40 bg-[#0F2624]/60 px-2 py-0.5 text-[11px] font-semibold text-[#5FE0D0]">
                {currentCrimeData.state}
              </span>
            )}
          </div>
          <p className="mt-2 text-[13px] font-semibold break-words text-[#C7CEDB]">
            {currentCrimeData?.crimeName ?? "사건을 선택하세요"}
          </p>
        </div>

        <div className="shrink-0">
          <QuickSearchBar
            keyword={keyword}
            onKeywordChange={setKeyword}
            filters={filters}
            onFilterChange={handleFilterChange}
            requestOfficeOptions={requestOfficeOptions}
            findMethodOptions={findMethodOptions}
          />
        </div>

        <CaseListCompact
          rows={filteredRows}
          currentCrimeNumber={pinNumber}
          onSelect={onSelect}
          onOpenDetail={setDetailNumber}
        />
      </div>

      {/* 사건 정보 — 우측 슬라이드 시트. 목록 카드의 [상세 보기] 버튼으로 연다.
          CrimeDetailPage가 소유한 검색이력 시트와 트리거·내용이 달라 공존한다. */}
      <Sheet
        open={detailNumber !== null}
        onOpenChange={(open) => {
          if (!open) setDetailNumber(null)
        }}
      >
        <SheetContent
          side="right"
          className="w-full gap-0 border-[#183430] bg-[#0C1917] p-0 text-[#C7CEDB] sm:max-w-[420px]"
        >
          <SheetHeader className="space-y-1 border-b border-[#132a27] bg-[#0E1F1D]/60 px-6 py-4">
            <SheetTitle className="flex items-center gap-2 text-[15px] font-semibold text-[#E5E9F0]">
              <FileText className="size-4 text-[#2DD4BF]" aria-hidden="true" />
              사건 정보
              {detailCrime?.state && (
                <span className="inline-flex items-center rounded-full border border-[#2DD4BF]/40 bg-[#0F2624]/60 px-2 py-0.5 text-[11px] font-semibold text-[#5FE0D0]">
                  {detailCrime.state}
                </span>
              )}
            </SheetTitle>
            <SheetDescription className="font-mono text-[11px] tracking-[0.14em] text-[#5B6B85] uppercase">
              Case · Detail
            </SheetDescription>
          </SheetHeader>

          <div className="h-[calc(100dvh-88px)] overflow-auto px-6 py-5">
            {detailCrime ? (
              <div className="grid grid-cols-1 gap-4">
                <DetailField label="사건등록번호" value={detailCrime.crimeNumber} />
                <DetailField label="이미지번호" value={detailCrime.imageNumber} />
                <DetailField label="사건명" value={detailCrime.crimeName} />
                <DetailField label="채취일시" value={detailCrime.findTime} />
                <DetailField label="의뢰관서" value={detailCrime.requestOffice} />
                <DetailField label="발견방법" value={detailCrime.findMethod} />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-center text-[13px] text-[#5B6B85]">
                사건 정보를 찾을 수 없습니다.
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </section>
  )
}
