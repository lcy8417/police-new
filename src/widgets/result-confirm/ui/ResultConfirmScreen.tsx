import * as React from "react"

import type { CrimeHistoryRow } from "@/entities/crime"
import type { FeatureCode } from "@/entities/session"
import { cn } from "@/shared/lib/utils"
import { AiProgress, AiTag, ScanOverlay } from "@/shared/ui/ai"
import {
  Button,
  Chip,
  Combobox,
  DataGrid,
  Field,
  FilterBar,
  InlineError,
  RadioRow,
  ViewCountSwitch,
  type DataGridColumn,
  type FilterGroup,
} from "@/shared/ui/kit"
import { Panel } from "@/shared/ui/panel"
import { EvidenceImage } from "@/shared/ui/viewer"

import { filterBlocks, hasActiveFilter, optionCount, type ConfirmFilterContext } from "../model/confirm-filter"
import { viewerRoles } from "../model/roles"
import type {
  BlockInsight,
  BlockViewCount,
  ConfirmFilterKey,
  ConfirmImageBlock,
  ConfirmInsight,
  ConfirmTarget,
  Judgement,
  ResultConfirmScreenProps,
} from "../model/types"
import { JUDGEMENT_LABEL } from "../model/judgement"
import { CandidateBox } from "./CandidateBox"

// S07 검색결과 확인(F28 발견/불발견 판정 → 이력 저장). SCAS 「검색결과 확인」 배치: 위 사건 요약표, 「검색이력」 띠,
// 이미지 블록마다 왼쪽 이미지번호 · 사진, 가운데 이력표, 오른쪽 판정 · 확인대상 상자. 판정은 이미지마다 따로(지금 저장 단위).
// 판정 값은 제어형(judgements). 저장 묶음은 1차 그대로 { aprthngNo, ftwrId, ranking, result }.
// r2: 시안 r3 +α(감정불능 · AI 추천 표 · 이미지별 근거 · 결과확인완료 n/m 막대 · 이미지 바로가기 · 확인 막대 · 판정 메모 ·
// 이력표 SCAS 칸 · 사건 요약 SCAS 칸 · 교차 검증 요청)을 `showPlus` 하나로 감싸 얹는다(감싼 요소마다 `data-plus`).
// 시안 data-role(결과확인완료 · 확인 막대 · 교차 검증 = 감정관 · 관리자)도 showPlus 일 때 따른다.
// r3(편의 — +α 아님): 이미지 블록 「1 · 3 · 5개씩」(넘치면 이전 · 다음) + 빠른 찾기 · 필터(판정 미완료만 · 발견/불발견/감정불능 ·
// AI 추천과 다름). 값은 제어형, 0건이면 「조건에 맞는 항목 없음 · 조건 지우기」.

const BASE_OPTIONS: { value: Judgement; label: string }[] = [
  { value: "found", label: "발견" },
  { value: "notFound", label: "불발견" },
]
// 시안의 감정불능(지금 판정 값에 없음 — +α)
const PLUS_OPTIONS = [...BASE_OPTIONS, { value: "unable" as Judgement, label: "감정불능" }]

// r3 이미지 블록 보기 개수
const BLOCK_COUNTS: readonly BlockViewCount[] = [1, 3, 5]

// 판정 저장은 지금 앱에서 사건 조회 권한 묶음(CRIME_SEARCH) 안에 있다
const WRITE_FEATURE: FeatureCode = "CRIME_SEARCH"

// 이력표 — 지금 이력 필드(검색 번호 · 순위 · 매칭 신발 · 등록 일시). SCAS 처럼 검색번호를 앞, 검색일을 끝에 둔다.
const HISTORY_COLUMNS: DataGridColumn<CrimeHistoryRow>[] = [
  { key: "searchNo", header: "검색번호", render: (r) => <span className="font-code tabular-nums">{r.searchNo}</span> },
  { key: "ranking", header: "순위", align: "right", render: (r) => <span className="font-code tabular-nums">{r.ranking}</span> },
  {
    key: "mtchgId",
    header: "매칭 신발",
    render: (r) => (r.mtchgId ? <span className="font-code">{r.mtchgId}</span> : <span className="text-dim">매칭 없음</span>),
  },
  { key: "frstRegistDt", header: "검색일", render: (r) => <span className="font-code tabular-nums text-muted-foreground">{r.frstRegistDt}</span> },
]

