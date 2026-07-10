import { type ReactNode } from "react"
import { Calendar, RefreshCw, Search } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { TechCorners } from "@/shared/ui/tech-corners"
import { cn } from "@/shared/lib/utils"

/** `/search` 필터 폼 상태. 모든 필드는 controlled string, 빈 문자열은 "미적용". */
export interface SearchFormState {
  crimeNumber: string
  imageNumber: string
  crimeName: string
  findTime: string
  requestOffice: string
  findMethod: string
}

export interface SearchFormProps {
  searchForm: SearchFormState
  /** 필드 변경을 페이지로 위임한다(상태는 페이지 소유). */
  onFieldChange: (name: keyof SearchFormState, value: string) => void
  /** 조회(필터 적용) 요청. */
  onSearch: () => void
  /** 초기화(필터 리셋) 요청. */
  onClear: () => void
  /** 의뢰관서 select 옵션(crimeData의 distinct 값에서 파생). */
  requestOfficeOptions: string[]
  /** 발견 방법 select 옵션(crimeData의 distinct 값에서 파생). */
  findMethodOptions: string[]
}

const fieldInputClass =
  "border-[#1E2A3C] bg-[#0D1420]/60 text-[#E5E9F0] placeholder:text-[#4C5670] focus-visible:border-[#3B82F6] focus-visible:ring-[#3B82F6]/30"

const selectClass =
  "h-9 w-full rounded-md border border-[#1E2A3C] bg-[#0D1420]/60 px-3 text-sm text-[#E5E9F0] outline-none transition-[color,box-shadow] focus:border-[#3B82F6] focus:ring-[3px] focus:ring-[#3B82F6]/30"

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[12px] font-medium text-[#8A93A6]">{label}</span>
      {children}
    </label>
  )
}

/**
 * 사건 검색 조건 카드(프레젠테이셔널). 6개 필터 필드를 반응형 그리드로
 * 배치하고 우측 하단에 조회/초기화 액션을 둔다. 필터 상태·로직은 모두
 * `CrimeSearchPage`가 소유하며, 이 컴포넌트는 입력과 이벤트 위임만 담당한다.
 */
export function SearchForm({
  searchForm,
  onFieldChange,
  onSearch,
  onClear,
  requestOfficeOptions,
  findMethodOptions,
}: SearchFormProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
      <TechCorners size={22} />

      {/* 헤더 */}
      <div className="flex items-center gap-2 border-b border-[#141D2C] bg-[#0D1420]/60 px-6 py-3.5">
        <Search className="size-4 text-[#4A9EFF]" aria-hidden="true" />
        <span className="text-[15px] font-semibold text-[#E5E9F0]">검색 조건</span>
      </div>

      {/* 필드 그리드 — 6필드를 3열 x 2행으로 꽉 채워 여백 없이 타이트하게 배치한다. */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 px-6 py-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="사건등록번호">
          <Input
            value={searchForm.crimeNumber}
            onChange={(e) => onFieldChange("crimeNumber", e.target.value)}
            placeholder="사건등록번호 입력"
            className={cn(fieldInputClass, "tabular-nums")}
          />
        </Field>

        <Field label="이미지 번호">
          <Input
            value={searchForm.imageNumber}
            onChange={(e) => onFieldChange("imageNumber", e.target.value)}
            placeholder="이미지 번호 입력"
            className={cn(fieldInputClass, "tabular-nums")}
          />
        </Field>

        <Field label="사건 이름">
          <Input
            value={searchForm.crimeName}
            onChange={(e) => onFieldChange("crimeName", e.target.value)}
            placeholder="사건명을 입력하세요"
            className={fieldInputClass}
          />
        </Field>

        <Field label="채취 일시">
          <div className="relative">
            <Input
              value={searchForm.findTime}
              onChange={(e) => onFieldChange("findTime", e.target.value)}
              placeholder="YYYY-MM-DD HH:mm"
              className={cn(fieldInputClass, "pr-9 tabular-nums")}
            />
            <Calendar
              className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#5B6B85]"
              aria-hidden="true"
            />
          </div>
        </Field>

        <Field label="의뢰관서">
          <select
            value={searchForm.requestOffice}
            onChange={(e) => onFieldChange("requestOffice", e.target.value)}
            className={selectClass}
          >
            <option value="">의뢰관서를 입력하세요</option>
            {requestOfficeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field label="발견 방법">
          <select
            value={searchForm.findMethod}
            onChange={(e) => onFieldChange("findMethod", e.target.value)}
            className={selectClass}
          >
            <option value="">발견 방법을 입력하세요</option>
            {findMethodOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* 액션: 조회 / 초기화 */}
      <div className="flex items-center justify-end gap-3 border-t border-[#141D2C] px-6 py-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClear}
          className="border-[#26334A] bg-transparent text-[#C7CEDB] hover:bg-white/5 hover:text-white"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          초기화
        </Button>
        <Button
          type="button"
          onClick={onSearch}
          className="bg-gradient-to-b from-[#2563EB] to-[#1D4ED8] text-white shadow-[0_0_20px_rgba(37,99,235,0.45)] hover:from-[#3b74f2] hover:to-[#2154d8]"
        >
          <Search className="size-4" aria-hidden="true" />
          조회
        </Button>
      </div>
    </section>
  )
}
