import { Download } from "lucide-react"

import type { AdminEvent } from "@/entities/admin"
import { formatKstDateTime } from "@/shared/lib"
import {
  BoardFrame,
  ColumnPicker,
  FilterBar,
  InlineError,
  ListFoot,
  ListNote,
  Pagination,
  Segmented,
  ViewCountSwitch,
  WorkbenchButton,
} from "@/shared/ui/kit"

import { EVENT_COLUMN_DEFS, LOG_PAGE_SIZES, SESSION_COLUMNS, quickFilterEvents, quickFilterSessions } from "../model/quick-search"
import type { AdminActionRow, AdminLogsPlusPart, AdminLogsScreenProps, LogTab } from "../model/types"
import { LogFilterBar } from "./LogFilterBar"
import { LogPulseRow, LogSidePanels } from "./LogInsights"
import { LogListTable, type LogListColumn } from "./LogListTable"
import { ResultChip } from "./ResultChip"
import { SessionTable } from "./SessionTable"

/** 서버 페이지 크기 — 50개씩, 최신순. 전체 개수는 서버가 주지 않아 한 쪽이 꽉 차면 다음 쪽이 있을 수 있다. */
export const LOG_PAGE_SIZE = 50

const EVENT_COLUMNS: LogListColumn<AdminEvent>[] = [
  {
    key: "at",
    header: "시각",
    className: "w-[150px] shrink-0",
    render: (e) => <span className="font-code text-[11px] tabular-nums">{formatKstDateTime(e.occurredDt, true)}</span>,
  },
  {
    key: "user",
    header: "사용자",
    className: "flex-[1_1_140px]",
    render: (e) => (
      <span className="break-all">
        {e.userNm ?? "알 수 없음"} <span className="font-code text-[11px] text-dim">{e.userId ?? "—"}</span>
      </span>
    ),
  },
  { key: "action", header: "기능", className: "flex-[1_1_120px]", render: (e) => <span className="break-all">{e.actionNm}</span> },
  {
    key: "target",
    header: "대상",
    className: "flex-[1_1_120px]",
    render: (e) => <span className="break-all font-code text-[11px] text-muted-foreground">{e.targetId ?? "—"}</span>,
  },
  { key: "result", header: "결과", className: "w-[64px] shrink-0", render: (e) => <ResultChip result={e.result} /> },
  {
    key: "ms",
    header: "처리 시간",
    className: "w-[72px] shrink-0 justify-end text-right",
    render: (e) => <span className="font-code text-[11px] tabular-nums text-muted-foreground">{e.durationMs === null ? "—" : `${e.durationMs}ms`}</span>,
  },
]

// 관리자 행위 탭(신규, 시안 핀 5) 열
const ADMIN_COLUMNS: LogListColumn<AdminActionRow>[] = [
  { key: "at", header: "시각", className: "w-[130px] shrink-0", render: (a) => <span className="font-code text-[11px] tabular-nums">{a.at}</span> },
  { key: "who", header: "관리자", className: "w-[120px] shrink-0", render: (a) => <span className="font-code text-[11px] text-brand-3">{a.who}</span> },
  {
    key: "text",
    header: "행위",
    className: "flex-[1_1_240px]",
    render: (a) => <span className={a.tone === "warn" ? "text-warn" : a.tone === "danger" ? "text-danger" : "text-fg-2"}>{a.text}</span>,
  },
]

/**
 * S14 사용·감사 기록: 필터 막대 + 로그인 기록(행을 펼치면 기능 타임라인) · 기능 기록 두 탭, 50개씩 쪽 넘김.
 * R6(앱 틀 남색 위 막대와 같은 결): 관리자 안내 띠 · 쪽 제목 · 보존 기간 띠 · 아래 역할 띠를 빼고(보존 기간은 표 아래 한 줄),
 * 판은 로망 목록 판(BoardFrame), 기능 기록 · 관리자 행위 표는 로망 목록 표, 단추는 WorkbenchButton.
 * r2(시안 r3 +α, `showPlus`): 엑셀 내보내기 · 보존 기간 · 시간대별 사용량 · 이상 징후 · 기록 무결성 ·
 * 감사 항목 · 내려받기 제한 · 관리자 행위(최근) · 관리자 행위 탭 · 「대상 번호」 필터. 실제 페이지는 `plusParts`로
 * 서버 값이 있는 것만 켠다(대상 번호 K1 · 관리자 행위 K2 · 기록 무결성 K3).
 */
