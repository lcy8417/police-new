import { useMemo, useState } from "react"
import { ChevronDown, Compass } from "lucide-react"

import type { Crime } from "@/entities/crime"
import {
  CaseListCompact,
  QuickSearchBar,
  type CrimeSearchRow,
  type QuickSearchFilters,
} from "@/features/crime-search"
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

/** 핀 카드 상세 항목(라벨 위 / 값 아래). `CaseInfoStrip`의 StackField 스타일을 재사용한다. */
function PinField({
  label,
  value,
}: {
  label: string
  value: string | number | null | undefined
}) {
  const isEmpty = value === null || value === undefined || value === ""
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="font-mono text-[10px] font-medium tracking-wider text-[#8A93A6] uppercase">
        {label}
      </span>
      <span
        className={cn(
          "text-[12px] font-semibold break-words",
          isEmpty ? "text-[#75829B]" : "text-[#C7CEDB]"
        )}
      >
        {isEmpty ? "-" : value}
      </span>
    </div>
  )
}

/**
 * 사건 탐색 패널(페이지 로컬 조립). 통합 커맨드센터 상세(`CrimeDetailPage`) 4번째 열에서
 * [현재 사건 핀 카드 + 통합검색(QuickSearchBar) + 세로 카드 목록(CaseListCompact)]을 조립한다.
 * keyword·필터 상태를 소유하고 자체 완결 필터링을 수행한다(공유 검색 훅과 독립):
 * keyword는 사건번호·이미지번호·사건명 부분일치 OR, 필터는 정확일치 AND. 목록에서 다른
 * 사건을 고르면 `onSelect`로 URL을 전환해 1~3열 워크벤치가 자동 갱신된다.
 */
export function CaseExplorerPanel({
  crimeData,
  currentCrimeData,
  crimeNumber,
  onSelect,
}: CaseExplorerPanelProps) {
  const [keyword, setKeyword] = useState("")
  const [filters, setFilters] = useState<QuickSearchFilters>(EMPTY_FILTERS)
  const [detailOpen, setDetailOpen] = useState(false)

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

  return (
    <section className="relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
      <TechCorners size={18} />

      <div className="flex items-center justify-between border-b border-[#141D2C] bg-[#0D1420]/60 px-4 py-3">
        <span className="flex items-center gap-2 text-[14px] font-semibold text-[#E5E9F0]">
          <Compass className="size-4 text-[#4A9EFF]" aria-hidden="true" />
          사건 탐색
        </span>
        <span className="font-mono text-[10px] font-medium tracking-[0.14em] text-[#8A93A6] uppercase">
          Explore
        </span>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 px-3 py-3">
        {/* 현재 사건 핀 카드 — 사건번호·이름·상태 상시, 나머지는 "상세 보기" 접힘. */}
        <div className="shrink-0 rounded-xl border border-[#3B82F6]/30 bg-[#0D1420]/60 px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="w-fit max-w-full rounded-md border border-[#3B82F6]/40 bg-[#152238]/60 px-2.5 py-1 font-mono text-[12px] font-semibold tracking-wide break-words text-[#4A9EFF]">
              {pinNumber || "-"}
            </span>
            {currentCrimeData?.state && (
              <span className="inline-flex shrink-0 items-center rounded-full border border-[#3B82F6]/40 bg-[#152238]/60 px-2 py-0.5 text-[11px] font-semibold text-[#4A9EFF]">
                {currentCrimeData.state}
              </span>
            )}
          </div>
          <p className="mt-2 text-[13px] font-semibold break-words text-[#C7CEDB]">
            {currentCrimeData?.crimeName ?? "-"}
          </p>

          <button
            type="button"
            onClick={() => setDetailOpen((prev) => !prev)}
            className="mt-2 flex items-center gap-1 text-[11px] font-medium text-[#8A93A6] transition-colors hover:text-[#C7CEDB]"
          >
            상세 보기
            <ChevronDown
              className={cn("size-3.5 transition-transform", detailOpen && "rotate-180")}
              aria-hidden="true"
            />
          </button>

          {detailOpen && (
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[#141D2C] pt-2">
              <PinField label="이미지 번호" value={currentCrimeData?.imageNumber} />
              <PinField label="채취 일시" value={currentCrimeData?.findTime} />
              <PinField label="의뢰관서" value={currentCrimeData?.requestOffice} />
              <PinField label="발견 방법" value={currentCrimeData?.findMethod} />
            </div>
          )}
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
        />
      </div>
    </section>
  )
}
