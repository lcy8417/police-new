import * as React from "react"
import { Check, Plus, SlidersHorizontal } from "lucide-react"

import type { Shoe } from "@/entities/shoe"
import { FEATURES } from "@/entities/session"
import { cn } from "@/shared/lib/utils"
import {
  BoardLid,
  Combobox,
  DataGrid,
  Field,
  InlineError,
  LidChip,
  LidChipGroup,
  LidResetLink,
  LidSearch,
  LidSeparator,
  Pagination,
  Segmented,
  WorkbenchButton,
  type DataGridColumn,
  type FilterGroup,
} from "@/shared/ui/kit"
import { SoleThumb } from "@/shared/ui/viewer"

import type { ShoeCardSize, ShoeDbFilters, ShoeDbPanelExtra, ShoeDbScreenProps, ShoeStageSummary } from "../model/types"
import { ShoeCard } from "./ShoeCard"
import { ShoeEditor } from "./ShoeEditor"

const SMALL_SEG = "p-[2px] [&_button]:px-[8px] [&_button]:py-[1px] [&_button]:text-[11px]"

// 카드 크기 → 격자(폭에 맞춰 채움) · 사진 높이. 클래스는 통째로 적어야 Tailwind 가 만든다
const CARD_SIZES: readonly ShoeCardSize[] = ["작게", "보통", "크게"]
const PANEL_CARD: Record<ShoeCardSize, { grid: string; image: string }> = {
  작게: { grid: "grid-cols-[repeat(auto-fill,minmax(92px,1fr))]", image: "h-[72px]" },
  보통: { grid: "grid-cols-[repeat(auto-fill,minmax(118px,1fr))]", image: "h-[104px]" },
  크게: { grid: "grid-cols-[repeat(auto-fill,minmax(176px,1fr))]", image: "h-[168px]" },
}

const hasPattern = (s: Shoe) => s.top.length + s.mid.length + s.bottom.length + s.outline.length > 0

/**
 * 걸어 둔 상세 거르기 수 — 화류번호 · 상표 · 제조사 · 등록관서 · 등록일자(시작 · 끝 하나로).
 * 승인 · 문양 입력은 뚜껑 칩(쓰는 쪽이 `quick.groups` 로 넘김) 몫이라 세지 않는다.
 */
function detailFilterCount(f: ShoeDbFilters): number {
  const text = [f.ftwrId, f.brandCode, f.makrCode].filter((v) => v.trim() !== "").length
  return text + (f.office ? 1 : 0) + (f.regFrom.trim() !== "" || f.regTo.trim() !== "" ? 1 : 0)
}

/**
 * 목록 보기 「바닥」 칸 — 그림이 없거나 못 읽으면(사진 없는 신발 — 서버 404) 깨진 그림 대신 「—」(이 열의 빈 칸 표시).
 * 안쪽 `<img>` 의 error 는 React 가 부모 단추의 onError 로 올려 준다.
 */
function ListThumb({ shoe, onOpen }: { shoe: Shoe; onOpen: (ftwrId: string) => void }) {
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null)
  const src = shoe.image ?? ""
  if (src === "" || failedSrc === src) {
    return (
      <span title="이미지 없음" className="text-dim">
        —
      </span>
    )
  }
  return <SoleThumb src={src} alt={`${shoe.ftwrId} 바닥`} size="sm" onClick={() => onOpen(shoe.ftwrId)} onError={() => setFailedSrc(src)} />
}

/** 목록 머리 왼쪽 — 승인 진행(이번 달 · 오늘 n/기준). 작업 단계 수는 뚜껑 칩에 있으니 여기서 다시 보이지 않는다 */
function ApproveNote({ summary }: { summary: ShoeStageSummary }) {
  const month = summary.stages.find((s) => s.title === "승인")
  const { todayDone, todayLimit } = summary.backlog
  return (
    <span className="inline-flex items-center gap-[10px]">
      {month ? (
        <span title={month.owner}>
          이번 달 승인 <b className="font-code tabular-nums text-foreground">{month.count}</b>
        </span>
      ) : null}
      <span title={`하루 ${todayLimit}매 기준(막지 않음)`}>
        오늘 승인{" "}
        <b className="font-code tabular-nums text-foreground">
          {todayDone}/{todayLimit}
        </b>
      </span>
    </span>
  )
}

