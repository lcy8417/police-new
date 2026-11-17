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
  RadioRow,
  Segmented,
  WorkbenchButton,
  type DataGridColumn,
  type FilterGroup,
} from "@/shared/ui/kit"
import { SoleThumb } from "@/shared/ui/viewer"

import type { ShoeCardSize, ShoeDbFilters, ShoeDbPanelExtra, ShoeDbScreenProps } from "../model/types"
import { ShoeCard } from "./ShoeCard"
import { ShoeEditor } from "./ShoeEditor"
import { StageLine } from "./StageStrip"

const APPROVAL_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "yes", label: "승인" },
  { value: "no", label: "미승인" },
]
const PATTERN_INPUT_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "in", label: "입력" },
  { value: "out", label: "미입력" },
]
const SMALL_SEG = "p-[2px] [&_button]:px-[8px] [&_button]:py-[1px] [&_button]:text-[11px]"

// 카드 크기 → 격자(폭에 맞춰 채움) · 사진 높이. 클래스는 통째로 적어야 Tailwind 가 만든다
const CARD_SIZES: readonly ShoeCardSize[] = ["작게", "보통", "크게"]
const PANEL_CARD: Record<ShoeCardSize, { grid: string; image: string }> = {
  작게: { grid: "grid-cols-[repeat(auto-fill,minmax(92px,1fr))]", image: "h-[72px]" },
  보통: { grid: "grid-cols-[repeat(auto-fill,minmax(118px,1fr))]", image: "h-[104px]" },
  크게: { grid: "grid-cols-[repeat(auto-fill,minmax(176px,1fr))]", image: "h-[168px]" },
}

const hasPattern = (s: Shoe) => s.top.length + s.mid.length + s.bottom.length + s.outline.length > 0