/** 시안 진행상태 칩 색: 확인대상선정 = 파랑 · 결과확인완료 = 초록 · 그 밖 = 기본 */
function StatusChip({ status }: { status: string }) {
  if (status === "확인대상선정") return <Chip variant="blue" className="h-[18px] px-[6px] text-[10px]">{status}</Chip>
  if (status === "결과확인완료") return <Chip variant="green-h18">{status}</Chip>
  return <Chip variant="h18">{status}</Chip>
}

/**
 * +α 이력표: 시안 SCAS 열(☑ · 검색번호 · 검색방법 · 진행상태 · 결과수 · 검색일) 뒤에 지금 기능 열(순위 · 매칭 신발)을 덧붙인다(§7 「새 칸은 맨 끝」).
 * 지금 이력 데이터에 없는 칸(검색방법 · 진행상태 · 결과수)은 +α 값(historyExtra)으로 채우고 없으면 빈 칸.
 */
function plusHistoryColumns(extra: BlockInsight["historyExtra"]): DataGridColumn<CrimeHistoryRow>[] {
  const plus = (node: React.ReactNode) => <span data-plus>{node}</span>
  return [
    { key: "check", header: "☑", render: () => plus("☑") },
    HISTORY_COLUMNS[0],
    {
      key: "method",
      header: "검색방법",
      render: (r) => {
        const e = extra[r.searchNo]
        return e
          ? plus(
              <>
                {e.method}
                {e.ai ? <span className="ml-[4px] font-code text-[10px] font-semibold tracking-[0.12em] text-ai">AI</span> : null}
              </>,
            )
          : null
      },
    },
    { key: "status", header: "진행상태", render: (r) => (extra[r.searchNo] ? plus(<StatusChip status={extra[r.searchNo].status} />) : null) },
    {
      key: "count",
      header: "결과수",
      render: (r) => (extra[r.searchNo] ? plus(<span className="font-code">{extra[r.searchNo].resultCount}</span>) : null),
    },
    HISTORY_COLUMNS[3],
    HISTORY_COLUMNS[1],
    HISTORY_COLUMNS[2],
  ]
}

/** 퍼센트(0~100) 그대로 반올림 — 69.99 → 「70%」. 숫자가 아니면 「—」 */
function formatPercent(similarity: number | string): string {
  const value = typeof similarity === "number" ? similarity : Number.parseFloat(similarity)
  return Number.isFinite(value) ? `${Math.round(Math.min(100, Math.max(0, value)))}%` : "—"
}

function TargetCard({ target }: { target: ConfirmTarget }) {
  return (
    <div className="flex items-center gap-[10px]">
      <span className="relative block h-[96px] w-[64px] flex-none overflow-hidden rounded-[6px] bg-paper">
        <img src={target.image} alt={`신발 ${target.ftwrId} 밑창`} className="block size-full object-contain" />
      </span>
      <span className="grid min-w-0 gap-[2px] text-[11.5px]">
        <b className="truncate font-code text-foreground">{`No. ${target.ftwrId}`}</b>
        <span className="font-code tabular-nums text-muted-foreground">{`#${target.ranking}`}</span>
        <span className="font-code tabular-nums text-fg-2">{formatPercent(target.similarity)}</span>
      </span>
    </div>
  )
}

/** 블록 하나의 +α 값(showPlus 일 때만) */
interface BlockPlus {
  insight: BlockInsight
  /** 저장된 판정(결과확인완료) */
  done: Judgement | undefined
  /** 감정관 · 관리자 */
  analyst: boolean
  onAction: (label: string) => void
}

