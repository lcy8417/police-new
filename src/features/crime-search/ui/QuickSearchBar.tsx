import { useState } from "react"
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react"

import { Input } from "@/shared/ui/input"
import { cn } from "@/shared/lib/utils"

/**
 * 통합검색 정밀 필터 상태(AND 대상). 빈 문자열은 "미적용". 의뢰관서·채취 방법 코드는
 * 정확일치, 채취 일시는 `matchesPickDt`(공백→`T` 정규화 후 앞부분 일치)로 비교한다.
 */
export interface QuickSearchFilters {
  /** 채취 일시 입력(`YYYY-MM-DD`, `YYYY-MM-DD HH:mm`, `YYYY-MM-DD HH:mm:ss`). */
  pickDt: string
  /** 의뢰관서명(정확일치). */
  rqestGrfcNm: string
  /** 채취 방법 코드(정확일치). */
  pickMthCode: string
}

export interface QuickSearchBarProps {
  /** 통합 검색어(감정물 번호·감정의뢰번호·사건명 부분일치 OR 대상). */
  keyword: string
  onKeywordChange: (value: string) => void
  /** 정밀 필터(채취 일시·의뢰관서·채취 방법 코드). 상태는 부모가 소유한다. */
  filters: QuickSearchFilters
  onFilterChange: (name: keyof QuickSearchFilters, value: string) => void
  /** 의뢰관서 select 옵션(crimeData `rqestGrfcNm`의 distinct 값에서 파생). */
  rqestGrfcNmOptions: string[]
  /** 채취 방법 코드 select 옵션(crimeData `pickMthCode`의 distinct 값에서 파생). */
  pickMthCodeOptions: string[]
}

// `SearchForm`의 입력·select 스타일을 그대로 재사용해 시각 일관성을 맞춘다.
const fieldInputClass =
  "border-[#1E2A3C] bg-[#0D1420]/60 text-[#E5E9F0] placeholder:text-[#4C5670] focus-visible:border-[#3B82F6] focus-visible:ring-[#3B82F6]/30"

const selectClass =
  "h-9 w-full rounded-md border border-[#1E2A3C] bg-[#0D1420]/60 px-3 text-sm text-[#E5E9F0] outline-none transition-[color,box-shadow] focus:border-[#3B82F6] focus:ring-[3px] focus:ring-[#3B82F6]/30"

/**
 * 사건 탐색 통합검색 바(프레젠테이셔널). 상단은 부분검색용 keyword 입력, 그 아래는
 * 접이식 "필터" 디스클로저(채취 일시 text + 의뢰관서·채취 방법 코드 native select). keyword·
 * 필터 상태는 `CaseExplorerPanel`이 소유하고, 이 컴포넌트는 입력·이벤트 위임과
 * 디스클로저 개폐(순수 UI 토글)만 담당한다. 적용된 필터 수를 배지로 노출한다.
 */
export function QuickSearchBar({
  keyword,
  onKeywordChange,
  filters,
  onFilterChange,
  rqestGrfcNmOptions,
  pickMthCodeOptions,
}: QuickSearchBarProps) {
  const [open, setOpen] = useState(false)
  const appliedCount = Object.values(filters).filter((value) => value !== "").length

  return (
    <div className="flex flex-col gap-2">
      {/* 통합 검색어 — 감정물 번호·감정의뢰번호·사건명 부분일치 OR */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#5B6B85]"
          aria-hidden="true"
        />
        <Input
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          placeholder="감정물 번호·감정의뢰번호·사건명 검색"
          className={cn(fieldInputClass, "pl-9")}
        />
      </div>

      {/* 필터 디스클로저 토글(적용 수 배지) */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-between rounded-md border border-[#1E2A3C] bg-[#0D1420]/60 px-3 py-2 text-[12px] font-medium text-[#8A93A6] transition-colors hover:border-[#3B82F6]/40 hover:text-[#C7CEDB]"
      >
        <span className="flex items-center gap-1.5">
          <SlidersHorizontal className="size-3.5" aria-hidden="true" />
          필터
          {appliedCount > 0 && (
            <span className="rounded-full border border-[#3B82F6]/40 bg-[#152238]/60 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-[#4A9EFF]">
              {appliedCount}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn("size-4 transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="flex flex-col gap-3 rounded-md border border-[#141D2C] bg-[#0B121D]/60 px-3 py-3">
          <label className="block space-y-1.5">
            <span className="text-[12px] font-medium text-[#8A93A6]">채취 일시</span>
            <Input
              value={filters.pickDt}
              onChange={(e) => onFilterChange("pickDt", e.target.value)}
              placeholder="YYYY-MM-DD HH:mm"
              className={cn(fieldInputClass, "tabular-nums")}
            />
          </label>

          {/* select는 label 안의 option 글자까지 라벨 텍스트로 잡히므로 aria-label을 명시한다. */}
          <label className="block space-y-1.5">
            <span className="text-[12px] font-medium text-[#8A93A6]">의뢰관서</span>
            <select
              aria-label="의뢰관서"
              value={filters.rqestGrfcNm}
              onChange={(e) => onFilterChange("rqestGrfcNm", e.target.value)}
              className={selectClass}
            >
              <option value="">전체</option>
              {rqestGrfcNmOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-[12px] font-medium text-[#8A93A6]">채취 방법 코드</span>
            <select
              aria-label="채취 방법 코드"
              value={filters.pickMthCode}
              onChange={(e) => onFilterChange("pickMthCode", e.target.value)}
              className={selectClass}
            >
              <option value="">전체</option>
              {pickMthCodeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </div>
  )
}