/** 걸러 둔 상세 조건 수(기본값과 다른 것) */
function activeFilterCount(f: ShoeDbFilters): number {
  return [f.ftwrId, f.brandCode, f.makrCode].filter((v) => v.trim() !== "").length + (f.approval !== "all" ? 1 : 0) + (f.patternInput !== "all" ? 1 : 0) + (f.office ? 1 : 0)
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

export type ShoeDbPanelProps = Omit<ShoeDbScreenProps, "auto"> & ShoeDbPanelExtra

/**
 * 신발 DB 슬라이드 패널 본문(사건관리 위 막대 「신발 DB」 · `?shoe=1`). 패널 머리가 제목이라 쪽 제목 · 위치 표시가 없다.
 *   뚜껑 한 줄: 상태 칩(수) · 중복 의심 · 필터 ▾ ……… 찾기 · + 등록
 *   (필터를 펴면) 작은 조건 양식 한 판 — SCAS 조회 항목 중 자주 쓰는 것만
 *   도구 줄: 작업 단계 한 줄 ……… 카드 | 목록 · 카드 크기
 *   카드 격자(AI 표식은 사람이 봐야 할 때만) → 쪽 넘김
 * 카드를 누르거나 「등록」을 누르면 목록 자리에 큰 편집 판(ShoeEditor)이 들어선다. 자동 넘기기 · 엑셀 · 초기화는 없다.
 */
export function ShoeDbPanel(props: ShoeDbPanelProps) {
  const { status, errorAt, onRetry, isAdmin, features, filters, onFiltersChange, officeItems, onSearch, onReset } = props
  const { view, onViewChange, shoes, total, page, pageSize, onPageChange, selectedId, onOpenShoe, onRegister, dialog } = props
  const { showPlus = true, onPlusAction, stageSummary, cardInfo, aiDetails, quick, cardSize = "보통", onCardSizeChange } = props
  const { live = false, duty } = props
  const [filterOpen, setFilterOpen] = React.useState(false)
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
  const applied = props.filtersApplied ?? true
  const nFilter = applied ? activeFilterCount(filters) : 0
  const quickActive = quick !== undefined && (quick.query.trim() !== "" || quick.groups.some((g) => g.value.length > 0))
  // 빠른 찾기 · 걸린 상세 조건으로 0건 — 빈 격자가 아니라 「조건에 맞는 항목 없음 · 조건 지우기」
  const quickEmpty = status === "ready" && ((quickActive && quick.resultCount === 0) || (props.filtersApplied === true && total === 0))
  const clearAll = () => {
    if (quickActive) quick?.onClear()
    if (props.filtersApplied) onReset()
  }
  const size = PANEL_CARD[cardSize]

  // 한 줄 = 이름 + 칸. 칸마다 자기 접근성 이름(aria-label)이 있어 `<label>` 로 감싸지 않는다 —
  // 등록일자(입력 2개) · 단추 묶음을 `<label>` 이 감싸 첫 칸으로 누름 · 이름이 쏠리던 것(3회차 검수)
  const label = (text: string, field: React.ReactNode, wide = false) => (
    <div className={cn("grid min-w-0 grid-cols-[64px_minmax(0,1fr)] items-center gap-[8px] text-[12.5px] text-muted-foreground", wide && "col-span-2")}>
      <span aria-hidden="true">{text}</span>
      {field}
    </div>
  )

  const filterForm = filterOpen ? (
    <div role="group" aria-label="상세 조건" className="grid grid-cols-[repeat(4,minmax(0,1fr))] gap-x-[16px] gap-y-[8px] border-0 border-b border-solid border-border bg-strip px-[18px] py-[10px]">
      {label("화류번호", <Field variant="mono" aria-label="화류번호" value={filters.ftwrId} onChange={(e) => set({ ftwrId: e.target.value })} />)}
      {label("상표", <Field aria-label="상표" value={filters.brandCode} onChange={(e) => set({ brandCode: e.target.value })} />)}
      {label("제조사", <Field aria-label="제조사" value={filters.makrCode} onChange={(e) => set({ makrCode: e.target.value })} />)}
      {/* 등록관서 · 등록일자 · 승인 = 진열(showPlus) 또는 서버 거르기(live, J1). 등록관서는 관서 목록이 있을 때만 — 화면 이식 계획 §4 ④ */}
      {showOffice ? label("등록관서", <Combobox aria-label="등록관서" items={officeItems} value={filters.office} onValueChange={(office) => set({ office })} placeholder="전체" />) : null}
      {plusOrLive ? label(
        "등록일자",
        <span className="flex min-w-0 items-center gap-[6px]">
          <Field variant="mono" aria-label="등록일자 시작일" value={filters.regFrom} onChange={(e) => set({ regFrom: e.target.value })} />
          <span aria-hidden="true">~</span>
          <Field variant="mono" aria-label="등록일자 종료일" value={filters.regTo} onChange={(e) => set({ regTo: e.target.value })} />
        </span>,
        true,
      ) : null}
      {plusOrLive ? label("승인", <RadioRow name="승인" options={APPROVAL_OPTIONS} value={filters.approval} onValueChange={(approval) => set({ approval })} />) : null}
      {label("문양", <RadioRow name="문양 입력" options={PATTERN_INPUT_OPTIONS} value={filters.patternInput} onValueChange={(patternInput) => set({ patternInput })} />)}
      <span className="col-span-4 flex items-center justify-end gap-[6px]">
        <WorkbenchButton size="sm" variant="ghost" onClick={onReset}>
          조건 지우기
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
      render: (s) => (s.image ? <SoleThumb src={s.image} alt={`${s.ftwrId} 바닥`} size="sm" onClick={() => onOpenShoe(s.ftwrId)} /> : <span className="text-dim">—</span>),
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
  } else if (quickEmpty) {
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
        {quick ? <LidSeparator /> : null}
        <LidChip outline active={filterOpen} aria-expanded={filterOpen} count={nFilter > 0 ? nFilter : undefined} onClick={() => setFilterOpen((o) => !o)}>
          <SlidersHorizontal aria-hidden="true" className="size-[13px]" />
          필터
        </LidChip>
        {quickActive ? (
          <LidResetLink onClick={quick.onClear}>
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
      {filterForm}
      <div className="flex shrink-0 flex-wrap items-center gap-x-[12px] gap-y-[6px] border-0 border-b border-solid border-border px-[16px] py-[7px]">
        {plusOrLive && stageSummary ? (
          <span data-plus="" className="min-w-0">
            <StageLine summary={stageSummary} />
          </span>
        ) : null}
        <span className="ml-auto inline-flex items-center gap-[8px]">
          {quick ? (
            <span className="font-code text-[11px] text-muted-foreground tabular-nums">
              {quick.resultCount} / {quick.total}
            </span>
          ) : null}
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
          <Pagination total={status === "empty" ? 0 : total} page={page} pageSize={pageSize} hasNext={status !== "empty" && page * pageSize < total} onPageChange={onPageChange} />
        </div>
      ) : null}
    </div>
  )
}