function ImageBlock({
  block,
  value,
  canWrite,
  showPlus,
  analyst,
  plus,
  onChange,
  onSave,
}: {
  block: ConfirmImageBlock
  value: Judgement | null
  canWrite: boolean
  showPlus: boolean
  /** 감정관 · 관리자(시안 data-role="analyst admin") */
  analyst: boolean
  plus: BlockPlus | null
  onChange: (result: Judgement) => void
  onSave: (target: ConfirmTarget, result: Judgement) => void
}) {
  const { target } = block
  const done = plus?.done
  const [asking, setAsking] = React.useState(true)
  const [memo, setMemo] = React.useState("")
  // 시안 data-role="analyst admin": 판정 · 결과확인완료는 감정관 · 관리자(신규 기능을 끄면 1차 그대로)
  const decider = !showPlus || analyst
  const locked = !canWrite || !decider || target === null || done !== undefined
  const radioValue = done ?? value
  const options = showPlus ? PLUS_OPTIONS : BASE_OPTIONS
  const columns = plus ? plusHistoryColumns(plus.insight.historyExtra) : HISTORY_COLUMNS
  const emptyText = plus?.insight.emptyNote ?? "검색 이력 없음"
  const open = plus && done === undefined && target !== null

  return (
    <section
      data-image-block
      data-done={done ? "true" : undefined}
      aria-label={`${block.aprthngNo} 검색결과`}
      className="grid min-w-0 grid-cols-[120px_minmax(0,1fr)_minmax(320px,430px)] gap-x-[12px] gap-y-[6px] border-b border-solid border-line-2 px-[14px] py-[10px]"
    >
      <span data-block-title className="font-code text-[12px] text-foreground">
        {block.aprthngNo}
      </span>
      {plus ? (
        <div data-plus className="flex items-center justify-between text-[12px] text-muted-foreground">
          <span>☑ 전체선택</span>
          <span className="flex items-center gap-[6px]">
            검색방법
            <span className="inline-flex h-[26px] w-[120px] items-center rounded-[6px] border border-solid border-border bg-strip px-[8px] text-[12.5px] text-fg-2">
              전체<span className="ml-auto text-dim">▾</span>
            </span>
          </span>
        </div>
      ) : (
        <span />
      )}
      <div className="flex items-center justify-between gap-[8px]">
        <RadioRow
          name={`${block.aprthngNo} 판정`}
          options={options}
          value={radioValue}
          onValueChange={(v) => onChange(v as Judgement)}
          disabled={locked}
          className="text-[12.5px]"
        />
        {plus ? (
          <AiTag data-plus title="AI는 추천만 — 판정은 감정관이 왼쪽 라디오로 고릅니다">
            {`AI 추천 · ${JUDGEMENT_LABEL[plus.insight.aiRecommend]}`}
          </AiTag>
        ) : null}
        {decider ? (
          done ? (
            <Button data-plus size="sm" variant="ok" disabled>
              ✓ 결과확인완료
            </Button>
          ) : (
            <Button
              size="sm"
              variant="pri"
              disabled={locked || value === null}
              onClick={() => {
                if (target && value) onSave(target, value)
              }}
            >
              결과확인완료
            </Button>
          )
        ) : null}
      </div>

      {open && plus.analyst && asking ? (
        <div
          data-plus
          data-confirm-bar
          className="col-start-3 flex items-center justify-end gap-[8px] rounded-[8px] border border-solid border-warn-line bg-warn-bg py-[4px] pr-[6px] pl-[10px] text-[12px] text-fg-2"
        >
          확인대상을 저장하시겠습니까?
          <Button size="sm" variant="ok" onClick={() => plus.onAction("확인대상 저장")}>
            예
          </Button>
          <Button size="sm" onClick={() => setAsking(false)}>
            아니오
          </Button>
        </div>
      ) : null}

      <EvidenceImage src={block.sceneImage} alt={`${block.aprthngNo} 현장 족적`} className="self-start">
        {plus?.insight.remainArea !== undefined ? (
          <span data-plus>
            <span className="absolute inset-0 bg-[linear-gradient(172deg,transparent_0_30%,color-mix(in_srgb,var(--t-panel-3)_94%,transparent)_46%,var(--t-panel-3))]" />
            <Chip variant="amber-h18" className="absolute bottom-[5px] left-[5px] h-[17px] px-[5px] text-[9.5px]">
              {`남은 면적 ${plus.insight.remainArea}%`}
            </Chip>
          </span>
        ) : null}
        {open ? (
          <span data-plus>
            <ScanOverlay active className="motion-safe:[animation-duration:3.4s]" />
          </span>
        ) : null}
      </EvidenceImage>
      <div className="min-w-0 overflow-x-auto">
        <DataGrid
          columns={columns}
          rows={[...block.history]}
          rowKey={(r) => String(r.searchNo)}
          emptyText={emptyText}
          // 시안 S07 이력표 칸 크기(머리 28 · 줄 30 · 안쪽 6 · 글자 11.5) — SCAS 열이 늘어 칸을 좁힌다
          className={cn(plus && "text-[11.5px] [&_td]:h-[30px] [&_td]:px-[6px] [&_th]:h-[28px] [&_th]:px-[6px]")}
        />
      </div>
      <div className="grid content-start gap-[6px]">
        <div
          data-target-box
          className={cn(
            "flex min-h-[60px] gap-[8px] rounded-[10px] border border-solid border-border bg-panel-2 p-[8px]",
            plus && target && "min-h-[150px]",
            !plus && "block",
          )}
        >
          {plus ? (
            <CandidateBox insight={plus.insight} target={target} sceneImage={block.sceneImage} onAction={plus.onAction} />
          ) : (
            <>
              <div className="mb-[6px] text-[11.5px] text-muted-foreground">확인대상</div>
              {target ? <TargetCard target={target} /> : <span className="text-[12px] text-dim">확인대상 없음</span>}
            </>
          )}
        </div>
        {open ? (
          <Field
            data-plus
            aria-label={`${block.aprthngNo} 판정 메모`}
            placeholder="판정 메모(선택) — 예) 상·중 부위 칸 수 일치, 하 부위 소실"
            readOnly={!plus.analyst}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        ) : null}
      </div>
    </section>
  )
}

