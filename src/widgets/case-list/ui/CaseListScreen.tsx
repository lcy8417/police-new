import * as React from "react"

import { FEATURES } from "@/entities/session"
import { cn } from "@/shared/lib/utils"
import { AiTag, LiveDot, ScanOverlay } from "@/shared/ui/ai"
import {
  Button,
  Checkbox,
  Chip,
  Field,
  InlineError,
  Pagination,
  RadioRow,
  Segmented,
} from "@/shared/ui/kit"
import { ButtonBar, Panel, SearchForm, Stepper, type SearchFormRow } from "@/shared/ui/panel"
import { SoleThumb } from "@/shared/ui/viewer"

import type { CaseListFilters, CaseListRow, CaseListScreenProps } from "../model/types"
import { CaseTable, type CaseTableColumn } from "./CaseTable"
import { PlusTiles } from "./PlusTiles"
import { RowSummary } from "./RowSummary"

// S01 사건관리 목록(SCAS 「족윤적 > 사건관리」 탭). 값만 받아 그린다 — 서버 호출 · 전역 상태 없음.
// 검색 폼 3열×5행 · 툴바 순서 · 열 순서는 SCAS 그대로(정본 스킬 원칙). 새 열(사건 진행)은 맨 끝에만 덧붙인다.
// r2: 시안 r3 의 +α(AI 사전 처리 · 할 일 타일 · 실시간 · 진행 열 · 행 펼침 · AI 표식)는 showPlus 하나로 숨긴다(`data-plus`).

type ViewMode = "basic" | "full"

const STAGE_STEPS = ["검증요청", "교차 검증", "감정서", "결재"]
const STAGE_LABELS = ["검증요청", "교차 검증", "감정서", "결재", "결재완료"]

const dash = (v: string) => (v === "" ? "—" : v)

function Num({ v, tone }: { v: number; tone?: string }) {
  return <span className={cn("font-code tabular-nums", v ? (tone ?? "text-foreground") : "text-faint")}>{v}</span>
}

/** 장마다 한 칸짜리 막대(회색 등록 · 주황 검색 · 파랑 확인) */
function ProgressCell({ row }: { row: CaseListRow }) {
  const { registered, searched, confirmed } = row.progress
  const cells = [
    ...Array<string>(confirmed).fill("bg-brand-2"),
    ...Array<string>(searched).fill("bg-warn"),
    ...Array<string>(registered).fill("bg-line-3"),
  ]
  return (
    <div className="grid gap-[3px]">
      <div className="grid grid-cols-3 gap-[2px] text-center text-[11.5px]">
        <Num v={registered} />
        <Num v={searched} />
        <Num v={confirmed} />
      </div>
      <div
        className="flex gap-[2px]"
        title={`${cells.length}장 중 등록 ${registered} · 검색 ${searched} · 확인 ${confirmed}`}
      >
        {cells.map((c, i) => (
          <i key={i} className={cn("h-[4px] flex-1 rounded-[2px]", c)} />
        ))}
      </div>
    </div>
  )
}

function ResultCell({ row }: { row: CaseListRow }) {
  const { found, missed, unable } = row.results
  return (
    <div className="grid grid-cols-3 gap-[2px] text-center text-[11.5px]">
      <Num v={found} tone="text-ok-fg" />
      <Num v={missed} tone="text-fg-2" />
      <Num v={unable} tone="text-warn" />
    </div>
  )
}

function Clip({ text, max }: { text: string; max: string }) {
  return (
    <span title={text} className={cn("block truncate", max)}>
      {dash(text)}
    </span>
  )
}

