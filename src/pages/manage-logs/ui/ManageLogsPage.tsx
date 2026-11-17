import { useMemo, useState } from "react"

import {
  ADMIN_EVENT_SE,
  auditShortTime,
  describeAuditEvent,
  useAuditEventsQuery,
  useAuditVerifyQuery,
  type AuditEvent,
  type EventFilters,
  type SessionFilters,
} from "@/entities/admin"
import {
  DEFAULT_RANGE_DAYS,
  LOG_PAGE_SIZE,
  useActionsQuery,
  useAuditPageQuery,
  useEventsPageQuery,
  useLogUsersQuery,
  useSessionTimelines,
  useSessionsPageQuery,
} from "@/features/admin-logs"
import { useRolesQuery } from "@/features/admin-users"
import { useSessionStore } from "@/features/auth"
import { FEATURE_LABELS, type FeatureCode } from "@/entities/session"
import {
  AdminLogsScreen,
  type AdminActionRow,
  type AdminLogsInsights,
  type AdminLogsPlusPart,
  type LogFilters,
  type LogTab,
  type SessionTimeline,
} from "@/widgets/admin-logs-screen"
import { usePageHeader } from "@/widgets/app-shell"
import { formatKstDateTime, kstDateString } from "@/shared/lib"
import type { ScreenStatus } from "@/shared/lib/screen-status"

/**
 * 실제 페이지에서 켜는 신규(+α) 요소 — 서버 값이 있는 것만(이식 계획): 대상 번호 거르기(K1) · 관리자 행위 탭(K2) ·
 * 기록 무결성(K3) + 관리자 행위 최근(K2). 시간대 차트 · 이상 징후 · 탭 건수 · 엑셀 · 보존 기간 글은 집계 API · 규정이 없어 끈다.
 */
const PLUS_PARTS: AdminLogsPlusPart[] = ["targetFilter", "adminTab", "insights"]
/** 무결성 칸 사슬 그림 · 관리자 행위 최근 줄 수(시안 5칸) */
const RECENT = 5

const orUndefined = (value: string | undefined) => (value === undefined || value.trim() === "" ? undefined : value.trim())

function defaultFilters(): LogFilters {
  return { userId: "", from: kstDateString(new Date(), -(DEFAULT_RANGE_DAYS - 1)), to: kstDateString(), result: "", actionCode: "", targetNo: "" }
}

/** 쿼리 상태 → 위젯 상태(실패 · 미조회를 빈 목록으로 덮지 않는다). */
function statusOf(query: { isPending: boolean; isError: boolean; data?: unknown[] }): ScreenStatus {
  if (query.isError) return "error"
  if (query.isPending) return "loading"
  return (query.data?.length ?? 0) === 0 ? "empty" : "ready"
}

/** 실패한 시각(ms) → 「시:분」(KST). */
const hhmm = (ms: number) => (ms ? formatKstDateTime(new Date(ms).toISOString()).slice(11, 16) : undefined)

/**
 * 관리자 화면 `/manage/logs` — S14 사용 · 감사 기록 위젯(`AdminLogsScreen`)에 실제 값을 꽂는다.
 * 로그인 기록 · 기능 기록(대상 번호 K1) · 관리자 행위(감사 K2 관리 4종) 세 탭, 50 · 100개씩 쪽 넘김(서버는 50개씩),
 * 오른쪽 칸 = 기록 무결성(감사 사슬 K3) · 관리자 행위 최근. 사용 기록(activity_log)에는 사슬이 없다(서버 B12).
 */