/** +α 「검색이력」 띠 오른쪽: 이미지 바로가기 · 결과확인완료 n/m 막대 · AI 추천과 판정 일치 */
function ProgressStrip({
  blocks,
  insight,
  completed,
  onJump,
}: {
  blocks: readonly ConfirmImageBlock[]
  insight: ConfirmInsight
  completed: Readonly<Record<string, Judgement | undefined>>
  /** 바로가기 — 그 블록이 보이게(보기 개수로 가려져 있으면 그 블록부터) 스크롤 */
  onJump: (aprthngNo: string) => void
}) {
  const doneBlocks = blocks.filter((b) => completed[b.aprthngNo] !== undefined)
  const agree = doneBlocks.filter((b) => completed[b.aprthngNo] === insight.blocks[b.aprthngNo]?.aiRecommend).length
  const suffix = (no: string) => no.slice(no.lastIndexOf("_"))
  return (
    <span data-plus data-progress-strip className="ml-auto flex flex-wrap items-center gap-[5px] text-[11.5px] font-normal">
      이미지 바로가기
      {blocks.map((b) => {
        const done = completed[b.aprthngNo] !== undefined
        return (
          <button
            key={b.aprthngNo}
            type="button"
            onClick={() => onJump(b.aprthngNo)}
            className="cursor-pointer border-none bg-transparent p-0"
          >
            <Chip variant={done ? "green-h18" : "amber-h19"} className="h-[19px] px-[8px] text-[10.5px]">
              {done ? `${suffix(b.aprthngNo)} ✓` : `${suffix(b.aprthngNo)} 확인 중`}
            </Chip>
          </button>
        )
      })}
      <span className="ml-[6px]">
        결과확인완료 <b className="font-code">{`${doneBlocks.length} / ${blocks.length}`}</b>
      </span>
      <AiProgress
        state="running"
        value={blocks.length ? doneBlocks.length / blocks.length : 0}
        label="결과확인완료"
        className="h-[5px] w-[96px] bg-canvas/45"
      />
      <span className="text-paper/85">
        AI 추천과 판정 일치 <b className="font-code">{`${agree} / ${doneBlocks.length}`}</b>
      </span>
    </span>
  )
}

