import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { useCrimeStore, type Crime } from "@/entities/crime"
import {
  SearchForm,
  SearchResults,
  type CrimeSearchRow,
  type SearchFormState,
} from "@/features/crime-search"
import { usePageHeader } from "@/widgets/app-shell"
import { DotGrid, GlowOrb } from "@/shared/ui/glow-fx"

import { EMPTY_SEARCH_FORM } from "../model/search-form"
import { searchDetailPath } from "../model/search-paths"

/** 페이지당 기본 표시 건수(클라이언트 사이드 페이지네이션). */
const DEFAULT_PAGE_SIZE = 10

// 제목은 정적 — 헤더 effect가 매 렌더 재실행되지 않도록 한 번만 생성한다.
const HEADER_TITLE = (
  <div className="flex flex-col justify-center gap-1">
    <span className="text-[28px] leading-none font-bold text-white">사건 목록</span>
    <span className="text-[13px] leading-none font-normal text-[#8A93A6]">
      등록된 사건 정보를 조회하고 관리할 수 있습니다.
    </span>
  </div>
)

/** `Crime` → 목록 테이블 행으로 투영한다(표시 컬럼만). */
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

/**
 * 커맨드 센터 `/search` 진입 목록 페이지. 레거시 라이트 테마 폼을 다크
 * 커맨드센터 룩으로 재설계했다: 페이지가 검색 조건 상태 · 필터 결과 ·
 * 클라이언트 사이드 페이지네이션을 소유하고, 프레젠테이셔널
 * `SearchForm`(검색 조건 카드) / `SearchResults`(목록 테이블)에 위임한다.
 */
export function CrimeSearchPage() {
  const navigate = useNavigate()
  const crimeData = useCrimeStore((s) => s.crimeData)

  const [searchForm, setSearchForm] = useState<SearchFormState>(EMPTY_SEARCH_FORM)
  const [filteredRows, setFilteredRows] = useState<CrimeSearchRow[]>(() =>
    crimeData.map(toRow)
  )
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  // 헤더 제목은 페이지가 소유한다.
  usePageHeader({ title: HEADER_TITLE })

  // 원본 데이터가 갱신되면(재조회 등) 전체 목록으로 되돌리고, 데이터가 줄어
  // 현재 페이지가 빈 slice가 되는 것을 막기 위해 첫 페이지로 리셋한다.
  useEffect(() => {
    setFilteredRows(crimeData.map(toRow))
    setPage(0)
  }, [crimeData])

  // 의뢰관서/발견 방법 select 옵션은 crimeData의 distinct 값에서 파생한다
  // (정확 매칭 필터와 자연스럽게 맞물린다).
  const requestOfficeOptions = useMemo(
    () => distinctValues(crimeData, "requestOffice"),
    [crimeData]
  )
  const findMethodOptions = useMemo(
    () => distinctValues(crimeData, "findMethod"),
    [crimeData]
  )

  const handleFieldChange = (name: keyof SearchFormState, value: string) => {
    setSearchForm((prev) => ({ ...prev, [name]: value }))
  }

  // 조회: 기존 exact string match 규약 유지(빈 조건은 통과).
  const handleSearch = () => {
    const rows = crimeData
      .filter((tableData) =>
        (Object.keys(searchForm) as (keyof SearchFormState)[]).every((key) => {
          if (searchForm[key] === "") return true // 필터 조건이 비어있으면 통과
          return tableData[key] && String(tableData[key]) === searchForm[key]
        })
      )
      .map(toRow)
    setFilteredRows(rows)
    setPage(0)
  }

  // 초기화: 조건과 목록을 전체 데이터로 되돌린다.
  const handleClear = () => {
    setSearchForm(EMPTY_SEARCH_FORM)
    setFilteredRows(crimeData.map(toRow))
    setPage(0)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(0)
  }

  // 현재 페이지 slice(클라이언트 사이드 페이지네이션).
  const pagedRows = useMemo(
    () => filteredRows.slice(page * pageSize, page * pageSize + pageSize),
    [filteredRows, page, pageSize]
  )

  return (
    <div className="relative flex h-[calc(100vh-110px)] w-full flex-col gap-6 overflow-hidden bg-background px-6 py-6">
      <DotGrid />
      <GlowOrb className="-top-24 right-1/4 h-72 w-72 bg-[#2563EB]/10" />
      <GlowOrb className="bottom-0 left-1/3 h-64 w-64 bg-[#4A9EFF]/8" />

      <div className="relative shrink-0">
        <SearchForm
          searchForm={searchForm}
          onFieldChange={handleFieldChange}
          onSearch={handleSearch}
          onClear={handleClear}
          requestOfficeOptions={requestOfficeOptions}
          findMethodOptions={findMethodOptions}
        />
      </div>

      <div className="relative min-h-0 flex-1">
        <SearchResults
          rows={pagedRows}
          totalCount={filteredRows.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
          onRowClick={(crimeNumber) => navigate(searchDetailPath(crimeNumber))}
        />
      </div>
    </div>
  )
}
