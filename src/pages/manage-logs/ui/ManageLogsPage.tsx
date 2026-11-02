import { useMemo, useState } from "react"
import { Activity, LogIn } from "lucide-react"

import {
  EventTable,
  LogFilterBar,
  SessionTable,
  defaultLogFilters,
  toEventFilters,
  toSessionFilters,
  useActionsQuery,
  useEventsQuery,
  useLogUsersQuery,
  useSessionsQuery,
  type LogFilters,
} from "@/features/admin-logs"
import { usePageHeader } from "@/widgets/app-shell"
import { DotGrid, GlowOrb, Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui"

type LogTab = "sessions" | "events"

/**
 * 관리자 화면 `/manage/logs`(설계서 §7-4) — 필터 막대 + 탭 2개(로그인 기록 / 기능 기록).
 * 결과·기능 필터는 기능 기록 탭에만 적용된다. 목록은 50개씩 "더 보기".
 */
export function ManageLogsPage() {
  const [filters, setFilters] = useState<LogFilters>(() => defaultLogFilters())
  const [tab, setTab] = useState<LogTab>("sessions")

  const usersQuery = useLogUsersQuery()
  const actionsQuery = useActionsQuery()
  const sessionFilters = useMemo(() => toSessionFilters(filters), [filters])
  const eventFilters = useMemo(() => toEventFilters(filters), [filters])
  const sessionsQuery = useSessionsQuery(sessionFilters)
  const eventsQuery = useEventsQuery(eventFilters, tab === "events")

  const sessions = useMemo(() => sessionsQuery.data?.pages.flat() ?? [], [sessionsQuery.data])
  const events = useMemo(() => eventsQuery.data?.pages.flat() ?? [], [eventsQuery.data])

  const headerTitle = useMemo(
    () => (
      <div className="flex flex-col justify-center gap-1">
        <span className="text-[28px] leading-none font-bold text-white">사용 기록</span>
        <span className="text-[13px] leading-none font-normal text-[#8A93A6]">
          누가 언제 로그인해 어떤 기능을 썼는지, 실패·권한 없음 기록까지 확인합니다.
        </span>
      </div>
    ),
    []
  )
  usePageHeader({ title: headerTitle })

  return (
    <div className="relative h-[calc(100vh-110px)] w-full overflow-hidden bg-background px-6 py-6">
      <DotGrid />
      <GlowOrb className="-top-24 right-1/4 h-72 w-72 bg-[#2563EB]/10" />
      <GlowOrb className="bottom-0 left-1/3 h-64 w-64 bg-[#4A9EFF]/8" />

      <div className="relative flex h-full min-h-0 flex-col gap-4">
        <LogFilterBar
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(defaultLogFilters())}
          users={usersQuery.data ?? []}
          actions={actionsQuery.data ?? []}
          showEventFilters={tab === "events"}
        />

        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as LogTab)}
          className="min-h-0 flex-1 gap-3"
        >
          <TabsList>
            <TabsTrigger value="sessions">
              <LogIn aria-hidden="true" />
              로그인 기록
            </TabsTrigger>
            <TabsTrigger value="events">
              <Activity aria-hidden="true" />
              기능 기록
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sessions" className="min-h-0">
            <SessionTable
              sessions={sessions}
              isLoading={sessionsQuery.isLoading}
              hasNextPage={sessionsQuery.hasNextPage}
              isFetchingNextPage={sessionsQuery.isFetchingNextPage}
              onLoadMore={() => void sessionsQuery.fetchNextPage()}
            />
          </TabsContent>
          <TabsContent value="events" className="min-h-0">
            <EventTable
              events={events}
              isLoading={eventsQuery.isLoading}
              hasNextPage={eventsQuery.hasNextPage}
              isFetchingNextPage={eventsQuery.isFetchingNextPage}
              onLoadMore={() => void eventsQuery.fetchNextPage()}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
