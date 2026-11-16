import { useId, type ReactNode } from "react"

import type { ActionInfo, AdminUser } from "@/entities/admin"
import { Button, Combobox, Field, Segmented } from "@/shared/ui/kit"

import type { LogFilters, ResultFilter } from "../model/types"

interface LogFilterBarProps {
  filters: LogFilters
  onChange: (next: LogFilters) => void
  onReset: () => void
  users: AdminUser[]
  actions: ActionInfo[]
  /** 신규 「대상 번호」 칸(시안 핀 1) */
  showPlus?: boolean
}

function Labeled({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 gap-[4px]">
      <label htmlFor={htmlFor} className="font-code text-[10px] font-semibold tracking-[0.16em] text-dim">
        {label}
      </label>
      {children}
    </div>
  )
}

const RESULT_ITEMS: { value: ResultFilter | "all"; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "FAIL", label: "실패만" },
  { value: "DENIED", label: "권한 없음" },
]

/** 사용 기록 필터 막대: 사용자 · 기간 · 결과 · 기능 (+ 신규 「대상 번호」) + 「필터 초기화」. 값은 모두 제어형. */
export function LogFilterBar({ filters, onChange, onReset, users, actions, showPlus = false }: LogFilterBarProps) {
  const baseId = useId()
  const set = <K extends keyof LogFilters>(key: K, value: LogFilters[K]) => onChange({ ...filters, [key]: value })
  const userItems = [{ value: "", label: "전체 사용자" }, ...users.map((u) => ({ value: u.userId, label: `${u.userNm} (${u.userId})` }))]
  const actionItems = [{ value: "", label: "전체 기능" }, ...actions.map((a) => ({ value: a.actionCode, label: a.actionNm }))]

  return (
    <div role="search" aria-label="사용 기록 필터" className="flex flex-wrap items-end gap-x-[14px] gap-y-[10px] px-[14px] py-[12px]">
      <Labeled label="사용자">
        <Combobox className="w-[210px]" items={userItems} value={filters.userId} onValueChange={(v) => set("userId", v)} />
      </Labeled>
      <Labeled label="기간" htmlFor={`${baseId}-from`}>
        <div className="flex items-center gap-[6px]">
          <Field id={`${baseId}-from`} type="date" variant="mono" aria-label="시작 날짜" className="w-[140px] [color-scheme:dark]" value={filters.from} max={filters.to || undefined} onChange={(e) => set("from", e.target.value)} />
          <span aria-hidden="true" className="text-dim">~</span>
          <Field type="date" variant="mono" aria-label="끝 날짜" className="w-[140px] [color-scheme:dark]" value={filters.to} min={filters.from || undefined} onChange={(e) => set("to", e.target.value)} />
        </div>
      </Labeled>
      <Labeled label="결과">
        <Segmented
          aria-label="결과"
          items={RESULT_ITEMS}
          value={filters.result === "" ? "all" : filters.result}
          onValueChange={(v) => set("result", v === "all" ? "" : (v as ResultFilter))}
        />
      </Labeled>
      <Labeled label="기능">
        <Combobox className="w-[200px]" items={actionItems} value={filters.actionCode} onValueChange={(v) => set("actionCode", v)} />
      </Labeled>
      {showPlus && (
        <div data-plus className="min-w-0">
          <Labeled label="대상 번호" htmlFor={`${baseId}-target`}>
            <Field
              id={`${baseId}-target`}
              className="w-[180px]"
              placeholder="감정번호·화류번호 등"
              value={filters.targetNo ?? ""}
              onChange={(e) => set("targetNo", e.target.value)}
            />
          </Labeled>
        </div>
      )}
      <Button variant="ghost" className="ml-auto" onClick={onReset}>
        필터 초기화
      </Button>
    </div>
  )
}