/** 뚜껑 칩 묶음 하나 — 여러 개 고르기 */
function LidGroup({ group, onChange }: { group: FilterGroup; onChange: (key: string, values: string[]) => void }) {
  const toggle = (v: string) => onChange(group.key, group.value.includes(v) ? group.value.filter((x) => x !== v) : [...group.value, v])
  return (
    <LidChipGroup aria-label={group.label}>
      {group.options.map((o) => (
        <LidChip key={o.value} active={group.value.includes(o.value)} count={o.count} zero={o.count === 0} onClick={() => toggle(o.value)}>
          {o.label}
        </LidChip>
      ))}
    </LidChipGroup>
  )
}

/**
 * `quick.groups` = 뚜껑 칩 묶음(바로 걸리는 거르기). 운영(ShoeDbPanelContainer)은 작업 단계(J1 `stage`) · 승인(`approval`) ·
 * 문양 입력(`pattern_input`)을 넘기고, 한 묶음에 하나만 켜는지는 쓰는 쪽이 정한다. `filters`(상세 거르기)는 「조회」로 건다.
 */
export type ShoeDbPanelProps = Omit<ShoeDbScreenProps, "auto"> & ShoeDbPanelExtra

/**
 * 신발 DB 슬라이드 패널 본문(사건관리 위 막대 「신발 DB」 · `?shoe=1`). 패널 머리가 제목이라 쪽 제목 · 위치 표시가 없다.
 * 사건관리 목록과 같은 결(11/17 사용자 「위 필터부분도 좀 다듬자. 전문적으로 — 너무 아카데믹하고 따로논다」):
 *   뚜껑 한 줄: 칩 묶음(`quick.groups` — 운영은 작업 단계 │ 승인 │ 문양 입력, 바로 걸림) │ 상세 거르기 n · ✕ 조건 지우기 ……… 찾기 · + 등록
 *   (상세 거르기를 펴면) 뚜껑 아래 한 줄: 화류번호 · 상표 · 제조사 · 등록관서 · 등록일자 · 지우기 · 조회(칸에서 Enter = 조회)
 *   목록 머리: 이번 달 · 오늘 승인 ……… 카드 크기 · 카드 | 목록(작게)
 *   카드 격자(AI 표식은 사람이 봐야 할 때만, 그림 없는 신발은 「이미지 없음」) → 바닥 쪽 이동(쪽 번호 Enter · 처음 · 끝)
 * 작업 단계 흐름 줄(등록됨 → 문양 입력됨 → 승인 대기 → 승인)은 뚜껑 칩과 같은 수를 두 번 보여 뺐다.
 * 카드를 누르거나 「등록」을 누르면 목록 자리에 큰 편집 판(ShoeEditor)이 들어선다. 자동 넘기기 · 엑셀 · 초기화는 없다.
 */
