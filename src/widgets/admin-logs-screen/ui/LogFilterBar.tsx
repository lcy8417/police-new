import { useId, type ReactNode } from "react"
import { RotateCcw } from "lucide-react"

import type { ActionInfo, AdminUser } from "@/entities/admin"
import { Combobox, Field, Segmented, WorkbenchButton } from "@/shared/ui/kit"

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

// R6: 이름을 칸 왼쪽에 한 줄로(보조 11) — 영문 느낌 자간 · 위아래 두 줄 배치를 뺐다. `eventsOnly` = 기능 기록 탭에만 걸리는 칸(마우스 설명)
function Labeled({ label, htmlFor, eventsOnly, children }: { label: string; htmlFor?: string; eventsOnly?: boolean; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-[6px]">
      <span title={eventsOnly ? "기능 기록 탭에만 적용" : undefined} className="inline-flex whitespace-nowrap">
        <label htmlFor={htmlFor} className="text-[11px] text-muted-foreground">
          {label}
        </label>
        {eventsOnly ? (
          <sup aria-hidden="true" className="ml-[1px] text-[10px] text-faint">
            *
          </sup>
        ) : null}
      </span>
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
    <div role="search" aria-label="사용 기록 필터" className="flex flex-wrap items-center gap-x-[16px] gap-y-[8px] px-[14px] py-[10px]">
      <Labeled label="사용자">
        <Combobox aria-label="사용자" className="w-[210px]" items={userItems} value={filters.userId} onValueChange={(v) => set("userId", v)} />
      </Labeled>
      <Labeled label="기간" htmlFor={`${baseId}-from`}>
        <div className="flex items-center gap-[6px]">
          <Field id={`${baseId}-from`} type="date" variant="mono" aria-label="시작 날짜" className="w-[140px]" value={filters.from} max={filters.to || undefined} onChange={(e) => set("from", e.target.value)} />
          <span aria-hidden="true" className="text-dim">~</span>
          <Field type="date" variant="mono" aria-label="끝 날짜" className="w-[140px]" value={filters.to} min={filters.from || undefined} onChange={(e) => set("to", e.target.value)} />
        </div>
      </Labeled>
      <Labeled label="결과" eventsOnly>
        <Segmented
          aria-label="결과"
          items={RESULT_ITEMS}
          value={filters.result === "" ? "all" : filters.result}
          onValueChange={(v) => set("result", v === "all" ? "" : (v as ResultFilter))}
          className="p-[2px] [&_button]:px-[9px] [&_button]:py-[3px] [&_button]:text-[12px]"
        />
      </Labeled>
      <Labeled label="기능" eventsOnly>
        <Combobox aria-label="기능" className="w-[200px]" items={actionItems} value={filters.actionCode} onValueChange={(v) => set("actionCode", v)} />
      </Labeled>
      {showPlus && (
        <div data-plus className="min-w-0">
          <Labeled label="대상 번호" htmlFor={`${baseId}-target`} eventsOnly>
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
      <WorkbenchButton size="sm" variant="ghost" icon={RotateCcw} className="ml-auto" onClick={onReset}>
        필터 초기화
      </WorkbenchButton>
    </div>
  )
}