/** (+α) 사건 진행 열 칸: 단계 막대 + 단계 이름(교차 검증이면 검증자) */
function StageCell({ row }: { row: CaseListRow }) {
  const stage = row.stage ?? -1
  if (stage < 0) return <span className="text-[11px] text-faint">이미지 확인 중</span>
  return (
    <div className="grid gap-[3px]">
      <Stepper steps={STAGE_STEPS} current={stage} width={20} />
      <span className={cn("text-[11px] leading-[1.2]", stage === 4 ? "text-ok-fg" : "text-fg-2")}>
        {STAGE_LABELS[Math.min(stage, 4)]}
        {stage === 1 && row.crossReviewer ? ` · ${row.crossReviewer.split(" ")[0]}` : ""}
      </span>
    </div>
  )
}

type StringFilterKey = Exclude<
  { [K in keyof CaseListFilters]: CaseListFilters[K] extends string ? K : never }[keyof CaseListFilters],
  "kind"
>

const FIELD_ARIA = (label: string) => ({ "aria-label": label })

export function CaseListScreen({
  status,
  errorAt,
  onRetry,
  isAdmin,
  features,
  rows,
  total,
  page,
  pageSize,
  onPageChange,
  filters,
  onFiltersChange,
  onSearch,
  onReset,
  onOpenCase,
  onRegister,
  onSearchCase,
  onConfirmCase,
  showPlus = true,
  aiPrep,
  tasks,
  liveAt,
  onMockAction,
}: CaseListScreenProps) {
  // 보기 방식 · 펼친 행은 저장하지 않는 화면 안 모양이라 위젯 안 상태(spec §6-1)
  const [viewMode, setViewMode] = React.useState<ViewMode>("basic")
  const [expanded, setExpanded] = React.useState<string | null>(
    () => rows.find((r) => r.summary?.defaultOpen)?.aprthngNo ?? null
  )

  const canRegister = isAdmin || features.includes(FEATURES.CRIME_REGISTER)
  const canSearch = isAdmin || features.includes(FEATURES.CRIME_SEARCH)
  // 시안 data-role「analyst admin」: 기술책임자(결재만 하는 사람)에게는 행 끝 버튼을 숨긴다
  const verifierOnly = !isAdmin && features.includes(FEATURES.REPORT_APPROVE) && !features.includes(FEATURES.EXAM_DECIDE)
  const canAct = canSearch && !(showPlus && verifierOnly)
  const has = (code: (typeof FEATURES)[keyof typeof FEATURES]) => isAdmin || features.includes(code)
  const analystView = has(FEATURES.EXAM_DECIDE)

  const set = <K extends keyof CaseListFilters>(key: K, value: CaseListFilters[K]) =>
    onFiltersChange({ ...filters, [key]: value })
  const setStr = (key: StringFilterKey, value: string) => onFiltersChange({ ...filters, [key]: value })
  // 목록 열에 값이 없어 걸러 낼 수 없는 칸은 자리만 두고 잠근다(spec §5-2 규칙 3)
  const pendingProps = (pending: boolean) => (pending ? { disabled: true, title: "준비 중" } : {})
  const text = (key: StringFilterKey, label: string, variant: "text" | "mono" = "text", pending = false) => (
    <Field
      variant={variant}
      value={filters[key]}
      onChange={(e) => setStr(key, e.target.value)}
      {...FIELD_ARIA(label)}
      {...pendingProps(pending)}
    />
  )
  const select = (key: StringFilterKey, label: string, pending = false) => (
    <Field
      variant="select"
      value={filters[key]}
      placeholder="전체"
      onChange={(e) => setStr(key, e.target.value)}
      {...FIELD_ARIA(label)}
      {...pendingProps(pending)}
    />
  )
  const office = (key: StringFilterKey, label: string) => (
    <span className="flex gap-[4px]">
      {text(key, label)}
      <span title="준비 중" className="inline-flex">
        <Button size="sm-h26" disabled aria-label={`${label} 찾기`}>
          검색
        </Button>
      </span>
    </span>
  )

  // 시안 3열×5행 순서 그대로(줄 단위로 읽는다). 마지막 줄 빈 칸 두 쌍은 그리지 않는다.
  const formRows: SearchFormRow[] = [
    { label: "감정번호", field: text("aprthngNo", "감정번호", "mono") },
    { label: "문서번호", field: text("docNo", "문서번호") },
    { label: "사건명", field: select("caseName", "사건명") },
    {
      label: "등록일자",
      field: (
        <span className="flex items-center gap-[4px]">
          <Field
            variant="mono-sm"
            value={filters.registeredFrom}
            onChange={(e) => set("registeredFrom", e.target.value)}
            aria-label="등록일자 시작"
          />
          <span aria-hidden="true">~</span>
          <Field
            variant="mono-sm"
            value={filters.registeredTo}
            onChange={(e) => set("registeredTo", e.target.value)}
            aria-label="등록일자 끝"
          />
        </span>
      ),
    },
    { label: "피해자", field: text("victim", "피해자", "text", true) },
    {
      label: "구분",
      field: (
        <RadioRow
          name="구분"
          value={filters.kind}
          onValueChange={(v) => set("kind", v as CaseListFilters["kind"])}
          options={[
            { value: "all", label: "전체" },
            { value: "shoe", label: "신발" },
            { value: "tire", label: "타이어" },
          ]}
        />
      ),
    },
    { label: "사건장소", field: text("place", "사건장소", "text", true) },
    { label: "검거여부", field: select("arrested", "검거여부", true) },
    { label: "작성자", field: text("author", "작성자") },
    { label: "처리관서", field: office("processOffice", "처리관서") },
    { label: "의뢰관서", field: office("requestOffice", "의뢰관서") },
    { label: "발생관서", field: office("occurOffice", "발생관서") },
    {
      label: "사건결과",
      field: (
        <span className="flex items-center gap-[8px]">
          {select("caseResult", "사건결과")}
          <label className="flex items-center gap-[4px] whitespace-nowrap text-[12px] text-muted-foreground">
            <Checkbox
              checked={filters.awaitingResult}
              onCheckedChange={(c) => set("awaitingResult", c === true)}
              aria-label="결과 확인 전"
            />
            결과 확인 전
          </label>
        </span>
      ),
    },
    { label: "타기관여부", field: select("otherOrg", "타기관여부", true) },
  ]

  // 행 끝 버튼. 시안(+α) 규칙: 검색 = 등록 장수가 있을 때 · 확인 = 검색 장수가 있거나 사건 단계 전 확인 장수가 있을 때 ·
  // 검증요청 = 검증요청 단계이거나 이미지가 아직 안 움직인 사건 · 검증 = 교차 검증 단계. +α 를 끄면 1차 규칙 그대로.
  const stageOf = (r: CaseListRow) => r.stage ?? -1
  const searchBtn = (r: CaseListRow) =>
    canAct && r.progress.registered > 0 ? (
      <Button size="sm" variant="ok" row onClick={() => onSearchCase(r.aprthngNo)}>
        검색
      </Button>
    ) : null
  const confirmBtn = (r: CaseListRow) => {
    const { searched, confirmed } = r.progress
    const show = showPlus ? searched > 0 || (confirmed > 0 && stageOf(r) < 0) : searched > 0 || confirmed > 0
    return canAct && show ? (
      <Button size="sm" variant="ok" row onClick={() => onConfirmCase(r.aprthngNo)}>
        확인
      </Button>
    ) : null
  }
  const verifyBtn = (r: CaseListRow) => {
    if (!showPlus) {
      return r.progress.registered === 0 && r.progress.searched === 0 ? (
        <span title="준비 중" className="inline-flex">
          <Button size="sm" row disabled>
            검증요청
          </Button>
        </span>
      ) : null
    }
    if (!canAct) return null
    const stage = stageOf(r)
    if (stage === 0 || (r.progress.registered === 0 && r.progress.searched === 0 && stage < 0)) {
      return (
        <Button size="sm" row className="border-violet-line text-violet" onClick={() => onMockAction?.("검증요청")}>
          검증요청
        </Button>
      )
    }
    if (stage === 1) {
      return (
        <Button
          size="sm"
          variant="warn"
          row
          title="다른 감정관(교차 검증자)에게만 보임"
          onClick={() => onMockAction?.("검증")}
        >
          검증
        </Button>
      )
    }
    return null
  }
  const spacer = <span className="inline-block w-[36px]" />

  const col = (
    key: string,
    header: React.ReactNode,
    render: (r: CaseListRow) => React.ReactNode,
    extra: Partial<CaseTableColumn<CaseListRow>> = {}
  ): CaseTableColumn<CaseListRow> => ({ key, header, render, ...extra })

  const actionCol = col("act", "검색 · 확인 · 검증", (r) => (
    <span className="inline-flex items-center gap-[4px]">
      {showPlus ? (searchBtn(r) ?? spacer) : searchBtn(r)}
      {showPlus ? (confirmBtn(r) ?? spacer) : confirmBtn(r)}
      {verifyBtn(r)}
    </span>
  ))

  const indexOf = (r: CaseListRow) => rows.indexOf(r) + 1 + (page - 1) * pageSize
  const idx = col("no", "순번", (r) =>
    showPlus && r.summary ? (
      <button
        type="button"
        aria-expanded={expanded === r.aprthngNo}
        aria-label={`${r.aprthngNo} 이미지별 요약 ${expanded === r.aprthngNo ? "접기" : "펼치기"}`}
        onClick={() => setExpanded(expanded === r.aprthngNo ? null : r.aprthngNo)}
        className="cursor-pointer border-none bg-transparent p-0 font-code tabular-nums text-dim"
      >
        {indexOf(r)}
      </button>
    ) : (
      <span className="font-code tabular-nums text-dim">{indexOf(r)}</span>
    )
  )
  const img = col("img", "이미지", (r) => {
    const thumb = (
      <SoleThumb
        src={r.thumbSrc}
        alt={`${r.aprthngNo} 이미지`}
        size="sm"
        tabIndex={-1}
        onClick={() => onOpenCase(r.aprthngNo)}
      />
    )
    if (!showPlus) return thumb
    const multi = r.shoeCount + r.tireCount > 1
    return (
      <span className="relative inline-block h-[40px] w-[40px] align-middle">
        {multi && r.stackSrc ? (
          <span
            aria-hidden="true"
            className="absolute left-[8px] top-0 h-[38px] w-[26px] overflow-hidden rounded-[5px] border border-solid border-border bg-white opacity-[.55]"
          >
            <img src={r.stackSrc} alt="" className="block size-full object-contain" />
          </span>
        ) : null}
        <SoleThumb
          src={r.thumbSrc}
          alt={`${r.aprthngNo} 이미지`}
          size="sm"
          tabIndex={-1}
          onClick={() => onOpenCase(r.aprthngNo)}
          className="absolute left-0 top-[2px] [box-shadow:2px_0_6px_0_var(--t-ai-tag-drop)]"
        />
        {r.isNew ? (
          <span
            data-plus
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-[2px] h-[38px] w-[26px] overflow-hidden rounded-[5px]"
          >
            <ScanOverlay active />
          </span>
        ) : null}
        {analystView && r.ai ? (
          <AiTag
            data-plus
            variant={r.ai.state === "running" ? "progress" : "done"}
            partId={r.ai.state === "running" ? "S01-17" : undefined}
            className={cn("absolute -bottom-[5px]", r.ai.state === "running" ? "left-[4px]" : "left-[12px]")}
          >
            {r.ai.state === "running" ? `AI ${r.ai.ready}/${r.ai.total}` : "AI✓"}
          </AiTag>
        ) : null}
      </span>
    )
  })
  const no = col("aprthngNo", "감정번호", (r) =>
    showPlus && r.source ? (
      <div className="leading-[1.3]">
        <div className="font-code text-[12px] text-foreground">{r.aprthngNo}</div>
        <div data-plus className={cn("text-[10.5px]", r.source === "auto" ? "text-brand" : "text-violet")}>
          ● {r.source === "auto" ? "공문 자동" : "임의 등록"}
        </div>
      </div>
    ) : (
      <span className="font-code text-[12px] text-foreground">{r.aprthngNo}</span>
    )
  )
  const doc = col("docNo", "문서번호", (r) => <span className="font-code text-[11.5px]">{dash(r.docNo)}</span>)
  const name = col("caseName", "사건명", (r) => <Clip text={r.caseName} max="max-w-[16rem]" />)
  const req = col("req", "의뢰관서 (SCAS번호)", (r) => (
    <span className="grid leading-[1.3]">
      <Clip text={r.requestOffice} max="max-w-[10rem]" />
      <span className="font-code text-[10.5px] text-dim">{dash(r.scasNo)}</span>
    </span>
  ))
  const proc = col("proc", "처리관서", (r) => <Clip text={r.processOffice} max="max-w-[10rem]" />)
  const occ = col("occ", "발생관서", (r) => <Clip text={r.occurOffice} max="max-w-[10rem]" />)
  const kind = col("kind", "처리 구분", (r) =>
    r.kind === "대조" ? <Chip variant="violet-h20">대조</Chip> : <span>현장</span>
  )
  const count = col("count", "개수 (신발, 타이어)", (r) => (
    <span className="font-code tabular-nums">
      <b className="text-foreground">{r.shoeCount + r.tireCount}</b>{" "}
      <span className="text-dim">
        ({r.shoeCount}, {r.tireCount})
      </span>
    </span>
  ))
  const sus = col("sus", "용의자", (r) => <span className={r.suspect === "유" ? "text-danger" : undefined}>{r.suspect}</span>)
  const reg = col("reg", "등록일자", (r) => <span className="font-code tabular-nums text-[12px]">{r.registeredAt}</span>)
  const confirmedAt = col("confirmedAt", "결과확인 완료일자", (r) => (
    <span className="font-code tabular-nums text-[12px]">{dash(r.confirmedAt)}</span>
  ))
  const result = col("caseResult", "사건 결과", (r) => dash(r.caseResult))
  const receiver = col("receiver", "접수자", (r) => dash(r.receiver))
  const author = col("author", "작성자", (r) => dash(r.author))
  // (+α) 맨 끝에 덧붙이는 사건 진행 열
  const stageCol = col(
    "stage",
    <span className="inline-block w-[106px] whitespace-normal">
      <span className="text-ai">＋사건 진행</span>
      <br />
      <span className="font-normal text-dim">검증요청→교차 검증→감정서→결재</span>
    </span>,
    (r) => <StageCell row={r} />,
    { plus: true, cellClass: "bg-[color-mix(in_srgb,var(--t-ai-bg)_18%,transparent)]" }
  )

  const baseColumns: CaseTableColumn<CaseListRow>[] =
    viewMode === "basic"
      ? [
          idx, img, no, doc, name, req, occ, kind, count, sus, reg,
          col("result", "결과 · 장 (발견 불발 불능)", (r) => <ResultCell row={r} />),
          col("progress", "진행상태 · 장 (등록 검색 확인)", (r) => <ProgressCell row={r} />),
          actionCol,
        ]
      : [
          idx, img, no, doc, name, req, proc, occ, kind, count, sus, reg, confirmedAt, result, receiver, author,
          col("found", "발견", (r) => <Num v={r.results.found} tone="text-ok-fg" />, { align: "right" }),
          col("missed", "불발", (r) => <Num v={r.results.missed} tone="text-fg-2" />, { align: "right" }),
          col("unable", "불능", (r) => <Num v={r.results.unable} tone="text-warn" />, { align: "right" }),
          col("p0", "등록", (r) => <Num v={r.progress.registered} />, { align: "right" }),
          col("p1", "검색", (r) => <Num v={r.progress.searched} tone="text-warn" />, { align: "right" }),
          col("p2", "확인", (r) => <Num v={r.progress.confirmed} tone="text-brand" />, { align: "right" }),
          col("a1", "검색", (r) => searchBtn(r)),
          col("a2", "확인", (r) => confirmBtn(r)),
          col("a3", "검증", (r) => verifyBtn(r)),
        ]
  const columns = showPlus ? [...baseColumns, stageCol] : baseColumns

  const showTotal = (status === "ready" || status === "empty") && total !== undefined

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-[12px]" aria-busy={status === "loading" ? "true" : undefined}>
      <Panel partId="S01-14">
        <SearchForm columns={3} rows={formRows} />
        {showPlus ? <PlusTiles isAdmin={isAdmin} features={features} aiPrep={aiPrep} tasks={tasks} /> : null}
      </Panel>

      <Panel
        corners
        title="사건관리 목록"
        actions={
          <>
            {showTotal ? <span className="text-[12px] text-dim">전체 {total}건</span> : null}
            {showPlus && liveAt ? (
              <LiveDot data-plus state="busy" label={`실시간 · ${liveAt} 갱신`} className="gap-[5px] text-dim" />
            ) : null}
            <ButtonBar aria-label="사건관리 목록 도구">
              <span className="mr-[6px] inline-flex">
                <RadioRow
                  name="보기"
                  value="list"
                  onValueChange={(v) => {
                    if (v === "pattern") onMockAction?.("문양보기")
                  }}
                  options={[
                    { value: "list", label: "목록보기" },
                    { value: "pattern", label: "문양보기" },
                  ]}
                  className="text-[12px]"
                />
              </span>
              <Button size="sm" onClick={onReset}>
                초기화
              </Button>
              <Button size="sm" onClick={() => onMockAction?.("엑셀")}>
                엑셀
              </Button>
              <Button size="sm" onClick={onSearch}>
                조회
              </Button>
              {canRegister ? (
                <Button size="sm" variant="pri" onClick={onRegister}>
                  등록
                </Button>
              ) : null}
              <span aria-hidden="true" className="h-[20px] w-px bg-line-3" />
              <Segmented
                aria-label="열 보기"
                value={viewMode}
                onValueChange={(v) => setViewMode(v as ViewMode)}
                items={[
                  { value: "basic", label: showPlus ? "기본 보기 15열" : "기본 보기 14열" },
                  { value: "full", label: "SCAS 열 전체 보기 25열" },
                ]}
              />
            </ButtonBar>
          </>
        }
      >
        {status === "loading" ? (
          <p role="status" className="px-[14px] py-[24px] text-center text-[12.5px] text-muted-foreground">
            사건 목록을 불러오는 중…
          </p>
        ) : status === "error" ? (
          <div className="px-[14px] py-[24px] text-center">
            <InlineError message="사건 목록을 확인하지 못했습니다" at={errorAt} onRetry={onRetry} />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <CaseTable
                columns={columns}
                rows={status === "empty" ? [] : [...rows]}
                rowKey={(r) => r.aprthngNo}
                selectedKey={showPlus ? expanded : null}
                isNew={showPlus ? (r) => r.isNew === true : undefined}
                expansion={
                  showPlus
                    ? (r) =>
                        r.summary && expanded === r.aprthngNo ? (
                          <RowSummary
                            summary={r.summary}
                            canAct={canAct}
                            onOpenCase={() => onOpenCase(r.aprthngNo)}
                            onConfirmCase={() => onConfirmCase(r.aprthngNo)}
                          />
                        ) : null
                    : undefined
                }
                onRowClick={(r) => onOpenCase(r.aprthngNo)}
                emptyText="결과 없음"
              />
            </div>
            <Pagination
              total={status === "empty" ? 0 : total}
              page={page}
              pageSize={pageSize}
              hasNext={status === "ready" && total !== undefined && page * pageSize < total}
              onPageChange={onPageChange}
            />
          </>
        )}
      </Panel>
    </div>
  )
}