export function ShoeDbPanel(props: ShoeDbPanelProps) {
  const { status, errorAt, onRetry, isAdmin, features, filters, onFiltersChange, officeItems, onSearch, onReset } = props
  const { view, onViewChange, shoes, total, page, pageSize, onPageChange, selectedId, onOpenShoe, onRegister, dialog } = props
  const { showPlus = true, onPlusAction, stageSummary, cardInfo, aiDetails, quick, cardSize = "보통", onCardSizeChange } = props
  const { live = false, duty } = props
  const [filterOpen, setFilterOpen] = React.useState(false)
  const detailId = React.useId()
  const canEdit = duty ? duty.canRegister : isAdmin || features.includes(FEATURES.SHOE_EDIT)
  // 실제 서버 값(live) 또는 진열 신규 요소(showPlus) — 작업 단계 · 카드 상태 · 등록일자/승인 거르기
  const plusOrLive = showPlus || live
  const showOffice = showPlus || (live && officeItems.length > 0)

  if (dialog) {
    return (
      <ShoeEditor
        // 신규 등록은 입력 중인 신발ID 가 바뀌어도 같은 편집 판(키 고정) — 한 글자마다 다시 그려져 초점 · 보기 설정이 사라지던 것(1회차 검수).
        // 수정은 ID 가 잠겨 있어 ID 로 구분(‹ › 로 다른 신발로 가면 새 판)
        key={dialog.mode === "new" ? "new" : `edit-${dialog.form.ftwrId}`}
        dialog={dialog}
        canEdit={canEdit}
        canPattern={duty?.canPattern}
        canApprove={duty?.canApprove}
        isAdmin={isAdmin}
        detail={showPlus ? aiDetails?.[dialog.form.ftwrId] : undefined}
        workStatus={plusOrLive ? cardInfo?.[dialog.form.ftwrId]?.status : undefined}
        library={props.library}
        extractState={props.extractState}
        onExtract={props.onExtract}
        onConfirmAi={props.onConfirmAi}
        onConfirmAiOne={props.onConfirmAiOne}
        onPrev={props.onPrevShoe}
        onNext={props.onNextShoe}
        onApprove={props.onApprove}
        onFormChange={props.onFormChange}
        onSave={props.onSave}
        onClose={props.onCloseDialog}
        onReplaceImage={props.onReplaceImage}
        onRotateImage={props.onRotateImage}
        onPlusAction={onPlusAction}
      />
    )
  }

  const set = (patch: Partial<ShoeDbFilters>) => onFiltersChange({ ...filters, ...patch })
  const detailApplied = props.filtersApplied ?? true
  const nDetail = detailApplied ? detailFilterCount(filters) : 0
  const quickActive = quick !== undefined && (quick.query.trim() !== "" || quick.groups.some((g) => g.value.length > 0))
  const narrowed = quickActive || props.filtersApplied === true
  // 걸러서 0건(뚜껑 칩 · 찾기 · 상세 거르기 — 서버가 거른 것도, 이 쪽 안에서 거른 것도) — 빈 격자가 아니라
  // 「조건에 맞는 항목 없음 · 조건 지우기」(조회 실패 · 거르지 않은 0건 「결과 없음」과 다른 안내)
  const noMatch = (status === "ready" || status === "empty") && narrowed && shoes.length === 0
  const clearAll = () => {
    if (quickActive) quick?.onClear()
    if (props.filtersApplied) onReset()
  }
  const size = PANEL_CARD[cardSize]
  // 칸에서 Enter = 조회(SCAS 처럼 — 치는 동안은 목록이 바뀌지 않는다)
  const enterToSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return
    e.preventDefault()
    onSearch()
  }

  // 한 칸 = 이름 + 입력. 칸마다 자기 접근성 이름(aria-label)이 있어 `<label>` 로 감싸지 않는다 —
  // 등록일자(입력 2개)를 `<label>` 이 감싸 첫 칸으로 누름 · 이름이 쏠리던 것(3회차 검수)
  const cell = (text: string, field: React.ReactNode) => (
    <span className="inline-flex min-w-0 items-center gap-[6px]">
      <span aria-hidden="true" className="whitespace-nowrap">
        {text}
      </span>
      {field}
    </span>
  )

  // 상세 거르기 — 뚜껑 아래 한 줄로 압축(라디오 · 넓은 양식 판 없음). 승인 · 문양 입력은 뚜껑 칩으로 올렸다
  const filterRow = filterOpen ? (
    <div
      id={detailId}
      role="group"
      aria-label="상세 거르기"
      className="flex shrink-0 flex-wrap items-center gap-x-[14px] gap-y-[6px] border-0 border-b border-solid border-border bg-strip px-[16px] py-[7px] text-[12px] text-muted-foreground"
    >
      {cell("화류번호", <Field variant="mono" aria-label="화류번호" value={filters.ftwrId} onChange={(e) => set({ ftwrId: e.target.value })} onKeyDown={enterToSearch} className="w-[96px]" />)}
      {cell("상표", <Field aria-label="상표" value={filters.brandCode} onChange={(e) => set({ brandCode: e.target.value })} onKeyDown={enterToSearch} className="w-[96px]" />)}
      {cell("제조사", <Field aria-label="제조사" value={filters.makrCode} onChange={(e) => set({ makrCode: e.target.value })} onKeyDown={enterToSearch} className="w-[96px]" />)}
      {/* 등록관서 · 등록일자 = 진열(showPlus) 또는 서버 거르기(live, J1). 등록관서는 관서 목록이 있을 때만 — 화면 이식 계획 §4 ④ */}
      {showOffice ? cell("등록관서", <Combobox aria-label="등록관서" items={officeItems} value={filters.office} onValueChange={(office) => set({ office })} placeholder="전체" className="w-[168px]" />) : null}
      {plusOrLive
        ? cell(
            "등록일자",
            <span className="inline-flex items-center gap-[4px]">
              <Field variant="mono" aria-label="등록일자 시작일" placeholder="YYYY-MM-DD" value={filters.regFrom} onChange={(e) => set({ regFrom: e.target.value })} onKeyDown={enterToSearch} className="w-[104px]" />
              <span aria-hidden="true">~</span>
              <Field variant="mono" aria-label="등록일자 종료일" placeholder="YYYY-MM-DD" value={filters.regTo} onChange={(e) => set({ regTo: e.target.value })} onKeyDown={enterToSearch} className="w-[104px]" />
            </span>,
          )
        : null}
      <span className="ml-auto inline-flex items-center gap-[6px]">
        <WorkbenchButton size="sm" variant="ghost" onClick={onReset}>
          지우기
        </WorkbenchButton>
        <WorkbenchButton size="sm" variant="primary" onClick={onSearch}>
          조회
        </WorkbenchButton>
      </span>
    </div>
  ) : null

  const columns: DataGridColumn<Shoe>[] = [
    {
      key: "image",
      header: "바닥",
      render: (s) => <ListThumb shoe={s} onOpen={onOpenShoe} />,
    },
    { key: "ftwrId", header: "화류번호", render: (s) => <span className="font-code tabular-nums">{s.ftwrId}</span> },
    { key: "modl", header: "모델명", wrap: true, render: (s) => s.modlNm ?? "" },
    { key: "brand", header: "상표", render: (s) => s.brandCode ?? "" },
    { key: "makr", header: "제조사", render: (s) => s.makrCode ?? "" },
    { key: "year", header: "수집연도", render: (s) => s.colctYear ?? "" },
    { key: "state", header: "상태", render: (s) => (plusOrLive ? cardInfo?.[s.ftwrId]?.status : null) ?? (hasPattern(s) ? "입력" : "미입력") },
  ]

  let body: React.ReactNode
  if (status === "loading") {
    body = <p className="m-0 px-[14px] py-[24px] text-center text-[12.5px] text-muted-foreground">불러오는 중</p>
  } else if (status === "error") {
    body = (
      <div className="px-[14px] py-[24px] text-center">
        <InlineError message="신발 목록을 불러오지 못했습니다" at={errorAt} onRetry={onRetry} />
      </div>
    )
  } else if (noMatch) {
    body = (
      <div role="status" className="grid justify-items-center gap-[8px] px-[14px] py-[24px] text-[12.5px] text-muted-foreground">
        <span>조건에 맞는 항목 없음</span>
        <WorkbenchButton size="sm" variant="soft" onClick={clearAll}>
          조건 지우기
        </WorkbenchButton>
      </div>
    )
  } else if (view === "pattern" && status === "ready") {
    body = (
      <div className={cn("grid gap-[8px] px-[16px] py-[12px]", size.grid)}>
        {shoes.map((s) => (
          <ShoeCard
            key={s.ftwrId}
            shoe={s}
            selected={s.ftwrId === selectedId}
            hasPattern={hasPattern(s)}
            info={plusOrLive ? cardInfo?.[s.ftwrId] : undefined}
            onOpen={onOpenShoe}
            imageClass={size.image}
            quiet
          />
        ))}
      </div>
    )
  } else {
    body = <DataGrid columns={columns} rows={status === "empty" ? [] : shoes} rowKey={(s) => s.ftwrId} selectedKey={selectedId} onRowClick={(s) => onOpenShoe(s.ftwrId)} />
  }

  return (
    <div data-slot="shoe-db-panel" aria-busy={status === "loading"} className="flex h-full min-h-0 flex-col">
      <BoardLid role="search" aria-label="신발 거르기">
        {quick
          ? quick.groups.map((g, i) => (
              <React.Fragment key={g.key}>
                {i > 0 ? <LidSeparator /> : null}
                <LidGroup group={g} onChange={quick.onGroupChange} />
              </React.Fragment>
            ))
          : null}
        {quick && quick.groups.length > 0 ? <LidSeparator /> : null}
        <LidChip
          outline
          active={filterOpen}
          aria-expanded={filterOpen}
          aria-controls={filterOpen ? detailId : undefined}
          count={nDetail > 0 ? nDetail : undefined}
          title="화류번호 · 상표 · 제조사 · 등록관서 · 등록일자"
          onClick={() => setFilterOpen((o) => !o)}
        >
          <SlidersHorizontal aria-hidden="true" className="size-[13px]" />
          상세 거르기
        </LidChip>
        {narrowed ? (
          <LidResetLink onClick={clearAll}>
            <span aria-hidden="true">✕ </span>조건 지우기
          </LidResetLink>
        ) : null}
        {quick ? (
          <LidSearch
            onClear={() => quick.onQueryChange("")}
            inputProps={{
              "aria-label": "화류번호 · 모델명 · 상표 찾기",
              placeholder: "화류번호 · 모델명 · 상표",
              value: quick.query,
              onChange: (e) => quick.onQueryChange(e.target.value),
            }}
            className="flex-[0_1_220px]"
          />
        ) : null}
        {canEdit ? (
          <span className={cn(!quick && "ml-auto")}>
            {/* 진한 뚜껑 위라 primary 는 묻힌다 — 밝은 soft(사건관리 목록과 같은 결) */}
            <WorkbenchButton icon={Plus} onClick={onRegister}>
              등록
            </WorkbenchButton>
          </span>
        ) : null}
      </BoardLid>
      {filterRow}
      {/* 목록 머리 한 줄: 승인 진행 · (찾는 중) 찾은 수 ……… 보기 크기 · 카드 | 목록(작게) */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-[14px] gap-y-[6px] border-0 border-b border-solid border-border px-[16px] py-[6px] text-[11.5px] text-muted-foreground">
        {plusOrLive && stageSummary ? <ApproveNote summary={stageSummary} /> : null}
        {quick && quick.query.trim() !== "" ? (
          <span aria-live="polite">
            찾은 신발 <b className="font-code tabular-nums text-foreground">{quick.resultCount}</b>
            <span className="font-code tabular-nums"> / {quick.total}</span>
          </span>
        ) : null}
        <span className="ml-auto inline-flex items-center gap-[8px]">
          {canEdit && showPlus ? (
            <WorkbenchButton size="sm" variant="ghost" icon={Check} disabled={!isAdmin} title="승인 담당만" onClick={() => onPlusAction?.("승인")}>
              승인
            </WorkbenchButton>
          ) : null}
          {view === "pattern" && onCardSizeChange ? (
            <Segmented
              aria-label="카드 크기"
              items={CARD_SIZES.map((s) => ({ value: s, label: s }))}
              value={cardSize}
              onValueChange={(v) => onCardSizeChange(v as ShoeCardSize)}
              className={SMALL_SEG}
            />
          ) : null}
          <Segmented
            aria-label="보기 방식"
            items={[
              { value: "pattern", label: "카드" },
              { value: "list", label: "목록" },
            ]}
            value={view}
            onValueChange={(v) => onViewChange(v === "list" ? "list" : "pattern")}
            className={SMALL_SEG}
          />
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">{body}</div>
      {status === "ready" || status === "empty" ? (
        <div className="shrink-0 border-0 border-t border-solid border-border">
          {/* 바닥 오른쪽 쪽 이동(11/17 사용자 「우하단 검색으로 페이지 넘어갈 수 있고」) — 쪽 번호 Enter · 처음 · 끝 */}
          <Pagination
            jump
            total={status === "empty" ? 0 : total}
            page={page}
            pageSize={pageSize}
            hasNext={status !== "empty" && page * pageSize < total}
            onPageChange={onPageChange}
          />
        </div>
      ) : null}
    </div>
  )
}
