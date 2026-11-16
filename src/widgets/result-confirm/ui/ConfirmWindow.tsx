import * as React from "react"
import { ArrowUpRight, FileText, Send } from "lucide-react"

import { FEATURES } from "@/entities/session"
import { cn } from "@/shared/lib/utils"
import { InlineError, ListHeadRow, ListNote, ListRow, StatePill, WorkbenchButton } from "@/shared/ui/kit"
import { PaneHead } from "@/shared/ui/panel"

import { JUDGEMENT_LABEL } from "../model/judgement"
import { viewerRoles } from "../model/roles"
import type { ConfirmRow, ConfirmWindowProps, CrossReviewState, Judgement } from "../model/types"

// 사건 창 「결과 확인」 탭(R6 — 사건 전체 판정 한 화면). 다른 작업 탭과 같은 결:
//   왼쪽 — PaneHead 「이미지별 판정」 + 먹색 작업판(`data-theme="dark"`) 안 로망 목록 표:
//          썸네일 · 번호 · 검색 여부 · 판정(발견 · 불발견 · 감정불능 — 누르면 바로 저장) · 확인대상 신발 · 점수 · 열기
//   오른쪽 보조 칸(밝은 바탕 · 왼쪽 가는 선) — 사건 결론(판정 수) · 교차 검증자
//   바닥 단추 줄 — 남은 일 한 줄 | 교차 검증 요청 · 감정서로
// 결재 단계는 없다(11/16 사용자 「결재는 없어」). 겹치는 제목 줄 · 닫기 · 설명 띠는 그리지 않는다(단독 진열 `/dev/s07` 은 그대로).

type RowFilter = "all" | "pending"

const OPTIONS: readonly Judgement[] = ["found", "notFound", "unable"]
/** 표 칸 폭 — 머리 줄과 줄이 같이 쓴다 */
const COLS = "grid grid-cols-[124px_100px_minmax(188px,1.1fr)_minmax(132px,1fr)_60px_28px] gap-x-3"
const NOT_SEARCHED = "검색하지 않은 이미지는 발견 판정을 할 수 없습니다"

const CROSS_PILL: Record<CrossReviewState, { tone: "pending" | "fact" | "done"; text: string }> = {
  none: { tone: "pending", text: "요청 전" },
  requested: { tone: "fact", text: "검증 중" },
  done: { tone: "done", text: "검증 끝" },
}

/** 사건 결론 — 발견이 하나라도 있으면 발견, 모두 판정했으면 불발견(모두 감정불능이면 감정불능), 아니면 판정 중 */
function conclusionOf(counts: Record<Judgement | "pending", number>, total: number): string {
  if (total === 0) return "—"
  if (counts.found > 0) return "발견"
  if (counts.pending > 0) return "판정 중"
  return counts.unable === total ? "감정불능" : "불발견"
}

