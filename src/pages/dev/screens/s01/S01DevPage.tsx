import * as React from "react"
import { toast } from "sonner"

import { CaseListScreen, type CaseListFilters } from "@/widgets/case-list"

import { DevScreenFrame, SCREEN_CASES, devScreen, useDevCase, useDevNavigate, useDevViewer } from "../frame"
import { EMPTY_FILTERS, S01_PAGE_SIZE, makeCaseRows } from "./mock-cases"

const info = devScreen("s01")

// S01 사건관리 진열 페이지: 가짜 값 · 이동 콜백만 위젯에 넘긴다. 입력 칸 · 쪽 · 조회 조건은 여기서 들고 있어 눌러 보면 바뀐다.
export function S01DevPage() {
  const devCase = useDevCase(SCREEN_CASES.s01,"ready")
  const viewer = useDevViewer()
  const to = useDevNavigate()

  const allRows = React.useMemo(() => makeCaseRows(), [])
  const [filters, setFilters] = React.useState<CaseListFilters>(EMPTY_FILTERS)
  const [applied, setApplied] = React.useState<CaseListFilters>(EMPTY_FILTERS)
  const [page, setPage] = React.useState(1)

  // 목록 열에 값이 있는 조건은 모두 건다(피해자 · 사건장소 · 검거여부 · 타기관여부는 위젯에서 「준비 중」으로 잠김)
  const has = (value: string, needle: string) => value.includes(needle.trim())
  const matched = allRows.filter(
    (r) =>
      has(r.aprthngNo, applied.aprthngNo) &&
      has(r.docNo, applied.docNo) &&
      has(r.caseName, applied.caseName) &&
      has(r.processOffice, applied.processOffice) &&
      has(r.requestOffice, applied.requestOffice) &&
      has(r.occurOffice, applied.occurOffice) &&
      has(r.author, applied.author) &&
      has(r.caseResult, applied.caseResult) &&
      (applied.registeredFrom === "" || r.registeredAt >= applied.registeredFrom) &&
      (applied.registeredTo === "" || r.registeredAt <= applied.registeredTo) &&
      (applied.kind === "all" || (applied.kind === "shoe" ? r.shoeCount > 0 : r.tireCount > 0)) &&
      (!applied.awaitingResult || r.caseResult === "")
  )
  const pageRows = matched.slice((page - 1) * S01_PAGE_SIZE, page * S01_PAGE_SIZE)
  // 조회 조건에 맞는 사건이 없으면 「결과 없음」(케이스 전환과 같은 모양)
  const status = devCase === "ready" && matched.length === 0 ? "empty" : devCase

  return (
    <DevScreenFrame screen={info.screen} title={info.title} cases={info.cases}>
      <CaseListScreen
        status={status}
        errorAt="09:12"
        onRetry={() => toast("다시 조회합니다(가짜 데이터 — 케이스를 ready 로 바꿔 보세요)")}
        isAdmin={viewer.isAdmin}
        features={viewer.features}
        rows={pageRows}
        total={matched.length}
        page={page}
        pageSize={S01_PAGE_SIZE}
        onPageChange={setPage}
        filters={filters}
        onFiltersChange={setFilters}
        onSearch={() => {
          setApplied(filters)
          setPage(1)
        }}
        onReset={() => {
          setFilters(EMPTY_FILTERS)
          setApplied(EMPTY_FILTERS)
          setPage(1)
        }}
        onOpenCase={(no) => to("/dev/s02", { id: no })}
        onRegister={() => to("/dev/s02")}
        onSearchCase={(no) => to("/dev/s04", { id: no })}
        onConfirmCase={(no) => to("/dev/s07", { id: no })}
      />
    </DevScreenFrame>
  )
}
