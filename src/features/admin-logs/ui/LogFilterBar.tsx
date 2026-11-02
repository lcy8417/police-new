import { useId, type ReactNode } from "react"
import { RotateCcw } from "lucide-react"

import type { ActionInfo, AdminUser } from "@/entities/admin"
import { Button, Input, NativeSelect } from "@/shared/ui"

import { RESULT_FILTER_OPTIONS, type LogFilters, type ResultFilter } from "../model/log-filters"

const dateInputClass =
  "h-9 w-[150px] border-[#1E2A3C] bg-[#0D1420] font-mono text-[13px] tabular-nums text-[#E5E9F0] [color-scheme:dark] focus-visible:border-[#3B82F6] focus-visible:ring-[#3B82F6]/35"

export interface LogFilterBarProps {
  filters: LogFilters
  onChange: (next: LogFilters) => void
  onReset: () => void
  users: AdminUser[]
  actions: ActionInfo[]
  /** true면 결과·기능 필터를 보인다(기능 기록 탭에만 적용). */
  showEventFilters: boolean
}

function FilterField({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[11px] font-medium tracking-wide text-[#8A93A6]">
        {label}
      </label>
      {children}
    </div>
  )
}

/**
 * 사용 기록 필터 막대 — 사용자(전체 + 목록), 기간(시작~끝, KST 날짜), 결과(전체/실패만/권한 없음),
 * 기능(이름표 목록), "필터 초기화". 결과·기능은 기능 기록 탭에서만 보인다.
 */
export function LogFilterBar({ filters, onChange, onReset, users, actions, showEventFilters }: LogFilterBarProps) {
  const baseId = useId()
  const set = <K extends keyof LogFilters>(key: K, value: LogFilters[K]) => onChange({ ...filters, [key]: value })

  return (
    <div
      role="search"
      aria-label="사용 기록 필터"
      className="relative flex flex-wrap items-end gap-4 rounded-xl border border-[#1E2A3C] bg-[#0B121D] px-5 py-4"
    >
      <FilterField id={`${baseId}-user`} label="사용자">
        <NativeSelect
          id={`${baseId}-user`}
          className="w-[180px]"
          value={filters.userId}
          onChange={(event) => set("userId", event.target.value)}
        >
          <option value="">전체 사용자</option>
          {users.map((user) => (
            <option key={user.userId} value={user.userId}>
              {user.userNm} ({user.userId})
            </option>
          ))}
        </NativeSelect>
      </FilterField>

      <FilterField id={`${baseId}-from`} label="기간">
        <div className="flex items-center gap-2">
          <Input
            id={`${baseId}-from`}
            type="date"
            aria-label="시작 날짜"
            value={filters.from}
            max={filters.to || undefined}
            onChange={(event) => set("from", event.target.value)}
            className={dateInputClass}
          />
          <span className="text-[#5B6B85]" aria-hidden="true">
            ~
          </span>
          <Input
            type="date"
            aria-label="끝 날짜"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(event) => set("to", event.target.value)}
            className={dateInputClass}
          />
        </div>
      </FilterField>

      {showEventFilters && (
        <>
          <FilterField id={`${baseId}-result`} label="결과">
            <NativeSelect
              id={`${baseId}-result`}
              className="w-[130px]"
              value={filters.result}
              onChange={(event) => set("result", event.target.value as ResultFilter)}
            >
              {RESULT_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </FilterField>

          <FilterField id={`${baseId}-action`} label="기능">
            <NativeSelect
              id={`${baseId}-action`}
              className="w-[200px]"
              value={filters.actionCode}
              onChange={(event) => set("actionCode", event.target.value)}
            >
              <option value="">전체 기능</option>
              {actions.map((action) => (
                <option key={action.actionCode} value={action.actionCode}>
                  {action.actionNm}
                </option>
              ))}
            </NativeSelect>
          </FilterField>
        </>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onReset}
        className="ml-auto h-9 border-[#26334A] bg-transparent text-[#C7CEDB] hover:bg-white/5 hover:text-white focus-visible:border-[#3B82F6] focus-visible:ring-[#3B82F6]/40"
      >
        <RotateCcw aria-hidden="true" />
        필터 초기화
      </Button>
    </div>
  )
}
