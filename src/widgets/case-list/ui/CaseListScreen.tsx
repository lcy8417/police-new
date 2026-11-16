import * as React from "react"
import { ChevronDown } from "lucide-react"

import { FEATURES } from "@/entities/session"
import { cn } from "@/shared/lib/utils"
import { AiTag, LiveDot, ScanOverlay } from "@/shared/ui/ai"
import {
  BoardFrame,
  BoardLid,
  Button,
  Checkbox,
  ColumnPicker,
  Field,
  InlineError,
  LidChip,
  LidChipGroup,
  LidFilterLabel,
  LidResetLink,
  LidSearch,
  LidSeparator,
  ListFoot,
  ListNote,
  Pagination,
  RadioRow,
  Segmented,
  StatePill,
  ViewCountSwitch,
  type FilterGroup,
} from "@/shared/ui/kit"
import { ButtonBar, SearchForm, Stepper, type SearchFormRow } from "@/shared/ui/panel"
import { SoleThumb } from "@/shared/ui/viewer"

import type { CaseListFilters, CaseListRow, CaseListScreenProps } from "../model/types"
import { CaseTable, type CaseTableColumn } from "./CaseTable"
import { RowSummary } from "./RowSummary"

// S01 사건관리 목록(SCAS 「족윤적 > 사건관리」 탭). 값만 받아 그린다 — 서버 호출 · 전역 상태 없음.
// 검색 폼 3열×5행 · 열 순서는 SCAS 그대로(정본 스킬 원칙). 새 열(사건 진행)은 맨 끝에만 덧붙인다.
// r2: 시안 r3 의 +α(실시간 · 진행 열 · 행 펼침 · AI 표식 · 빠른 보기)는 showPlus 하나로 숨긴다(`data-plus`).
// r4(2026-11-16 사용자 — 「너무 장황해 컴팩트하지 않아」 · 「위 검색이랑 아래 테이블 로망 디자인 보고 다듬어」):
//  화면 머리 한 줄 + 로망 목록 판(BoardFrame) 하나. 판 뚜껑(BoardLid)에 빠른 보기 · 거르기 칩 · 찾기 칸,
//  SCAS 검색 폼은 「상세 검색」으로 접어 둔다(기본 접힘 — 없애지 않음). KPI 타일은 지웠다(세 가지는 빠른 보기 칩으로).
//  표 생김새는 로망 ListTable, 아래 한 줄(ListFoot)에 개수 · 쪽당 행 · 행 높이 · 보기 · 쪽수를 모은다.

type ViewMode = "basic" | "full"

const NOT_READY = "준비 중"

const STAGE_STEPS = ["검증요청", "교차 검증", "감정서", "결재"]
const STAGE_LABELS = ["검증요청", "교차 검증", "감정서", "결재", "결재완료"]

// 행 끝 작은 단추 — 로망 작은 단추 규격(높이 28 · 모서리 8 · 좌우 10 · 11.5)
const ROW_BTN = "h-7 rounded-[8px] px-2.5 text-[11.5px]"
// 화면 머리 줄 단추 — 같은 높이 28
const HEAD_BTN = "h-7 rounded-[8px] px-2.5 text-[12px]"
// 행 끝 빈 자리(단추 하나 폭) — 단추 열이 줄마다 같은 자리에 오게
const SPACER = <span className="inline-block w-[44px]" />

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
    <div className="grid gap-[2px]">
      <div className="grid grid-cols-3 gap-[2px] text-center text-[11.5px] leading-[1.2]">
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