export function ConfirmWindow(props: ConfirmWindowProps) {
  const { status, isAdmin, features, rows, crossReview, reviewers, reviewer, lockedReason } = props
  const roles = viewerRoles(isAdmin, features)
  const canJudge = !!props.onJudgementChange && roles.analyst && (isAdmin || features.includes(FEATURES.CRIME_SEARCH))
  const [filter, setFilter] = React.useState<RowFilter>("all")

  const counts = { found: 0, notFound: 0, unable: 0, pending: 0 }
  for (const r of rows) counts[r.judgement ?? "pending"] += 1
  const total = rows.length
  const shown = filter === "pending" ? rows.filter((r) => r.judgement === null) : rows
  const allJudged = total > 0 && counts.pending === 0
  const reviewerLabel = reviewers.find((r) => r.value === reviewer)?.label ?? null

  const canRequest = roles.crossReview && crossReview === "none" && allJudged && reviewer !== null
  const canReport = roles.analyst && crossReview === "done"
  const requestWhy =
    crossReview !== "none"
      ? "이미 교차 검증을 요청했습니다"
      : !allJudged
        ? `판정 전 이미지 ${counts.pending}장이 남았습니다`
        : reviewer === null
          ? "교차 검증자를 고르세요"
          : undefined
  const reportWhy = crossReview === "done" ? undefined : "교차 검증이 끝나면 감정서로 넘길 수 있습니다"
  const nextLine =
    crossReview === "done"
      ? "교차 검증 끝 · 감정서로 넘길 수 있습니다"
      : crossReview === "requested"
        ? `교차 검증 중${reviewerLabel ? ` · ${reviewerLabel}` : ""}`
        : allJudged
          ? "모든 이미지 판정 끝 · 교차 검증을 요청하세요"
          : `판정 전 ${counts.pending}장`

  const judgeCell = (row: ConfirmRow) => {
    const locked = !canJudge || lockedReason !== undefined
    return (
      <span role="group" aria-label={`_${row.no} 판정`} className="inline-flex items-center gap-[2px]">
        {OPTIONS.map((j) => {
          const blocked = j === "found" && row.searchNo === null
          return (
            <WorkbenchButton
              key={j}
              size="sm"
              variant="ghost"
              aria-pressed={row.judgement === j}
              disabled={locked || blocked}
              title={blocked ? NOT_SEARCHED : (lockedReason ?? undefined)}
              onClick={() => props.onJudgementChange?.(row, j)}
            >
              {JUDGEMENT_LABEL[j]}
            </WorkbenchButton>
          )
        })}
      </span>
    )
  }

  const shoeCell = (row: ConfirmRow) => {
    const shoe = row.shoe
    if (!shoe) return <span className="text-[11px] text-faint">—</span>
    const candidate = row.judgement === null
    return (
      <span className={cn("flex min-w-0 items-center gap-2", candidate && "opacity-60")}>
        <img src={shoe.image} alt="" className="size-9 shrink-0 rounded-[6px] border border-solid border-border bg-canvas object-contain" />
        <span className="grid min-w-0">
          <b className="truncate font-code text-[12.5px] font-bold text-foreground">{shoe.ftwrId}</b>
          <span className="truncate text-[11px] text-muted-foreground">{candidate ? `1위 후보 · #${shoe.ranking}` : `확인대상 · #${shoe.ranking}`}</span>
        </span>
      </span>
    )
  }

  let table: React.ReactNode
  if (status === "loading") {
    table = (
      <p role="status" aria-busy="true" className="m-0 grid h-full place-content-center text-[12.5px] text-muted-foreground">
        판정 목록을 불러오는 중
      </p>
    )
  } else if (status === "error") {
    table = (
      <div className="grid h-full place-content-center">
        <InlineError message="판정 목록을 확인 못 함" at={props.errorAt} onRetry={props.onRetry} />
      </div>
    )
  } else if (total === 0) {
    table = <ListNote>확인할 이미지가 없습니다</ListNote>
  } else {
    table = (
      <div role="group" aria-label="이미지별 판정" className="min-w-[680px]">
        <ListHeadRow className={COLS}>
          <span>이미지</span>
          <span>검색</span>
          <span>판정</span>
          <span>확인대상 신발</span>
          <span className="text-right">점수</span>
          <span />
        </ListHeadRow>
        {shown.length === 0 ? <ListNote>판정 전 이미지가 없습니다</ListNote> : null}
        {shown.map((row) => (
          <ListRow key={row.no} role="group" aria-label={`${row.imageNo} 판정`} className={cn(COLS, "h-[54px] cursor-default")}>
            <span className="flex min-w-0 items-center gap-2">
              <img src={row.thumb} alt="" className="size-10 shrink-0 rounded-[6px] border border-solid border-border bg-canvas object-cover" />
              <span className="grid min-w-0">
                <b className="font-code text-[13px] font-bold text-foreground">_{row.no}</b>
                <span className="text-[11px] text-muted-foreground">{row.kind}</span>
              </span>
            </span>
            <span className="min-w-0">
              {row.searchNo ? (
                <StatePill tone="done" title={`검색 ${row.searchNo}`}>
                  <span className="font-code">{row.searchNo}</span>
                </StatePill>
              ) : (
                <StatePill tone="pending">{row.judgement === null ? "검색 전" : "검색 안 함"}</StatePill>
              )}
            </span>
            {judgeCell(row)}
            {shoeCell(row)}
            <span
              className={cn(
                "text-right font-code text-[16px] font-bold tabular-nums",
                row.shoe ? (row.judgement === null ? "text-muted-foreground" : "text-foreground") : "text-faint"
              )}
            >
              {row.shoe ? row.shoe.score.toFixed(1) : "—"}
            </span>
            {props.onOpenImage ? (
              <WorkbenchButton
                size="sm"
                variant="ghost"
                icon={ArrowUpRight}
                iconOnly
                aria-label={`_${row.no} 열기`}
                title={row.judgement === "found" ? "정밀 대조 탭으로" : "검색 결과 탭으로"}
                onClick={() => props.onOpenImage?.(row)}
              />
            ) : (
              <span />
            )}
          </ListRow>
        ))}
      </div>
    )
  }

  const countRows: [string, number][] = [
    ["발견", counts.found],
    ["불발견", counts.notFound],
    ["감정불능", counts.unable],
    ["판정 전", counts.pending],
  ]
  const cross = CROSS_PILL[crossReview]

  return (
    <section aria-label="결과 확인" data-slot="result-confirm-window" className="@container flex h-full min-h-0 min-w-0 flex-col gap-[8px] p-[12px]">
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_232px] @max-[920px]:grid-cols-[minmax(0,1fr)_200px]">
        <section aria-label="이미지별 판정 칸" className="flex min-h-0 min-w-0 flex-col gap-[8px] pr-[14px] @max-[920px]:pr-[10px]">
          <PaneHead
            title="이미지별 판정"
            sub={<span className="font-code">{`${props.aprthngNo} · ${total}장`}</span>}
            tip="판정 단추를 누르면 바로 저장됩니다. 줄 끝 화살표로 그 이미지의 검색 결과 · 정밀 대조 탭을 엽니다."
            end={
              total > 0 ? (
                <span role="group" aria-label="줄 거르기" className="inline-flex items-center gap-[2px]">
                  <WorkbenchButton size="sm" variant="ghost" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
                    전체 <span className="font-code">{total}</span>
                  </WorkbenchButton>
                  <WorkbenchButton size="sm" variant="ghost" aria-pressed={filter === "pending"} onClick={() => setFilter("pending")}>
                    판정 전 <span className="font-code">{counts.pending}</span>
                  </WorkbenchButton>
                </span>
              ) : null
            }
          />
          <div
            data-theme="dark"
            data-slot="confirm-workbench"
            className="min-h-0 flex-1 overflow-auto rounded-[12px] border border-solid border-border bg-panel text-foreground [box-shadow:0_6px_18px_var(--t-panel-drop)]"
          >
            {table}
          </div>
        </section>

        <aside aria-label="사건 결론 칸" className="flex min-h-0 min-w-0 flex-col gap-[12px] overflow-y-auto border-0 border-l border-solid border-border pl-[14px] @max-[920px]:pl-[10px]">
          <PaneHead title="사건 결론" />
          <div className="grid gap-[10px] px-1">
            <div className="flex items-baseline justify-between gap-2">
              <b data-testid="confirm-conclusion" className="text-[16px] font-bold text-foreground">
                {conclusionOf(counts, total)}
              </b>
              <span className="font-code text-[11px] text-muted-foreground tabular-nums">{`판정 ${total - counts.pending} / ${total}`}</span>
            </div>
            <dl className="m-0 grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-[5px] text-[12.5px]">
              {countRows.map(([k, n]) => (
                <React.Fragment key={k}>
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className={cn("m-0 text-right font-code tabular-nums", n > 0 ? "font-bold text-foreground" : "text-faint")}>{n}</dd>
                </React.Fragment>
              ))}
            </dl>
          </div>

          <PaneHead title="교차 검증" end={<StatePill tone={cross.tone}>{cross.text}</StatePill>} />
          <div className="grid gap-[6px] px-1">
            {crossReview === "none" ? (
              <span role="group" aria-label="교차 검증자" className="grid gap-[2px]">
                {reviewers.map((r) => (
                  <WorkbenchButton
                    key={r.value}
                    size="sm"
                    variant="ghost"
                    aria-pressed={reviewer === r.value}
                    disabled={!roles.crossReview}
                    className="justify-start"
                    onClick={() => props.onReviewerChange(r.value)}
                  >
                    {r.label}
                  </WorkbenchButton>
                ))}
              </span>
            ) : (
              <span className="text-[12.5px] text-fg-2">{reviewerLabel ?? "—"}</span>
            )}
          </div>
        </aside>
      </div>

      {/* 바닥 단추 줄: 남은 일 한 줄 | 교차 검증 요청 · 감정서로(닫기는 창 ✕) */}
      <div className="flex shrink-0 flex-wrap items-center gap-[8px] border-0 border-t border-solid border-border pt-[8px]">
        <span className="text-[11px] text-muted-foreground">{status === "ready" ? nextLine : ""}</span>
        <span className="ml-auto inline-flex items-center gap-[8px]">
          {roles.crossReview ? (
            <WorkbenchButton
              variant={crossReview === "none" ? "primary" : "soft"}
              icon={Send}
              disabled={!canRequest}
              title={requestWhy}
              onClick={() => reviewer && props.onRequestCrossReview(reviewer)}
            >
              교차 검증 요청
            </WorkbenchButton>
          ) : null}
          {roles.analyst ? (
            <WorkbenchButton
              variant={crossReview === "done" ? "primary" : "soft"}
              icon={FileText}
              disabled={!canReport}
              title={reportWhy}
              onClick={props.onToReport}
            >
              감정서로
            </WorkbenchButton>
          ) : null}
        </span>
      </div>
    </section>
  )
}