export function AdminLogsScreen(props: AdminLogsScreenProps) {
  const { status, errorAt, onRetry, isAdmin, showPlus = true } = props
  // 신규 요소 하나씩: plusParts 를 주면 그 목록만(실제 페이지 — 서버 값이 있는 것만), 없으면 showPlus 하나로(진열)
  const plusOn = (part: AdminLogsPlusPart) => (props.plusParts ? props.plusParts.includes(part) : showPlus)
  // 관리자 행위 탭은 신규 요소 — 신규를 끄면 로그인 기록으로 본다
  const tab = !plusOn("adminTab") && props.tab === "admin" ? "sessions" : props.tab

  if (!isAdmin) {
    return (
      <div className="p-[16px]">
        <BoardFrame className="mt-0">
          <ListNote role="status" className="text-center">
            관리자만 볼 수 있습니다
          </ListNote>
        </BoardFrame>
      </div>
    )
  }

  const adminRows = props.adminActions ?? []
  const rows: unknown[] = tab === "sessions" ? props.sessions : tab === "events" ? props.events : adminRows
  const pageSize = props.pageSize ?? LOG_PAGE_SIZE
  const hasNext = rows.length >= pageSize
  // 마지막 쪽이면 전체 개수를 알 수 있다(앞 쪽은 꽉 찼으므로)
  const total = hasNext ? undefined : (props.page - 1) * pageSize + rows.length
  // r3: 빠른 검색(보이는 줄만) · 열 고르기
  const quick = props.quickQuery ?? ""
  const quickOn = quick.trim() !== "" && tab !== "admin"
  const quickSessions = quickFilterSessions(props.sessions, quick)
  const quickEvents = quickFilterEvents(props.events, quick)
  const eventKeys = props.eventColumns ?? EVENT_COLUMN_DEFS.map((c) => c.key)
  const eventColumns = EVENT_COLUMNS.filter((c) => c.key === "user" || eventKeys.includes(c.key))
  const sessionKeys = props.sessionColumns ?? SESSION_COLUMNS.map((c) => c.key)
  const regionLabel = tab === "sessions" ? "로그인 기록" : tab === "events" ? "기능 기록" : "관리자 행위 기록"
  const counts = plusOn("tabCounts") ? (props.tabCounts ?? null) : null
  const tabLabel = (label: string, count: number | undefined) => (
    <>
      {label}
      {count !== undefined && (
        <>
          {" "}
          <span data-plus className="tabular-nums text-dim">
            {count}
          </span>
        </>
      )}
    </>
  )
  const tabItems = [
    { value: "sessions", label: tabLabel("로그인 기록", counts?.sessions) },
    { value: "events", label: tabLabel("기능 기록", counts?.events) },
    ...(plusOn("adminTab") ? [{ value: "admin", label: <span data-plus>{tabLabel("관리자 행위", counts?.admin)}</span> }] : []),
  ]

  const body = (() => {
    if (status === "loading")
      return (
        <ListNote role="status" className="text-center">
          불러오는 중…
        </ListNote>
      )
    if (status === "error") {
      // 조회 실패는 「결과 없음」으로 덮지 않는다
      return (
        <div className="flex justify-center px-4 py-6">
          <InlineError message="사용 기록을 확인하지 못했습니다" at={errorAt} onRetry={onRetry} />
        </div>
      )
    }
    const empty = status === "empty"
    if (tab === "admin") {
      return (
        <div data-plus>
          <LogListTable label="관리자 행위 표" columns={ADMIN_COLUMNS} rows={empty ? [] : adminRows} rowKey={(a) => `${a.at}-${a.who}-${a.text}`} minWidth="min-w-[520px]" />
        </div>
      )
    }
    if (!empty && quickOn && (tab === "sessions" ? quickSessions : quickEvents).length === 0) {
      // 검색 결과 0건 — 조회 실패 · 데이터 없음(결과 없음)과 다른 모양
      return (
        <ListNote
          role="status"
          className="justify-center"
          action={
            <WorkbenchButton size="sm" variant="ghost" onClick={() => props.onQuickQueryChange?.("")}>
              조건 지우기
            </WorkbenchButton>
          }
        >
          조건에 맞는 항목 없음
        </ListNote>
      )
    }
    return tab === "sessions" ? (
      <SessionTable
        sessions={empty ? [] : quickSessions}
        timelines={props.timelines}
        onRetryTimeline={props.onRetryTimeline}
        expandedSessionIds={props.expandedSessionIds}
        onToggleSession={props.onToggleSession}
        visibleColumns={sessionKeys}
      />
    ) : (
      <LogListTable label="기능 기록 표" columns={eventColumns} rows={empty ? [] : quickEvents} rowKey={(e) => String(e.logId)} />
    )
  })()

  // 요약 칸은 목록을 불러온 뒤에만(불러오는 중 · 실패에 숫자를 보이지 않는다)
  const insights = plusOn("insights") && (status === "ready" || status === "empty") ? (props.insights ?? null) : null
  // 사용량 · 이상 징후가 없으면(실제 페이지 — 집계 API 없음) 위 요약 줄을 그리지 않고 무결성 칸은 오른쪽 칸 맨 위로
  const pulse = insights !== null && (insights.activity !== undefined || insights.alerts !== undefined)
  const side =
    insights !== null &&
    (insights.auditKinds !== undefined || insights.exportRules !== undefined || insights.adminActs !== undefined || (!pulse && insights.integrity !== undefined))

  const table = (
    <section aria-label={regionLabel} className="min-w-0">
      <BoardFrame className="mt-0">
        {/* 판 머리 한 줄: 기록 종류 ……… 줄 수 · 열 고르기 · 엑셀 */}
        <div className="flex flex-wrap items-center gap-[8px] border-0 border-b border-solid border-border px-3.5 py-[6px]">
          <Segmented
            aria-label="기록 종류"
            items={tabItems}
            value={tab}
            onValueChange={(v) => props.onTabChange(v as LogTab)}
            className="p-[2px] [&_button]:px-[10px] [&_button]:py-[3px] [&_button]:text-[12.5px]"
          />
          <span className="ml-auto text-[11px] text-dim">{pageSize}개씩 · 최신순</span>
          <ViewCountSwitch label="줄 수" options={LOG_PAGE_SIZES} value={pageSize as 50 | 100} onChange={(n) => props.onPageSizeChange?.(n)} />
          {tab === "sessions" && <ColumnPicker columns={SESSION_COLUMNS} visible={sessionKeys} onChange={(k) => props.onSessionColumnsChange?.(k)} />}
          {tab === "events" && <ColumnPicker columns={EVENT_COLUMN_DEFS} visible={eventKeys} onChange={(k) => props.onEventColumnsChange?.(k)} />}
          {plusOn("export") ? (
            <span data-plus className="inline-flex">
              <WorkbenchButton size="sm" icon={Download} onClick={props.onExport}>
                엑셀 내보내기
              </WorkbenchButton>
            </span>
          ) : null}
        </div>
        {tab !== "admin" && (
          <div className="border-0 border-b border-solid border-border px-3.5 py-[6px]">
            <FilterBar
              query={quick}
              onQueryChange={(q) => props.onQuickQueryChange?.(q)}
              filters={[]}
              onFilterChange={() => undefined}
              onClear={() => props.onQuickQueryChange?.("")}
              resultCount={status === "ready" ? (tab === "sessions" ? quickSessions : quickEvents).length : undefined}
              total={status === "ready" ? rows.length : undefined}
              searchPlaceholder="아이디 · 기능 · 대상 번호"
              partId="s14-quick-search"
            />
          </div>
        )}
        {body}
        {plusOn("loadMore") && status === "ready" && (
          <div data-plus className="flex justify-center px-[14px] pt-[8px]">
            <WorkbenchButton size="sm" variant="ghost" onClick={props.onLoadMore}>
              더 보기
            </WorkbenchButton>
          </div>
        )}
        {(status === "ready" || (status === "empty" && props.page > 1)) && (
          <Pagination page={props.page} pageSize={pageSize} total={total} hasNext={hasNext} onPageChange={props.onPageChange} />
        )}
        {plusOn("retention") ? (
          <ListFoot data-plus>
            보존 기간: 접속·사용 기록 <b className="text-fg-2">3년</b> · 관리자 행위 <b className="text-fg-2">5년</b>(예시 — 기관 규정 확인 필요) · 내보내기 · 조회도
            기록됨
          </ListFoot>
        ) : null}
      </BoardFrame>
    </section>
  )

  return (
    <div aria-busy={status === "loading"} className="grid min-w-0 gap-[14px] p-[16px]">
      <BoardFrame className="mt-0">
        <LogFilterBar
          filters={props.filters}
          onChange={props.onFiltersChange}
          onReset={props.onResetFilters}
          users={props.users}
          actions={props.actions}
          showPlus={plusOn("targetFilter")}
        />
      </BoardFrame>

      {insights && pulse && <LogPulseRow insights={insights} />}

      {insights && side ? (
        <div className="grid items-start gap-[14px] xl:grid-cols-[minmax(0,1fr)_320px]">
          {table}
          <LogSidePanels insights={insights} withIntegrity={!pulse} />
        </div>
      ) : (
        table
      )}
    </div>
  )
}
