import type { ReactNode } from "react"
import { Search } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Chip, Field } from "@/shared/ui/kit"
import { Panel } from "@/shared/ui/panel"

import type { UsersFilterSummary } from "../model/types"

// S13 위 필터 칸(시안: 아이디·이름 검색 + 역할 · 신발 DB · 상태 칩). 검색어는 제어형, 칩은 전체 계정 기준 숫자 표시.
const TONE: Record<string, string> = {
  blue: "border-brand-line bg-brand-bg text-brand",
  violet: "border-violet-line bg-violet-bg text-violet",
  green: "border-ok-line bg-ok-bg text-ok-fg",
  amber: "border-warn-line bg-warn-bg text-warn",
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <span className="ml-[4px] text-[12px] text-dim">{label}</span>
      {children}
    </>
  )
}

export function UsersFilterPanel({
  summary,
  query,
  onQueryChange,
}: {
  summary: UsersFilterSummary | null
  query: string
  onQueryChange?: (value: string) => void
}) {
  return (
    <Panel data-plus role="search" aria-label="사용자 거르기" className="mb-[12px]">
      <div className="flex flex-wrap items-center gap-[8px] px-[14px] py-[12px]">
        <span className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-[9px] size-[12px] -translate-y-1/2 text-dim" />
          <Field
            aria-label="아이디·이름 검색"
            placeholder="아이디·이름"
            value={query}
            onChange={(e) => onQueryChange?.(e.target.value)}
            className="w-[190px] pl-[26px]"
          />
        </span>
        {summary && (
          <>
            <Group label="역할">
              {summary.roles.map((r) => (
                <Chip key={r.label} className={cn(r.tone && TONE[r.tone])}>
                  {r.label} {r.count}
                </Chip>
              ))}
            </Group>
            <Group label="신발 DB">
              {summary.duties.map((d) => (
                <Chip key={d.label} className="text-violet">
                  {d.label} {d.count}
                </Chip>
              ))}
            </Group>
            <Group label="상태">
              {summary.states.map((s) => (
                <Chip key={s.label} className={cn(s.tone && TONE[s.tone])}>
                  {s.label} {s.count}
                </Chip>
              ))}
            </Group>
          </>
        )}
      </div>
    </Panel>
  )
}