export function ManageLogsPage() {
  const me = useSessionStore((s) => s.user)
  const [filters, setFilters] = useState<LogFilters>(defaultFilters)
  const [tab, setTab] = useState<LogTab>("sessions")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(LOG_PAGE_SIZE)
  const [quickQuery, setQuickQuery] = useState("")
  const [sessionColumns, setSessionColumns] = useState<string[] | undefined>(undefined)
  const [eventColumns, setEventColumns] = useState<string[] | undefined>(undefined)
  const [expandedIds, setExpandedIds] = useState<string[]>([])

  const usersQuery = useLogUsersQuery()
  const actionsQuery = useActionsQuery()

  const sessionFilters = useMemo<Omit<SessionFilters, "page">>(
    () => ({ userId: orUndefined(filters.userId), from: orUndefined(filters.from), to: orUndefined(filters.to) }),
    [filters.userId, filters.from, filters.to]
  )
  const eventFilters = useMemo<Omit<EventFilters, "page">>(
    () => ({
      ...sessionFilters,
      result: filters.result === "" ? undefined : filters.result,
      actionCode: orUndefined(filters.actionCode),
      targetId: orUndefined(filters.targetNo),
    }),
    [sessionFilters, filters.result, filters.actionCode, filters.targetNo]
  )
  const adminFilters = useMemo(
    () => ({ eventSe: ADMIN_EVENT_SE, actorId: sessionFilters.userId, from: sessionFilters.from, to: sessionFilters.to }),
    [sessionFilters]
  )

  const sessionsQuery = useSessionsPageQuery(sessionFilters, page, pageSize, tab === "sessions")
  const eventsQuery = useEventsPageQuery(eventFilters, page, pageSize, tab === "events")
  const adminQuery = useAuditPageQuery(adminFilters, page, pageSize, tab === "admin")
  const timelineStates = useSessionTimelines(expandedIds)

  // 오른쪽 칸: 사슬 검증(K3) + 가장 최근 감사 기록(사슬 그림) + 관리자 행위 최근(K2 관리 4종)
  const verifyQuery = useAuditVerifyQuery()
  const latestAuditQuery = useAuditEventsQuery({ page: 0 })
  const recentAdminQuery = useAuditEventsQuery({ eventSe: ADMIN_EVENT_SE, page: 0 })

  const rolesQuery = useRolesQuery()
  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data])
  const labels = {
    roleName: (code: string) => rolesQuery.data?.find((r) => r.roleCode === code)?.roleNm ?? code,
    featureName: (code: string) => FEATURE_LABELS[code as FeatureCode] ?? code,
  }
  const toAdminRow = (e: AuditEvent): AdminActionRow => ({
    at: auditShortTime(e.occurredDt),
    who: e.actorId,
    text: describeAuditEvent(e, labels),
  })

  const current = tab === "sessions" ? sessionsQuery : tab === "events" ? eventsQuery : adminQuery
  const status = statusOf(current)

  const timelines: Record<string, SessionTimeline> = {}
  for (const [id, t] of Object.entries(timelineStates)) timelines[id] = { status: t.status, events: t.events }

  const verifyStatus: ScreenStatus =
    verifyQuery.isError || latestAuditQuery.isError ? "error" : verifyQuery.isPending || latestAuditQuery.isPending ? "loading" : "ready"
  const verify = verifyQuery.data
  const checkedAt = hhmm(verifyQuery.dataUpdatedAt)
  const insights: AdminLogsInsights = {
    integrity: {
      status: verifyStatus,
      errorAt: hhmm(Math.max(verifyQuery.errorUpdatedAt, latestAuditQuery.errorUpdatedAt)),
      onRetry: () => {
        void verifyQuery.refetch()
        void latestAuditQuery.refetch()
      },
      brokenAt: verify?.brokenAt ?? null,
      chain: (latestAuditQuery.data ?? [])
        .slice(0, RECENT)
        .reverse()
        .map((e) => ({ no: e.eventId, hash: e.rowHash.slice(0, 4) })),
      checks: verify
        ? [
            {
              text: `감사 기록 ${verify.checked}건 · ${verify.brokenAt === null ? "사슬 끊김 0" : `#${verify.brokenAt}부터 어긋남`}`,
              note: checkedAt ? `${checkedAt} 검사` : "",
            },
          ]
        : [],
    },
    // 관리자 행위 최근 — 못 읽었으면 칸을 그리지 않는다(빈 칸 = 「결과 없음」과 구분)
    ...(recentAdminQuery.data ? { adminActs: recentAdminQuery.data.slice(0, RECENT).map(toAdminRow) } : {}),
  }

  const changeFilters = (next: LogFilters) => {
    setFilters(next)
    setPage(1)
    setExpandedIds([])
  }

  const headerTitle = useMemo(
    () => (
      <div className="flex flex-col justify-center gap-1">
        <span className="text-[28px] leading-none font-bold text-white">사용 기록</span>
        <span className="text-[13px] leading-none font-normal text-[#8A93A6]">
          누가 언제 로그인해 어떤 기능을 썼는지, 실패·권한 없음 기록과 관리자 행위 · 감사 사슬까지 확인합니다.
        </span>
      </div>
    ),
    []
  )
  usePageHeader({ title: headerTitle })

  return (
    <div className="h-[calc(100vh-110px)] w-full overflow-auto bg-background">
      <AdminLogsScreen
        showPlus={false}
        plusParts={PLUS_PARTS}
        insights={insights}
        adminActions={tab === "admin" ? (adminQuery.data ?? []).map(toAdminRow) : []}
        status={status}
        errorAt={hhmm(current.errorUpdatedAt)}
        onRetry={() => void current.refetch()}
        isAdmin={me?.userSe === "ADMIN"}
        tab={tab}
        onTabChange={(next) => {
          setTab(next)
          setPage(1)
        }}
        filters={filters}
        onFiltersChange={changeFilters}
        onResetFilters={() => changeFilters(defaultFilters())}
        users={users}
        actions={actionsQuery.data ?? []}
        sessions={sessionsQuery.data ?? []}
        events={eventsQuery.data ?? []}
        timelines={timelines}
        onRetryTimeline={(id) => timelineStates[id]?.refetch()}
        expandedSessionIds={expandedIds}
        onToggleSession={(id, open) => setExpandedIds((prev) => (open ? [...prev.filter((x) => x !== id), id] : prev.filter((x) => x !== id)))}
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
    </div>
  )
}
