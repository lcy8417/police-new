import { Info } from "lucide-react"

import type { AdminEvent } from "@/entities/admin"
import { formatKstDateTime } from "@/shared/lib"
import { Button, Chip, DataGrid, InlineError, Pagination, Segmented, type DataGridColumn } from "@/shared/ui/kit"
import { Crumb, PageHead, Panel } from "@/shared/ui/panel"

import type { AdminLogsScreenProps } from "../model/types"
import { LogFilterBar } from "./LogFilterBar"
import { LogPulseRow, LogSidePanels } from "./LogInsights"
import { ResultChip } from "./ResultChip"
import { SessionTable } from "./SessionTable"

/** 서버 페이지 크기 — 50개씩, 최신순. 전체 개수는 서버가 주지 않아 한 쪽이 꽉 차면 다음 쪽이 있을 수 있다. */
export const LOG_PAGE_SIZE = 50

const EVENT_COLUMNS: DataGridColumn<AdminEvent>[] = [
  { key: "at", header: "시각", render: (e) => <span className="font-code text-[12px] tabular-nums">{formatKstDateTime(e.occurredDt, true)}</span> },
  {
    key: "user",
    header: "사용자",
    wrap: true,
    render: (e) => (
      <span className="break-all">
        {e.userNm ?? "알 수 없음"} <span className="font-code text-[11.5px] text-dim">{e.userId ?? "—"}</span>
      </span>
    ),
  },
  { key: "action", header: "기능", wrap: true, render: (e) => <span className="break-all">{e.actionNm}</span> },
  { key: "target", header: "대상", wrap: true, render: (e) => <span className="break-all font-code text-[11.5px] text-muted-foreground">{e.targetId ?? "—"}</span> },
  { key: "result", header: "결과", render: (e) => <ResultChip result={e.result} /> },
  { key: "ms", header: "처리 시간", align: "right", render: (e) => <span className="font-code tabular-nums text-muted-foreground">{e.durationMs === null ? "—" : `${e.durationMs}ms`}</span> },
]

/**
 * S14 사용·감사 기록: 필터 막대 + 로그인 기록(행을 펼치면 기능 타임라인) · 기능 기록 두 탭, 50개씩 쪽 넘김.
 * r2(시안 r3 +α, `showPlus`): 관리자 전용 안내 · 엑셀 내보내기 · 보존 기간 · 시간대별 사용량 · 이상 징후 · 기록 무결성 ·
 * 감사 항목 · 내려받기 제한 · 관리자 행위(최근) · 역할 안내 줄. 관리자 행위 탭 · 「대상 번호」 필터(서버 API 없음)는 담지 않는다.
 */
