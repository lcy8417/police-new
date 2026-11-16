import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import {
  EVENT_COLUMN_DEFS,
  LOG_PAGE_SIZE,
  LOG_PAGE_SIZES,
  SESSION_COLUMNS,
  AdminLogsScreen,
  type LogFilters,
  type LogTab,
  type SessionTimeline,
} from "@/widgets/admin-logs-screen"

import { devScreen, DevScreenFrame, oneOf, subsetOf, useDevCase, useDevPlus, useDevViewer, useRememberedState } from "../frame"
import {
  MANY_SESSIONS,
  MOCK_ACTIONS,
  MOCK_ADMIN_ACTIONS,
  MOCK_EVENTS,
  MOCK_INSIGHTS,
  MOCK_LOG_USERS,
  MOCK_SESSIONS,
  MOCK_TAB_COUNTS,
  MOCK_TIMELINES,
} from "./mock-cases"

const info = devScreen("s14")
const SESSION_KEYS: string[] = SESSION_COLUMNS.map((c) => c.key)
const EVENT_KEYS: string[] = EVENT_COLUMN_DEFS.map((c) => c.key)
const isSessionKeys = subsetOf(SESSION_KEYS)
const isEventKeys = subsetOf(EVENT_KEYS)
const isPageSize = oneOf<number>([LOG_PAGE_SIZE, ...LOG_PAGE_SIZES])

const DEFAULT_FILTERS: LogFilters = { userId: "", from: "2026-11-10", to: "2026-11-16", result: "", actionCode: "", targetNo: "" }
const dateOf = (iso: string) => iso.slice(0, 10)

// S14 사용·감사 기록 진열 페이지: 탭 · 필터 · 쪽 번호를 여기서 들고(제어형) 가짜 목록을 걸러 넘긴다.
export function S14DevPage() {
  const activeCase = useDevCase(info.cases, "ready")
  const viewer = useDevViewer()
  const plus = useDevPlus()
  const [tab, setTab] = useState<LogTab>("sessions")
  const [filters, setFilters] = useState<LogFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  // r3 보기 설정(설계서 §14-6): 줄 수 · 보이는 열은 이 브라우저에 기억. 빠른 찾기 글자는 이번 화면에서만
  const [pageSize, setPageSize] = useRememberedState<number>("s14", "pageSize", LOG_PAGE_SIZE, isPageSize)
  const [quickQuery, setQuickQuery] = useState("")
  const [sessionColumns, setSessionColumns] = useRememberedState<string[]>("s14", "sessionColumns", SESSION_KEYS, isSessionKeys)
  const [eventColumns, setEventColumns] = useRememberedState<string[]>("s14", "eventColumns", EVENT_KEYS, isEventKeys)
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [timelines, setTimelines] = useState<Record<string, SessionTimeline>>({})
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  // 펼칠 때 기능 기록을 불러오는 것을 흉내 낸다: 불러오는 중 → 불러옴(또는 못 읽음)
  const loadTimeline = (id: string) => {
    setTimelines((prev) => ({ ...prev, [id]: { status: "loading", events: [] } }))
    timers.current.push(
      window.setTimeout(() => {
        setTimelines((prev) => ({ ...prev, [id]: MOCK_TIMELINES[id] ?? { status: "ready", events: [] } }))
      }, 120)
    )
  }
  const toggleSession = (id: string, open: boolean) => {
    setExpandedIds((prev) => (open ? [...prev, id] : prev.filter((x) => x !== id)))
    if (open) loadTimeline(id)
  }

  const changeFilters = (next: LogFilters) => {
    setFilters(next)
    setPage(1)
  }

  const inRange = (iso: string) => dateOf(iso) >= (filters.from || "0000") && dateOf(iso) <= (filters.to || "9999")
  const allSessions = (activeCase === "full-page" ? MANY_SESSIONS : activeCase === "exact-page" ? MANY_SESSIONS.slice(0, LOG_PAGE_SIZE) : MOCK_SESSIONS).filter(
    (s) => (!filters.userId || s.userId === filters.userId) && inRange(s.loginDt)
  )
  const allEvents = MOCK_EVENTS.filter(
    (e) =>
      (!filters.userId || e.userId === filters.userId) &&
      (!filters.result || e.result === filters.result) &&
      (!filters.actionCode || e.actionCode === filters.actionCode) &&
      (!plus || !filters.targetNo || (e.targetId ?? "").includes(filters.targetNo.trim())) &&
      inRange(e.occurredDt)
  )
  const slice = <T,>(all: T[]) => all.slice((page - 1) * pageSize, page * pageSize)

  const shownTab = !plus && tab === "admin" ? "sessions" : tab
  const allShown = shownTab === "sessions" ? allSessions : shownTab === "events" ? allEvents : MOCK_ADMIN_ACTIONS
  const shown = slice<unknown>(allShown)
  // 「더 보기」: 다음 쪽이 있으면 넘기고, 없으면 시안 알림
  const handleLoadMore = () => {
    if (page * pageSize < allShown.length) setPage(page + 1)
    else toast("시안 — 기능 준비 중")
  }
  const status =
    activeCase === "loading" || activeCase === "error"
      ? activeCase
      : activeCase === "empty" || shown.length === 0
        ? "empty"
        : "ready"

  return (
    <DevScreenFrame screen={info.screen} title={info.title} cases={info.cases}>
      <AdminLogsScreen
        showPlus={plus}
        insights={MOCK_INSIGHTS}
        tabCounts={MOCK_TAB_COUNTS}
        adminActions={slice(MOCK_ADMIN_ACTIONS)}
        onLoadMore={handleLoadMore}
        onExport={() => toast("시안 — 기능 준비 중")}
        status={status}
        errorAt="14:05"
        onRetry={() => toast("다시 확인합니다(진열용)")}
        isAdmin={viewer.isAdmin}
        tab={tab}
        onTabChange={(t) => {
          setTab(t)
          setPage(1)
        }}
        filters={filters}
        onFiltersChange={changeFilters}
        onResetFilters={() => changeFilters(DEFAULT_FILTERS)}
        users={MOCK_LOG_USERS}
        actions={MOCK_ACTIONS}
        sessions={slice(allSessions)}
        events={slice(allEvents)}
        timelines={timelines}
        onRetryTimeline={loadTimeline}
        expandedSessionIds={expandedIds}
        onToggleSession={toggleSession}
        page={page}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(n) => {
          setPageSize(n)
          setPage(1)
        }}
        quickQuery={quickQuery}
        onQuickQueryChange={setQuickQuery}
        sessionColumns={sessionColumns}
        onSessionColumnsChange={setSessionColumns}
        eventColumns={eventColumns}
        onEventColumnsChange={setEventColumns}
      />
    </DevScreenFrame>
  )
}
