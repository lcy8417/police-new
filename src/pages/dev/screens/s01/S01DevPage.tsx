import * as React from "react"
import { toast } from "sonner"

import type { FilterGroup } from "@/shared/ui/kit"
import {
  CaseListScreen,
  type CaseListFilters,
  type CaseListRow,
  type CaseListRowHeight,
} from "@/widgets/case-list"

import {
  DevScreenFrame,
  SCREEN_CASES,
  devScreen,
  useDevCase,
  useDevNavigate,
  useDevPlus,
  useDevViewer,
} from "../frame"
import {
  EMPTY_FILTERS,
  S01_AI_PREP,
  S01_LIVE_AT,
  S01_PAGE_SIZE,
  S01_TASKS,
  makeCaseRows,
} from "./mock-cases"
import { usePersistedState } from "./use-persisted-state"

const info = devScreen("s01")

const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string")
const isPageSize = (v: unknown): v is number => v === 10 || v === 20 || v === 50
const isRowHeight = (v: unknown): v is CaseListRowHeight => v === "보통" || v === "촘촘"

/** 빠른 찾기 칩 값(묶음 key → 고른 값들). 묶음 안은 「또는」, 묶음끼리는 「그리고」 */
type QuickValues = Record<string, string[]>
const EMPTY_QUICK: QuickValues = { progress: [], result: [], kind: [], mine: [] }

const resultKey = (r: CaseListRow) => (r.caseResult === "" ? "none" : r.caseResult)

// S01 사건관리 진열 페이지: 가짜 값 · 이동 콜백만 위젯에 넘긴다. 입력 칸 · 쪽 · 조회 조건 · 빠른 찾기는 여기서 들고 있어 눌러 보면 바뀐다.
// 열 · 쪽당 행 · 행 높이는 이 브라우저에 기억한다(실패해도 기본값).
export function S01DevPage() {
  const devCase = useDevCase(SCREEN_CASES.s01,"ready")
  const viewer = useDevViewer()
  const plus = useDevPlus()
  const to = useDevNavigate()

  const allRows = React.useMemo(() => makeCaseRows(), [])
  const [filters, setFilters] = React.useState<CaseListFilters>(EMPTY_FILTERS)
  const [applied, setApplied] = React.useState<CaseListFilters>(EMPTY_FILTERS)
  const [page, setPage] = React.useState(1)
  const [query, setQuery] = React.useState("")
  const [quickValues, setQuickValues] = React.useState<QuickValues>(EMPTY_QUICK)
  const [hiddenColumns, setHiddenColumns] = usePersistedState<string[]>("dev.s01.hiddenColumns", [], isStringArray)
  const [pageSize, setPageSize] = usePersistedState<number>("dev.s01.pageSize", S01_PAGE_SIZE, isPageSize)
  const [rowHeight, setRowHeight] = usePersistedState<CaseListRowHeight>("dev.s01.rowHeight", "보통", isRowHeight)

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

  // 빠른 찾기: SCAS 검색 폼으로 찾은 결과 안에서 더 좁힌다
  const me = viewer.who.split(" ")[0]
  const needle = query.trim().toLowerCase()
  const anyOf = (key: string, test: (v: string) => boolean) => quickValues[key].length === 0 || quickValues[key].some(test)
  const quickMatched = matched.filter(
    (r) =>
      (needle === "" || [r.aprthngNo, r.docNo, r.caseName].some((t) => t.toLowerCase().includes(needle))) &&
      anyOf("progress", (v) => (v === "registered" ? r.progress.registered > 0 : v === "searched" ? r.progress.searched > 0 : r.progress.confirmed > 0)) &&
      anyOf("result", (v) => resultKey(r) === v) &&
      anyOf("kind", (v) => r.kind === v) &&
      anyOf("mine", () => r.author === me)
  )

  const groups: FilterGroup[] = [
    {
      key: "progress",
      label: "진행 상태",
      value: quickValues.progress,
      options: [
        { value: "registered", label: "등록됨" },
        { value: "searched", label: "검색됨" },
        { value: "confirmed", label: "확인됨" },
      ],
    },
    {
      key: "result",
      label: "사건결과",
      value: quickValues.result,
      options: [
        { value: "발견", label: "발견" },
        { value: "불발견", label: "불발견" },
        { value: "none", label: "결과 전" },
      ],
    },
    {
      key: "kind",
      label: "처리 구분",
      value: quickValues.kind,
      options: [
        { value: "현장", label: "현장" },
        { value: "대조", label: "대조" },
      ],
    },
    { key: "mine", label: "담당", value: quickValues.mine, options: [{ value: "mine", label: "내 담당만" }] },
  ]

  const pageRows = quickMatched.slice((page - 1) * pageSize, page * pageSize)
  // SCAS 조회 조건에 맞는 사건이 없으면 「결과 없음」(케이스 전환과 같은 모양). 빠른 찾기 0건은 위젯이 따로 안내한다.
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
        total={quickMatched.length}
        page={page}
        pageSize={pageSize}
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
          setQuery("")
          setQuickValues(EMPTY_QUICK)
          setPage(1)
        }}
        onOpenCase={(no) => to("/dev/s02", { id: no })}
        onRegister={() => to("/dev/s02")}
        onSearchCase={(no) => to("/dev/s04", { id: no })}
        onConfirmCase={(no) => to("/dev/s07", { id: no })}
        showPlus={plus}
        aiPrep={S01_AI_PREP}
        tasks={S01_TASKS}
        liveAt={S01_LIVE_AT}
        onMockAction={() => toast("시안 — 기능 준비 중")}
        quick={{
          query,
          onQueryChange: (q) => {
            setQuery(q)
            setPage(1)
          },
          groups,
          onGroupChange: (key, values) => {
            setQuickValues((prev) => ({ ...prev, [key]: values }))
            setPage(1)
          },
          onClear: () => {
            setQuery("")
            setQuickValues(EMPTY_QUICK)
            setPage(1)
          },
          resultCount: quickMatched.length,
          total: matched.length,
        }}
        hiddenColumns={hiddenColumns}
        onHiddenColumnsChange={setHiddenColumns}
        onPageSizeChange={(n) => {
          setPageSize(n)
          setPage(1)
        }}
        rowHeight={rowHeight}
        onRowHeightChange={setRowHeight}
      />
    </DevScreenFrame>
  )
}