export function AdminLogsScreen(props: AdminLogsScreenProps) {
  const { status, errorAt, onRetry, isAdmin, tab, showPlus = true } = props

  if (!isAdmin) {
    return (
      <div className="p-[16px]">
        <Panel corners className="grid place-items-center px-[16px] py-[48px]">
          <p role="status" className="m-0 text-[13px] text-muted-foreground">
            관리자만 볼 수 있습니다
          </p>
        </Panel>
      </div>
    )
  }

  const rows = tab === "sessions" ? props.sessions : props.events
  const hasNext = rows.length >= LOG_PAGE_SIZE
  // 마지막 쪽이면 전체 개수를 알 수 있다(앞 쪽은 꽉 찼으므로)
  const total = hasNext ? undefined : (props.page - 1) * LOG_PAGE_SIZE + rows.length
  const regionLabel = tab === "sessions" ? "로그인 기록" : "기능 기록"

  const body = (() => {
    if (status === "loading") return <p className="m-0 px-[14px] py-[28px] text-center text-[12.5px] text-dim">불러오는 중…</p>
    if (status === "error") {
      // 조회 실패는 「결과 없음」으로 덮지 않는다
      return (
        <div className="px-[14px] py-[28px] text-center">
          <InlineError message="사용 기록을 확인하지 못했습니다" at={errorAt} onRetry={onRetry} />
        </div>
      )
    }
    const empty = status === "empty"
    return tab === "sessions" ? (
      <SessionTable sessions={empty ? [] : props.sessions} timelines={props.timelines} onRetryTimeline={props.onRetryTimeline} expandedSessionIds={props.expandedSessionIds} onToggleSession={props.onToggleSession} />
    ) : (
      <div className="overflow-x-auto">
        <DataGrid columns={EVENT_COLUMNS} rows={empty ? [] : props.events} rowKey={(e) => String(e.logId)} />
      </div>
    )
  })()

  // 요약 칸은 목록을 불러온 뒤에만(불러오는 중 · 실패에 숫자를 보이지 않는다)
  const insights = showPlus && (status === "ready" || status === "empty") ? (props.insights ?? null) : null

  const table = (
      <section aria-label={regionLabel} className="min-w-0">
        <Panel
          corners
          actions={
            <>
              <Segmented
                aria-label="기록 종류"
                items={[
                  { value: "sessions", label: "로그인 기록" },
                  { value: "events", label: "기능 기록" },
                ]}
                value={tab}
                onValueChange={(v) => props.onTabChange(v as "sessions" | "events")}
                className="my-[6px]"
              />
              <span className="ml-auto text-[12px] text-dim">50개씩 · 최신순</span>
            </>
          }
        >
          {body}
          {(status === "ready" || (status === "empty" && props.page > 1)) && (
            <Pagination page={props.page} pageSize={LOG_PAGE_SIZE} total={total} hasNext={hasNext} onPageChange={props.onPageChange} />
          )}
        </Panel>
      </section>
  )

  return (
    <div aria-busy={status === "loading"} className="min-w-0 p-[16px]">
      {showPlus && (
        <div
          data-plus
          className="mb-[12px] flex items-center gap-[8px] rounded-[10px] border border-solid border-warn/35 bg-warn-bg px-[12px] py-[9px] text-[12.5px] text-fg-2"
        >
          <span>
            <b className="text-warn">관리자 전용 메뉴</b> — 다른 역할은 메뉴가 없습니다. 내 접속 기록은 오른쪽 위 내 이름 → 「내 접속 기록」에서 봅니다.
          </span>
        </div>
      )}
      <Crumb items={["족적", "관리", "사용 기록"]} />
      <PageHead
        title="사용·감사 기록"
        description="누가 언제 로그인해 어떤 기능을 썼는지, 실패 · 권한 없음 기록까지 확인합니다. 기록은 고칠 수 없습니다."
        actions={
          showPlus ? (
            <span data-plus>
              <Button onClick={props.onExport}>엑셀 내보내기</Button>
            </span>
          ) : undefined
        }
      />

      <Panel corners className="mb-[12px]">
        <LogFilterBar filters={props.filters} onChange={props.onFiltersChange} onReset={props.onResetFilters} users={props.users} actions={props.actions} />
        <p className="m-0 px-[14px] pb-[10px] text-[11px] text-dim">결과 · 기능 필터는 기능 기록 탭에만 적용됩니다.</p>
      </Panel>

      {showPlus && (
        <div
          data-plus
          className="mb-[10px] flex items-center gap-[10px] rounded-[10px] border border-solid border-border bg-strip px-[12px] py-[8px] text-[12px] text-muted-foreground"
        >
          <Info aria-hidden="true" className="size-[14px] shrink-0 text-brand" />
          <span>
            보존 기간: 접속·사용 기록 <b className="text-fg-2">3년</b>, 관리자 행위 <b className="text-fg-2">5년</b> (예시 — 기관 규정 확인 필요). 지난 기록은 자동으로 보관 저장소로
            옮겨지고, 내보내기·조회도 이 화면에 다시 기록됩니다.
          </span>
        </div>
      )}
      {insights && <LogPulseRow insights={insights} />}

      {insights ? (
        <div className="grid items-start gap-[12px] xl:grid-cols-[minmax(0,1fr)_340px]">
          {table}
          <LogSidePanels insights={insights} />
        </div>
      ) : (
        table
      )}
      {showPlus && (
        <div
          data-plus
          className="mt-[12px] inline-flex flex-wrap items-center gap-[8px] rounded-[10px] border border-solid border-border bg-panel px-[12px] py-[8px] text-[12px] text-muted-foreground"
        >
          <Chip variant="blue">관리자</Chip> 모든 사람의 기록 · 내보내기 <span aria-hidden="true">|</span> <Chip>그 밖의 역할</Chip> 내 접속 기록만
        </div>
      )}
    </div>
  )
}