/** 결과 장수 — 발견 · 불발은 글자, 감정불능만 실제 문제라 색 알약(「! n」) */
function ResultCell({ row }: { row: CaseListRow }) {
  const { found, missed, unable } = row.results
  return (
    <div className="grid grid-cols-3 items-center gap-[2px] text-center text-[11.5px]">
      <Num v={found} />
      <Num v={missed} tone="text-fg-2" />
      <span className="inline-flex justify-center">
        {unable > 0 ? (
          <StatePill tone="problem" title={`감정불능 ${unable}장`}>
            {unable}
          </StatePill>
        ) : (
          <Num v={0} />
        )}
      </span>
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
    <div className="grid gap-[2px]">
      <Stepper steps={STAGE_STEPS} current={stage} width={20} />
      <span className={cn("text-[11px] leading-[1.2]", stage === 4 ? "text-ok-fg" : "text-fg-2")}>
        {STAGE_LABELS[Math.min(stage, 4)]}
        {stage === 1 && row.crossReviewer ? ` · ${row.crossReviewer.split(" ")[0]}` : ""}
      </span>
    </div>
  )
}

/** 뚜껑 칩 묶음 하나 — 여러 개 고르기(묶음 안은 「또는」). label 을 주면 묶음 앞에 작은 이름 */
function LidGroup({
  group,
  onChange,
  label = true,
}: {
  group: FilterGroup
  onChange: (key: string, values: string[]) => void
  label?: boolean
}) {
  const toggle = (v: string) =>
    onChange(group.key, group.value.includes(v) ? group.value.filter((x) => x !== v) : [...group.value, v])
  return (
    <span className="inline-flex items-center gap-1.5">
      {/* 칩 하나짜리 묶음(「내 담당만」)은 칩 글자가 이미 뜻을 말해 보이는 이름을 생략(묶음 이름은 aria-label 로 남음) */}
      {label && group.options.length > 1 ? (
        <span className="text-[11px] whitespace-nowrap text-paper/70">{group.label}</span>
      ) : null}
      <LidChipGroup aria-label={group.label}>
        {group.options.map((o) => (
          <LidChip
            key={o.value}
            active={group.value.includes(o.value)}
            count={o.count}
            zero={o.count === 0}
            onClick={() => toggle(o.value)}
          >
            {o.label}
          </LidChip>
        ))}
      </LidChipGroup>
    </span>
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
  onOpenImage,
  onRegister,
  onSearchCase,
  onConfirmCase,
  showPlus = true,
  liveAt,
  onMockAction,
  quick,
  hiddenColumns = [],
  onHiddenColumnsChange,
  onPageSizeChange,
  rowHeight = "보통",
  onRowHeightChange,
}: CaseListScreenProps) {
  // 보기 방식 · 펼친 행 · 상세 검색 펼침은 저장하지 않는 화면 안 모양이라 위젯 안 상태(spec §6-1)
  const [viewMode, setViewMode] = React.useState<ViewMode>("basic")
  const [expanded, setExpanded] = React.useState<string | null>(
    () => rows.find((r) => r.summary?.defaultOpen)?.aprthngNo ?? null
  )
  const [detailOpen, setDetailOpen] = React.useState(false)
  const detailId = React.useId()

  const canRegister = isAdmin || features.includes(FEATURES.CRIME_REGISTER)
  const canSearch = isAdmin || features.includes(FEATURES.CRIME_SEARCH)
  // 지금 동작이 없는 SCAS 버튼(엑셀 · 문양보기): 신규 기능을 켜고 알림 콜백이 있을 때만 활성(시안 — 알림, spec §13-4),
  // 아니면 §5-2 규칙 3 그대로 자리만 두고 잠근다(「준비 중」)
  const mockActive = showPlus && onMockAction !== undefined
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
      <Button size="sm" variant="ok" row className={ROW_BTN} onClick={() => onSearchCase(r.aprthngNo)}>
        검색
      </Button>
    ) : null
  const confirmBtn = (r: CaseListRow) => {
    const { searched, confirmed } = r.progress
    const show = showPlus ? searched > 0 || (confirmed > 0 && stageOf(r) < 0) : searched > 0 || confirmed > 0
    return canAct && show ? (
      <Button size="sm" variant="ok" row className={ROW_BTN} onClick={() => onConfirmCase(r.aprthngNo)}>
        확인
      </Button>
    ) : null
  }
  const verifyBtn = (r: CaseListRow) => {
    if (!showPlus) {
      return r.progress.registered === 0 && r.progress.searched === 0 ? (
        <span title="준비 중" className="inline-flex">
          <Button size="sm" row disabled className={ROW_BTN}>
            검증요청
          </Button>
        </span>
      ) : null
    }
    if (!canAct) return null
    const stage = stageOf(r)
    if (stage === 0 || (r.progress.registered === 0 && r.progress.searched === 0 && stage < 0)) {
      return (
        <Button
          size="sm"
          row
          className={cn(ROW_BTN, "border-violet-line text-violet")}
          onClick={() => onMockAction?.("검증요청")}
        >
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
          className={ROW_BTN}
          title="다른 감정관(교차 검증자)에게만 보임"
          onClick={() => onMockAction?.("검증")}
        >
          검증
        </Button>
      )
    }
    return null
  }

  const col = (
    key: string,
    header: React.ReactNode,
    render: (r: CaseListRow) => React.ReactNode,
    extra: Partial<CaseTableColumn<CaseListRow>> = {}
  ): CaseTableColumn<CaseListRow> => ({
    key,
    header,
    render,
    label: typeof header === "string" ? header : key,
    ...extra,
  })

  const actionCol = col("act", "검색 · 확인 · 검증", (r) => (
    <span className="inline-flex items-center gap-[4px]">
      {showPlus ? (searchBtn(r) ?? SPACER) : searchBtn(r)}
      {showPlus ? (confirmBtn(r) ?? SPACER) : confirmBtn(r)}
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
        className="inline-flex cursor-pointer items-center gap-[2px] border-none bg-transparent p-0 font-code tabular-nums text-dim"
      >
        {indexOf(r)}
        <ChevronDown
          aria-hidden
          className={cn("size-3 transition-transform motion-reduce:transition-none", expanded === r.aprthngNo && "rotate-180")}
        />
      </button>
    ) : (
      <span className="font-code tabular-nums text-dim">{indexOf(r)}</span>
    )
  )
  // 표 칸 썸네일은 행 높이(36)에 맞춰 21×30 으로 줄인다(SoleThumb sm 26×38 의 크기만 덮어씀)
  const THUMB = "h-[30px] w-[21px]"
  const img = col("img", "이미지", (r) => {
    const thumb = (
      <SoleThumb
        src={r.thumbSrc}
        alt={`${r.aprthngNo} 이미지`}
        size="sm"
        tabIndex={-1}
        onClick={() => onOpenCase(r.aprthngNo)}
        className={THUMB}
      />
    )
    if (!showPlus) return thumb
    const multi = r.shoeCount + r.tireCount > 1
    return (
      <span className="relative inline-block h-[32px] w-[32px] align-middle">
        {multi && r.stackSrc ? (
          <span
            aria-hidden="true"
            className="absolute top-0 left-[7px] h-[30px] w-[21px] overflow-hidden rounded-[5px] border border-solid border-border bg-paper opacity-[.55]"
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
          className={cn(THUMB, "absolute top-[1px] left-0 [box-shadow:2px_0_6px_0_var(--t-ai-tag-drop)]")}
        />
        {r.isNew ? (
          <span
            data-plus
            aria-hidden="true"
            className="pointer-events-none absolute top-[1px] left-0 h-[30px] w-[21px] overflow-hidden rounded-[5px]"
          >
            <ScanOverlay active />
          </span>
        ) : null}
        {analystView && r.ai ? (
          <AiTag
            data-plus
            variant={r.ai.state === "running" ? "progress" : "done"}
            partId={r.ai.state === "running" ? "S01-17" : undefined}
            className={cn("absolute -bottom-[5px]", r.ai.state === "running" ? "left-[2px]" : "left-[8px]")}
          >
            {r.ai.state === "running" ? `AI ${r.ai.ready}/${r.ai.total}` : "AI✓"}
          </AiTag>
        ) : null}
      </span>
    )
  })
  // 들어온 길(+α)은 번호 아래 작은 한 줄 — 옆에 두면 표가 가로로 넘친다(1440 기준)
  const no = col("aprthngNo", "감정번호", (r) =>
    showPlus && r.source ? (
      <span className="grid leading-[1.25]">
        <span className="font-code text-[12px] font-semibold text-foreground">{r.aprthngNo}</span>
        <span data-plus className="text-[10.5px] text-muted-foreground">
          <span aria-hidden="true" className={r.source === "auto" ? "text-brand" : "text-violet"}>
            ●{" "}
          </span>
          {r.source === "auto" ? "공문 자동" : "임의 등록"}
        </span>
      </span>
    ) : (
      <span className="font-code text-[12px] font-semibold text-foreground">{r.aprthngNo}</span>
    )
  )
  const doc = col("docNo", "문서번호", (r) => <span className="font-code text-[11.5px]">{dash(r.docNo)}</span>)
  // 1440 폭에서 표가 판 안에 들어오게 긴 글 칸은 좁게 자르고 전체는 title 로(로망 목록 = 고정 폭 · 말줄임)
  const name = col("caseName", "사건명", (r) => <Clip text={r.caseName} max="max-w-[6rem]" />)
  // 머리 글자는 짧게(한 줄) — 원래 이름은 마우스 설명 · 열 선택 목록에
  const req = col(
    "req",
    "의뢰관서",
    (r) => (
      <span className="grid leading-[1.25]">
        <Clip text={r.requestOffice} max="max-w-[10rem]" />
        <span className="font-code text-[10.5px] text-dim">{dash(r.scasNo)}</span>
      </span>
    ),
    { label: "의뢰관서 (SCAS번호)", title: "의뢰관서 (SCAS번호)" }
  )
  const proc = col("proc", "처리관서", (r) => <Clip text={r.processOffice} max="max-w-[10rem]" />)
  const occ = col("occ", "발생관서", (r) => <Clip text={r.occurOffice} max="max-w-[5.5rem]" />)
  // 상태 표시는 회색 알약, 실제 문제(용의자 유 · 감정불능)만 색
  const kind = col("kind", "처리 구분", (r) => <StatePill tone="fact">{r.kind}</StatePill>)
  const count = col(
    "count",
    "개수",
    (r) => (
      <span className="font-code tabular-nums">
        <b className="text-foreground">{r.shoeCount + r.tireCount}</b>{" "}
        <span className="text-dim">
          ({r.shoeCount}, {r.tireCount})
        </span>
      </span>
    ),
    { label: "개수 (신발, 타이어)", title: "개수 (신발, 타이어)" }
  )
  const sus = col("sus", "용의자", (r) =>
    r.suspect === "유" ? <StatePill tone="problem">유</StatePill> : <span className="text-muted-foreground">무</span>
  )
  const reg = col("reg", "등록일자", (r) => <span className="font-code text-[12px] tabular-nums">{r.registeredAt}</span>)
  const confirmedAt = col("confirmedAt", "결과확인 완료일자", (r) => (
    <span className="font-code text-[12px] tabular-nums">{dash(r.confirmedAt)}</span>
  ))
  const result = col("caseResult", "사건 결과", (r) => dash(r.caseResult))
  const receiver = col("receiver", "접수자", (r) => dash(r.receiver))
  const author = col("author", "작성자", (r) => dash(r.author))
  // (+α) 맨 끝에 덧붙이는 사건 진행 열 — 머리는 한 줄, 단계 순서는 마우스 설명
  const stageCol = col("stage", <span className="text-ai">＋사건 진행</span>, (r) => <StageCell row={r} />, {
    plus: true,
    label: "사건 진행",
    title: "검증요청 → 교차 검증 → 감정서 → 결재",
    cellClass: "bg-[color-mix(in_srgb,var(--t-ai-bg)_18%,transparent)]",
  })

  const baseColumns: CaseTableColumn<CaseListRow>[] =
    viewMode === "basic"
      ? [
          idx, img, no, doc, name, req, occ, kind, count, sus, reg,
          col("result", "발견·불발·불능", (r) => <ResultCell row={r} />, {
            label: "결과 (발견 불발 불능)",
            title: "결과 · 장 (발견 불발 불능)",
          }),
          col("progress", "등록·검색·확인", (r) => <ProgressCell row={r} />, {
            label: "진행상태 (등록 검색 확인)",
            title: "진행상태 · 장 (등록 검색 확인)",
          }),
          actionCol,
        ]
      : [
          idx, img, no, doc, name, req, proc, occ, kind, count, sus, reg, confirmedAt, result, receiver, author,
          col("found", "발견", (r) => <Num v={r.results.found} />, { align: "right", label: "발견 장수" }),
          col("missed", "불발", (r) => <Num v={r.results.missed} tone="text-fg-2" />, { align: "right", label: "불발 장수" }),
          col("unable", "불능", (r) => <Num v={r.results.unable} tone="text-danger-fg" />, { align: "right", label: "불능 장수" }),
          col("p0", "등록", (r) => <Num v={r.progress.registered} />, { align: "right", label: "등록 장수" }),
          col("p1", "검색", (r) => <Num v={r.progress.searched} />, { align: "right", label: "검색 장수" }),
          col("p2", "확인", (r) => <Num v={r.progress.confirmed} />, { align: "right", label: "확인 장수" }),
          col("a1", "검색", (r) => searchBtn(r), { label: "검색 버튼" }),
          col("a2", "확인", (r) => confirmBtn(r), { label: "확인 버튼" }),
          col("a3", "검증", (r) => verifyBtn(r), { label: "검증 버튼" }),
        ]
  const allColumns = showPlus ? [...baseColumns, stageCol] : baseColumns
  // (r3) 열 고르기: 숨긴 열을 빼되 SCAS 순서는 그대로, 감정번호는 못 숨긴다
  const LOCKED_COLUMN = "aprthngNo"
  const columns = allColumns.filter((c) => c.key === LOCKED_COLUMN || !hiddenColumns.includes(c.key))
  const pickerColumns = allColumns.map((c) => ({ key: c.key, label: c.label ?? c.key, locked: c.key === LOCKED_COLUMN }))
  const handleColumnsChange = (keys: string[]) => {
    const rest = hiddenColumns.filter((k) => !allColumns.some((c) => c.key === k))
    onHiddenColumnsChange?.([...rest, ...allColumns.filter((c) => !keys.includes(c.key)).map((c) => c.key)])
  }
  const views = showPlus ? quick?.views : undefined
  const quickActive =
    quick !== undefined &&
    (quick.query.trim() !== "" || quick.groups.some((g) => g.value.length > 0) || (views?.value.length ?? 0) > 0)
  const quickEmpty = status === "ready" && quickActive && quick.resultCount === 0

  const showTotal = (status === "ready" || status === "empty") && total !== undefined
  const listed = status === "ready" || status === "empty"

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-[10px]" aria-busy={status === "loading" ? "true" : undefined}>
      {/* 화면 머리 한 줄: 제목 · 전체 건수 · 실시간 | 목록보기/문양보기 · 엑셀 · 열 선택 · 등록 */}
      <div className="flex flex-wrap items-center gap-x-[10px] gap-y-[6px]">
        <h2 className="m-0 text-[15px] font-bold text-foreground">사건관리 목록</h2>
        {showTotal ? <span className="text-[12px] text-muted-foreground">전체 {total}건</span> : null}
        {showPlus && liveAt ? (
          <LiveDot data-plus state="busy" label={`실시간 · ${liveAt} 갱신`} className="gap-[5px] text-[12px] text-dim" />
        ) : null}
        <ButtonBar aria-label="사건관리 목록 도구" className="gap-[8px]">
          {/* 찾기 칸 · 상세 검색은 뚜껑이 한 줄에 들어가도록 머리 줄로 올렸다(1440 폭에서 뚜껑 두 줄 접힘 해소) */}
          {quick ? (
            <LidSearch
              className="ml-0 min-w-[180px] flex-[0_1_230px] border border-solid border-line-3 shadow-none"
              inputProps={{
                value: quick.query,
                onChange: (e) => quick.onQueryChange(e.target.value),
                placeholder: quick.placeholder ?? "감정번호 · 문서번호 · 사건명",
                "aria-label": "검색어",
              }}
              onClear={() => quick.onQueryChange("")}
              clearLabel="검색어 지우기"
            />
          ) : null}
          <Button
            size="sm"
            className={cn(HEAD_BTN, "gap-1", detailOpen && "border-brand-line bg-brand-bg text-brand-3")}
            aria-expanded={detailOpen}
            aria-controls={detailId}
            onClick={() => setDetailOpen((o) => !o)}
          >
            상세 검색
            <ChevronDown
              aria-hidden
              className={cn("size-3.5 transition-transform motion-reduce:transition-none", detailOpen && "rotate-180")}
            />
          </Button>
          <span aria-hidden="true" className="mx-[2px] h-[18px] w-px bg-line-3" />
          <span className="mr-[4px] inline-flex shrink-0 whitespace-nowrap [&>*]:flex-nowrap">
            <RadioRow
              name="보기"
              value="list"
              onValueChange={(v) => {
                if (v === "pattern" && mockActive) onMockAction?.("문양보기")
              }}
              options={[
                { value: "list", label: "목록보기" },
                mockActive
                  ? { value: "pattern", label: "문양보기" }
                  : { value: "pattern", label: "문양보기", disabled: true, title: NOT_READY },
              ]}
              className="text-[12px]"
            />
          </span>
          {mockActive ? (
            <Button size="sm" className={HEAD_BTN} onClick={() => onMockAction?.("엑셀")}>
              엑셀
            </Button>
          ) : (
            <span title={NOT_READY} className="inline-flex">
              <Button size="sm" className={HEAD_BTN} disabled>
                엑셀
              </Button>
            </span>
          )}
          {onHiddenColumnsChange && listed ? (
            <span className="inline-flex shrink-0 whitespace-nowrap">
              <ColumnPicker columns={pickerColumns} visible={columns.map((c) => c.key)} onChange={handleColumnsChange} />
            </span>
          ) : null}
          {canRegister ? (
            <Button size="sm" variant="pri" className={HEAD_BTN} onClick={onRegister}>
              등록
            </Button>
          ) : null}
        </ButtonBar>
      </div>

      <BoardFrame className="mt-0">
        {/* 뚜껑: 빠른 보기(+α) │ 진행 상태 │ 사건결과 │ 처리 구분 │ 담당 │ 조건 지우기 │ 상세 검색 · 찾기 */}
        <BoardLid role="search" aria-label="사건 목록 거르기">
          {quick && views ? (
            <>
              <span data-plus className="inline-flex items-center gap-1.5">
                <LidFilterLabel>빠른 보기</LidFilterLabel>
                <LidGroup group={views} onChange={quick.onGroupChange} label={false} />
              </span>
              <LidSeparator data-plus />
            </>
          ) : null}
          {quick
            ? quick.groups.map((g, i) => (
                <React.Fragment key={g.key}>
                  {i > 0 ? <LidSeparator /> : null}
                  {/* 칩 글자가 뜻을 말하는 묶음(진행 상태 · 사건결과)은 보이는 이름을 생략해 뚜껑을 한 줄로 — 「현장 · 대조」만 이름이 필요 */}
                  <LidGroup group={g} onChange={quick.onGroupChange} label={g.key === "kind"} />
                </React.Fragment>
              ))
            : null}
          {quickActive ? (
            <LidResetLink onClick={quick.onClear}>
              <span aria-hidden="true">✕ </span>조건 지우기
            </LidResetLink>
          ) : null}
        </BoardLid>

        {/* 상세 검색(SCAS 3열×5행 양식 — 순서 그대로) — 기본 접힘 */}
        {detailOpen ? (
          <div id={detailId} className="grid gap-[8px] border-b border-solid border-border bg-panel-2 px-[14px] py-[10px]">
            <SearchForm columns={3} rows={formRows} />
            <ButtonBar aria-label="상세 검색 도구" className="gap-[8px]">
              <Button size="sm" className={HEAD_BTN} onClick={onReset}>
                초기화
              </Button>
              <Button size="sm" variant="pri" className={HEAD_BTN} onClick={onSearch}>
                조회
              </Button>
            </ButtonBar>
          </div>
        ) : null}

        {status === "loading" ? (
          <ListNote role="status" className="text-center">
            사건 목록을 불러오는 중…
          </ListNote>
        ) : status === "error" ? (
          <div className="flex justify-center px-4 py-6">
            <InlineError message="사건 목록을 확인하지 못했습니다" at={errorAt} onRetry={onRetry} />
          </div>
        ) : quickEmpty ? (
          <ListNote
            role="status"
            className="justify-center"
            action={
              <Button size="sm" variant="ghost" className="h-auto px-0 text-[12px] text-brand underline" onClick={quick.onClear}>
                조건 지우기
              </Button>
            }
          >
            조건에 맞는 항목 없음
          </ListNote>
        ) : status === "empty" || rows.length === 0 ? (
          <ListNote className="text-center">결과 없음</ListNote>
        ) : (
          <div className="overflow-x-auto">
            <CaseTable
              compact={rowHeight === "촘촘"}
              columns={columns}
              rows={[...rows]}
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
                          onOpenImage={onOpenImage ? (seq) => onOpenImage(r.aprthngNo, seq) : undefined}
                        />
                      ) : null
                  : undefined
              }
              onRowClick={(r) => onOpenCase(r.aprthngNo)}
            />
          </div>
        )}

        {/* 아래 한 줄: 개수 · 쪽당 행 · 행 높이 · 보기 ……… 쪽수 */}
        {listed ? (
          <ListFoot className="h-auto min-h-11 flex-wrap gap-x-4 gap-y-1.5 py-1.5">
            {quick ? (
              <span aria-live="polite" className="font-code tabular-nums text-fg-2">
                {quick.resultCount} / 전체 {quick.total}
              </span>
            ) : null}
            {onPageSizeChange ? (
              <ViewCountSwitch label="쪽당" options={[10, 20, 50]} value={pageSize} onChange={onPageSizeChange} />
            ) : null}
            {onRowHeightChange ? (
              <ViewCountSwitch label="행" options={["보통", "촘촘"] as const} value={rowHeight} onChange={onRowHeightChange} />
            ) : null}
            <span className="inline-flex items-center gap-[8px]">
              <span className="text-[12px] whitespace-nowrap text-muted-foreground">보기</span>
              <Segmented
                aria-label="열 보기"
                value={viewMode}
                onValueChange={(v) => setViewMode(v as ViewMode)}
                items={[
                  { value: "basic", label: showPlus ? "기본 보기 15열" : "기본 보기 14열" },
                  { value: "full", label: "SCAS 열 전체 보기 25열" },
                ]}
              />
            </span>
            <Pagination
              className="ml-auto p-0"
              total={status === "empty" ? 0 : total}
              page={page}
              pageSize={pageSize}
              hasNext={status === "ready" && total !== undefined && page * pageSize < total}
              onPageChange={onPageChange}
            />
          </ListFoot>
        ) : null}
      </BoardFrame>
    </div>
  )
}