export function ResultConfirmScreen({
  status,
  errorAt,
  onRetry,
  isAdmin,
  features,
  caseSummary,
  blocks,
  judgements,
  onJudgementChange,
  onSaveJudgement,
  showPlus = true,
  insight,
  completed = {},
  crossReviewer = null,
  onCrossReviewerChange,
  onRequestCrossReview,
  onPlusAction,
  blockCount: blockCountProp,
  onBlockCountChange,
  query = "",
  onQueryChange,
  filters = {},
  onFiltersChange,
  onClearFilters,
}: ResultConfirmScreenProps) {
  const canWrite = isAdmin || features.includes(WRITE_FEATURE)
  const roles = viewerRoles(isAdmin, features)
  const plus = showPlus && insight ? insight : null
  const action = (label: string) => onPlusAction?.(label)

  // ── r3 빠른 찾기 · 필터 · 보기 개수(넘치면 앞뒤 넘김 — 넘긴 자리는 저장하지 않는 위젯 안 상태) ──
  const ctx: ConfirmFilterContext = { completed, judgements, insight: plus }
  const visible = filterBlocks(blocks, query, filters, ctx)
  const filterActive = hasActiveFilter(query, filters)
  const [rawStart, setStart] = React.useState(0)
  // 보기 개수를 받지 않으면(r3 이전 모양) 블록을 모두 보인다 — 넘기기 단추도 그때는 없으므로 잘리면 안 된다
  const blockCount = blockCountProp ?? Math.max(1, visible.length)
  const lastStart = Math.max(0, visible.length - blockCount)
  const start = Math.min(rawStart, lastStart)
  const groupOf = (key: ConfirmFilterKey, label: string, options: { value: string; label: string }[]): FilterGroup => ({
    key,
    label,
    value: filters[key] ?? [],
    options: options.map((o) => ({ ...o, count: optionCount(blocks, key, o.value, ctx) })),
  })
  const filterGroups: FilterGroup[] = [
    groupOf("progress", "진행", [{ value: "pending", label: "판정 미완료만" }]),
    groupOf("judgement", "판정", showPlus ? PLUS_OPTIONS : BASE_OPTIONS),
    ...(plus ? [groupOf("ai", "AI", [{ value: "diff", label: "AI 추천과 다름" }])] : []),
  ]
  const scrollToBlock = (aprthngNo: string) =>
    document.querySelector<HTMLElement>(`[aria-label="${aprthngNo} 검색결과"]`)?.scrollIntoView?.({ block: "start" })
  const jumpRef = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (jumpRef.current === null) return
    scrollToBlock(jumpRef.current)
    jumpRef.current = null
  })
  const jumpTo = (aprthngNo: string) => {
    const index = visible.findIndex((b) => b.aprthngNo === aprthngNo)
    if (index >= 0 && (index < start || index >= start + blockCount)) {
      // 보기 개수로 가려진 블록이면 그 블록부터 보이게 넘긴 뒤 스크롤
      jumpRef.current = aprthngNo
      setStart(Math.min(index, lastStart))
    } else {
      scrollToBlock(aprthngNo)
    }
  }

  const summary: [string, string][] = [
    ["감정번호", caseSummary.apprslReqestNo ?? ""],
    ["범죄명", caseSummary.crimeNm ?? ""],
    ["의뢰관서", caseSummary.rqestGrfcNm ?? ""],
  ]
  const pending = blocks.filter((b) => completed[b.aprthngNo] === undefined)
  const allDone = blocks.length > 0 && pending.length === 0

  const th =
    "w-[84px] border-b border-solid border-line-2 bg-strip px-[10px] py-[6px] text-left text-[12px] font-normal whitespace-nowrap text-muted-foreground"
  const td = "border-b border-solid border-line-2 px-[10px] py-[6px] break-keep [overflow-wrap:anywhere] text-fg-2"

  let body: React.ReactNode
  if (status === "loading") {
    body = (
      <div aria-busy="true" className="grid min-h-[240px] place-content-center text-[12px] text-muted-foreground">
        검색 결과를 불러오는 중
      </div>
    )
  } else if (status === "error") {
    body = (
      <div className="grid min-h-[240px] place-content-center">
        <InlineError message="검색 결과를 확인 못 함" at={errorAt} onRetry={onRetry} />
      </div>
    )
  } else if (status === "empty") {
    body = (
      <div className="grid min-h-[240px] place-content-center justify-items-center gap-[4px] text-[12.5px] text-muted-foreground">
        <span className="font-semibold text-fg-2">결과 없음</span>
        <span className="text-[11.5px] text-dim">이 사건에 확인할 검색 결과가 없습니다</span>
      </div>
    )
  } else {
    const shownBlocks = visible.slice(start, start + blockCount)
    body = (
      <>
        {onFiltersChange || onBlockCountChange ? (
          // r3 편의 줄: 빠른 찾기 · 필터 · 보기 개수 · 앞뒤 넘기기
          <div
            data-r3-toolbar
            className="flex flex-wrap items-center gap-x-[14px] gap-y-[6px] border-b border-solid border-line-2 px-[14px] py-[8px]"
          >
            {onFiltersChange ? (
              <FilterBar
                query={query}
                onQueryChange={(q) => onQueryChange?.(q)}
                filters={filterGroups}
                onFilterChange={(key, values) => onFiltersChange(key as ConfirmFilterKey, values)}
                onClear={() => onClearFilters?.()}
                resultCount={visible.length}
                total={blocks.length}
                searchPlaceholder="이미지번호 · 신발 번호"
                className="min-w-0 flex-1"
              />
            ) : null}
            {onBlockCountChange ? (
              <span className="inline-flex items-center gap-[8px]">
                <ViewCountSwitch<BlockViewCount>
                  label="한 번에"
                  options={BLOCK_COUNTS}
                  value={blockCountProp ?? 5}
                  onChange={(n) => {
                    onBlockCountChange(n)
                    setStart(0)
                  }}
                />
                {visible.length > blockCount ? (
                  <span data-block-nav className="inline-flex items-center gap-[4px]">
                    <Button size="sm" disabled={start <= 0} onClick={() => setStart(Math.max(0, start - blockCount))}>
                      이전
                    </Button>
                    <span className="min-w-[64px] text-center font-code text-[11.5px] tabular-nums text-muted-foreground">
                      {`${start + 1}–${Math.min(visible.length, start + blockCount)} / ${visible.length}`}
                    </span>
                    <Button
                      size="sm"
                      disabled={start + blockCount >= visible.length}
                      onClick={() => setStart(Math.min(lastStart, start + blockCount))}
                    >
                      다음
                    </Button>
                  </span>
                ) : null}
              </span>
            ) : null}
          </div>
        ) : null}
        {filterActive && visible.length === 0 ? (
          <div
            data-filter-empty
            className="m-[14px] grid min-h-[160px] place-content-center justify-items-center gap-[8px] rounded-[10px] border border-dashed border-line-3 text-[12.5px] text-muted-foreground"
          >
            <span className="font-semibold text-fg-2">조건에 맞는 항목 없음</span>
            <span className="text-[11.5px] text-dim">이미지 블록은 그대로 있습니다 — 조건을 지워 보세요</span>
            <Button size="sm" onClick={() => onClearFilters?.()}>
              조건 지우기
            </Button>
          </div>
        ) : (
          shownBlocks.map((block) => {
            const bi = plus?.blocks[block.aprthngNo]
            return (
              <ImageBlock
                key={block.aprthngNo}
                block={block}
                value={judgements[block.aprthngNo] ?? null}
                canWrite={canWrite}
                showPlus={showPlus}
                analyst={roles.analyst}
                plus={bi ? { insight: bi, done: completed[block.aprthngNo], analyst: roles.analyst, onAction: action } : null}
                onChange={(result) => onJudgementChange(block.aprthngNo, result)}
                onSave={(target, result) =>
                  onSaveJudgement({ aprthngNo: block.aprthngNo, ftwrId: target.ftwrId, ranking: target.ranking, result })
                }
              />
            )
          })
        )}
      </>
    )
  }

  return (
    <Panel
      title="검색결과 확인"
      className="min-w-0"
      actions={
        plus ? (
          <span data-plus className="text-[12px] text-muted-foreground">
            {plus.headNote}
          </span>
        ) : undefined
      }
    >
      <div className="px-[14px] pt-[10px] pb-[4px]">
        <table className="w-full border-collapse border-t border-solid border-line-2 text-[12.5px]">
          <tbody>
            <tr>
              {summary.map(([label, value]) => (
                <React.Fragment key={label}>
                  <th scope="row" className={th}>
                    {label}
                  </th>
                  <td className={td}>
                    <span className={label === "감정번호" ? "font-code" : undefined}>{value}</span>
                  </td>
                </React.Fragment>
              ))}
              {plus ? (
                <>
                  <th data-plus scope="row" className={th}>
                    범행장소
                  </th>
                  <td data-plus className={td}>
                    {plus.caseExtra.crimePlace}
                  </td>
                </>
              ) : null}
            </tr>
            {plus ? (
              <>
                <tr data-plus>
                  <th scope="row" className={th}>
                    문서번호
                  </th>
                  <td className={cn(td, "font-code")}>{plus.caseExtra.docNo}</td>
                  <th scope="row" className={th}>
                    용의자유무
                  </th>
                  <td className={td}>{plus.caseExtra.suspect}</td>
                  <th scope="row" className={th}>
                    시작
                  </th>
                  <td className={cn(td, "tabular-nums")}>{plus.caseExtra.start}</td>
                  <th scope="row" className={th}>
                    종료
                  </th>
                  <td className={cn(td, "tabular-nums")}>{plus.caseExtra.end}</td>
                </tr>
                <tr data-plus>
                  <th scope="row" className={th}>
                    범행주소
                  </th>
                  <td colSpan={7} className={td}>
                    {plus.caseExtra.address}
                  </td>
                </tr>
                <tr data-plus>
                  <th scope="row" className={th}>
                    사건개요
                  </th>
                  <td colSpan={7} className={cn(td, "text-muted-foreground")}>
                    {plus.caseExtra.summary}
                  </td>
                </tr>
              </>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="mx-[14px] mt-[8px] flex min-h-[32px] flex-wrap items-center gap-[10px] rounded-[8px] bg-brand-3 px-[12px] py-[4px] text-[12.5px] font-semibold text-paper">
        검색이력
        {plus && status === "ready" ? (
          <ProgressStrip blocks={blocks} insight={plus} completed={completed} onJump={jumpTo} />
        ) : null}
      </div>
      <div className="min-w-0">{body}</div>
      {plus && status === "ready" ? (
        <div
          data-plus
          data-cross-review
          className="flex flex-wrap items-center justify-end gap-[10px] rounded-b-[14px] bg-strip px-[14px] py-[10px]"
        >
          {roles.analyst ? (
            <>
              <span className="text-[12px] text-muted-foreground">모든 이미지가 결과확인완료되면 → 검증요청(교차 검증)</span>
              <span className="text-[12px] text-fg-2">교차 검증자</span>
              <span className="w-[200px]">
                <Combobox
                  items={[...plus.reviewers]}
                  value={crossReviewer}
                  onValueChange={(v) => onCrossReviewerChange?.(v)}
                  placeholder="교차 검증자 고르기"
                />
              </span>
              <Button
                variant="pri"
                disabled={!allDone || !roles.crossReview || !crossReviewer}
                onClick={() => {
                  if (crossReviewer) onRequestCrossReview?.(crossReviewer)
                }}
              >
                교차 검증 요청
              </Button>
              {pending.length > 0 ? (
                <span className="text-[11px] text-dim">
                  {`${pending.map((b) => b.aprthngNo.slice(b.aprthngNo.lastIndexOf("_"))).join(" · ")} 완료 후 켜짐 · 본인은 고를 수 없음`}
                </span>
              ) : null}
            </>
          ) : null}
          {roles.verifier ? <Chip>기술책임자: 읽기 전용</Chip> : null}
          {roles.investigator ? <Chip>수사관: 판정은 감정서 완료 뒤 공개</Chip> : null}
        </div>
      ) : null}
    </Panel>
  )
}
