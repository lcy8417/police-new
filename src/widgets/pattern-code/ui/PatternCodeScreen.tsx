import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { AiProgress, ScanOverlay } from "@/shared/ui/ai"
import { Button, Chip, ColumnPicker, DataGrid, Field, FilterBar, InlineError, Segmented, type DataGridColumn } from "@/shared/ui/kit"
import { ButtonBar, PaneHead, Panel, TabMark, UnderlineTabs } from "@/shared/ui/panel"

import { filterHistory, HISTORY_COLUMNS } from "../model/history-view"
import { patternCodeAccess } from "../model/access"
import { IMAGE_STATUS_LABEL, patternName, ZONE_ROWS } from "../model/constants"
import type {
  ImageCodingStatus,
  PatternCodeScreenProps,
  ResearchState,
  SearchHistoryRow,
  SearchImageSource,
} from "../model/types"
import { Band, SubHead } from "./Band"
import { ExtractResults } from "./ExtractResults"
import { MatchConditions } from "./MatchConditions"
import { PalettePanel } from "./PalettePanel"
import { SearchFunnel, SearchMethodPicker } from "./SearchPlus"
import { ZoneRows } from "./ZoneRows"

const SOURCES = [
  { value: "original", label: "원본" },
  { value: "edited", label: "편집본" },
]

const CELL = "font-code text-[11.5px]"

/**
 * 검색 이력 열 — 시안 SCAS 열(검색번호 · 결과건수 · 검색방법 · 검색결과 · 검색일) 그대로, 뒤에 지금 기능 F22 의
 * 순위 · 매칭된 신발 정보를 덧붙인다(SKILL 「새 칸은 맨 끝」). 지금 API 에 없는 값(결과건수 · 검색방법)은 「—」.
 */
function historyColumns(onOpen: (searchNo: number) => void): DataGridColumn<SearchHistoryRow>[] {
  return [
    { key: "searchNo", header: "검색번호", render: (r) => <span className={CELL}>{r.searchNo}</span> },
    {
      key: "resultCount",
      header: "결과건수",
      align: "right",
      render: (r) => <span className={`${CELL} tabular-nums`}>{r.resultCount == null ? "—" : r.resultCount}</span>,
    },
    { key: "method", header: "검색방법", render: (r) => r.method ?? <span className="text-dim">—</span> },
    {
      key: "open",
      header: "검색결과",
      render: (r) => (
        <Button size="sm" className="h-[20px] px-[5px]" onClick={() => onOpen(r.searchNo)}>
          보기
        </Button>
      ),
    },
    // 저장 시각 `YYYY-MM-DD HH:MM:SS` → 시안 「07-24」(월-일), 전체는 툴팁
    { key: "frstRegistDt", header: "검색일", render: (r) => <span className={CELL} title={r.frstRegistDt}>{r.frstRegistDt.slice(5, 10)}</span> },
    { key: "ranking", header: "순위", align: "right", render: (r) => <span className={CELL}>{r.ranking}</span> },
    {
      key: "mtchgId",
      header: "매칭된 신발 정보",
      // 신발 ID는 문자열 그대로(앞자리 0 보존)
      render: (r) => (r.mtchgId == null ? <span className="text-dim">매칭 없음</span> : <span className={CELL}>{r.mtchgId}</span>),
    },
  ]
}

const IMAGE_COLUMN: DataGridColumn<string> = {
  key: "no",
  header: "이미지 번호",
  render: (no) => <span className="font-code text-[11.5px]">{no}</span>,
}

/** 이미지 상태 칩 색(시안: 확인완료 green · 검색 중 blue · 미코딩 기본 · 삭제(중복) 흐린 취소선) */
const STATUS_TONE: Record<ImageCodingStatus, string> = {
  done: "border-ok-line bg-ok-bg text-ok-fg",
  searching: "border-brand-line bg-brand-bg text-brand",
  uncoded: "",
  duplicate: "text-faint line-through",
}

/** idle 안내 글(사건 창에서는 칸 머리 ⓘ 말풍선으로) */
const researchIdleText = (essentialCount: number) => `필수 문양(${essentialCount}개)만 검색에 쓰입니다 — 바꾸면 결과를 다시 찾습니다.`

/** 필수 문양을 바꾼 뒤 실시간 재검색 줄(F20). idle 이면 안내만 — `compact`(사건 창)면 idle 은 빈 줄(안내는 ⓘ) */
function ResearchLine({ state, essentialCount, compact = false }: { state: ResearchState; essentialCount: number; compact?: boolean }) {
  return (
    <div
      role="status"
      className={cn("flex min-h-[24px] min-w-0 items-center gap-[8px] text-[11.5px] text-muted-foreground", compact ? "flex-1 px-[2px]" : "px-[10px]")}
    >
      {state === "running" ? (
        <>
          <span className="whitespace-nowrap">검색 결과 갱신 중…</span>
          <AiProgress state="running" label="검색 결과 갱신" className="flex-1" />
        </>
      ) : state === "done" ? (
        <span>필수 문양 {essentialCount}개로 검색 결과를 갱신했습니다.</span>
      ) : compact ? null : (
        <span>{researchIdleText(essentialCount)}</span>
      )}
    </div>
  )
}

type WindowSideTab = "extract" | "conditions" | "history"

/**
 * S04 문양 코딩 · 검색 조건 —SCAS 「문양 상세보기」 3열(왼쪽 현장 이미지 · 이미지 목록 · 코드 설명 / 가운데 문양 행 ·
 * 팔레트 / 오른쪽 매칭 조건 · 검색이력)과 버튼 줄 그대로. 따로 뜨던 AI 창은 왼쪽 그림 안으로(시안 핀 9).
 * 서버 호출 · 전역 상태 없음, 값은 모두 props(제어형). 경계선 캔버스는 슬롯.
 * 시안 r2 신규(+α) 요소는 `showPlus` 하나로 모두 숨긴다(`data-plus`).
 */
export function PatternCodeScreen(props: PatternCodeScreenProps) {
  const { status, errorAt, onRetry, isAdmin, features, aprthngNo, zones, selectedZone, showPlus = true, patternMeta } = props
  const plus = showPlus
  const historyQuery = props.historyQuery ?? ""
  const shownHistory = filterHistory(props.history, historyQuery)
  const { canEdit, showVerifierChip, showInvestigatorChip } = patternCodeAccess(isAdmin, features, showPlus)
  // 사건 창 오른쪽 칸 탭(보기 상태 — 창 배치에서만 쓴다)
  const [sideTab, setSideTab] = React.useState<WindowSideTab>("extract")
  const sideTabsId = React.useId()
  const inserted = React.useMemo(
    () => new Set(zones[selectedZone].map(([path]) => patternName(path))),
    [zones, selectedZone],
  )
  const essentialCount = ZONE_ROWS.reduce((n, { zone }) => n + zones[zone].filter(([, flag]) => Boolean(flag)).length, 0)
  // AI 제안 · 확인 개수(시안 「AI 제안 3 · 확인 2」)
  const counts = ZONE_ROWS.reduce(
    (acc, { zone }) => {
      for (const [path] of zones[zone]) {
        const st = patternMeta?.[zone]?.[patternName(path)]?.status
        if (st === "suggested") acc.sug += 1
        if (st === "ai") acc.ok += 1
      }
      return acc
    },
    { sug: 0, ok: 0 },
  )
  const extractLabel = props.searchImage === "edited" ? "✦ 편집한 이미지로 다시 추출" : "✦ 원본 이미지로 추출"
  const imageColumns: DataGridColumn<string>[] =
    plus && props.imageStatuses
      ? [
          IMAGE_COLUMN,
          {
            key: "status",
            header: "상태",
            render: (no) => {
              const st = props.imageStatuses?.[no]
              return st ? (
                <Chip variant="h19" className={`px-[6px] text-[10.5px] ${STATUS_TONE[st]}`}>
                  {IMAGE_STATUS_LABEL[st]}
                </Chip>
              ) : null
            },
          },
        ]
      : [IMAGE_COLUMN]
  const progress = plus ? props.imageProgress : undefined

  // ── 두 배치(단독 진열 · 사건 창)가 같이 쓰는 조각 — 상태 · 핸들러는 하나 ──
  const aiManageButton = (
    <span title="준비 중" className="inline-flex">
      <Button size="sm" disabled className="text-ai [box-shadow:inset_0_0_0_1px_var(--t-ai)]">
        인공지능문양관리
      </Button>
    </span>
  )
  const resultsButton = (
    <Button size="sm" onClick={props.onOpenResults}>
      검색결과
    </Button>
  )
  const searchButton = (
    <Button size="sm" variant="pri" title="신발 검색" disabled={!canEdit} onClick={props.onSearch}>
      검색
    </Button>
  )
  const resetButton = (
    <Button size="sm" disabled={!canEdit} onClick={props.onReset}>
      다시입력
    </Button>
  )
  const extractButton = (className?: string) => (
    <Button size="sm" variant="ai" disabled={!canEdit || props.extractState === "running"} onClick={props.onExtract} className={className}>
      {extractLabel}
    </Button>
  )
  const roleChips = (
    <>
      {plus && showVerifierChip ? (
        <Chip data-plus="" variant="h22">
          기술책임자 · 보기만
        </Chip>
      ) : null}
      {plus && showInvestigatorChip ? (
        <Chip data-plus="" variant="h22">
          수사관 · 볼 수 없음
        </Chip>
      ) : null}
    </>
  )
  const buttons = (
    <ButtonBar variant="modal-head" aria-label="문양 상세보기 버튼">
      {aiManageButton}
      {resultsButton}
      {searchButton}
      {resetButton}
      <Button size="sm" onClick={props.onClose}>
        닫기
      </Button>
      <span aria-hidden="true" className="h-[20px] w-px bg-line-3" />
      {extractButton()}
      {roleChips}
    </ButtonBar>
  )
  const readOnlyNote = plus
    ? "보기 전용 — 문양 편집 · 추출 · 검색은 감정관 · 관리자만 할 수 있습니다."
    : "보기 전용 — 문양 편집 · 추출 · 검색은 사건 조회 권한이 있어야 합니다."

  const sourcePicker = (
    <Segmented
      aria-label="검색 이미지"
      items={SOURCES}
      value={props.searchImage}
      onValueChange={(v) => props.onSearchImageChange(v as SearchImageSource)}
      className="p-[2px] [&_button]:px-[8px] [&_button]:py-[2px] [&_button]:text-[11.5px]"
    />
  )
  /** 경계선 캔버스 바깥 상자(슬롯). 크기만 부르는 쪽이 정한다 — 안쪽 좌표 캔버스(PatternCanvas)는 이 상자를 꽉 채운다 */
  const canvasBox = (sizeClass: string) => (
    <div className={cn("relative min-w-0 overflow-hidden rounded-[10px] border border-solid border-border bg-canvas", sizeClass)}>
      {props.canvasSlot}
      <ScanOverlay active={props.extractState === "running"} />
      {plus ? (
        // 시안: 현장 이미지는 AI가 보는 동안 3.6초 주기로 훑는다
        <ScanOverlay active data-plus="" className="motion-safe:[animation-duration:3.6s]" />
      ) : null}
      <Chip variant="h20-warn" className="pointer-events-none absolute top-[6px] right-[6px] border-ai-line bg-ai-bg text-ai">
        {props.searchImage === "edited" ? (props.editedLook ? `편집본 · ${props.editedLook}` : "편집본") : "원본"}
      </Chip>
      <span className="pointer-events-none absolute bottom-[6px] left-[8px] font-code text-[10.5px] font-semibold text-fg-2">
        ROI · 경계선 끌어서 조정
      </span>
    </div>
  )
  const extractResults = (bare: boolean) => (
    <ExtractResults state={props.extractState} items={props.extracted} inserted={inserted} onInsert={props.onInsertPattern} canEdit={canEdit} bare={bare} />
  )
  const codeNoteText = props.codeNote ? (
    <>
      <span className="font-code text-[11px] text-brand">{props.codeNote.code}</span>
      <br />
      {props.codeNote.text}
    </>
  ) : (
    <span className="text-dim">문양을 고르면 설명이 나옵니다.</span>
  )
  const zoneTools =
    plus && patternMeta ? (
      <>
        <Button
          size="sm"
          variant="ok"
          disabled={!canEdit || counts.sug === 0 || !props.onConfirmAllSuggestions}
          onClick={props.onConfirmAllSuggestions}
        >
          제안 모두 확인
        </Button>
        <Button size="sm" disabled={!canEdit} onClick={() => props.onPlusAction?.("상·중·하 같은 문양 한 번에")}>
          상·중·하 같은 문양 한 번에
        </Button>
      </>
    ) : null
  const zoneRows = (
    <ZoneRows
      zones={zones}
      selectedZone={selectedZone}
      onSelectZone={props.onSelectZone}
      onDropToZone={props.onInsertPatternToZone}
      onRemovePattern={props.onRemovePattern}
      onToggleEssential={props.onToggleEssential}
      canEdit={canEdit}
      plus={plus}
      meta={patternMeta}
      onConfirmSuggestion={props.onConfirmSuggestion}
      onCountChange={props.onCountChange}
    />
  )
  const soleTextRow =
    plus && props.onSoleTextChange ? (
      <div data-plus="" className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-[10px] px-[10px] py-[8px]">
        <b className="text-[15px]">문자열</b>
        <Field
          aria-label="문자열"
          placeholder="밑창에 글자가 보이면 입력"
          value={props.soleText ?? ""}
          readOnly={!canEdit}
          onChange={(e) => props.onSoleTextChange?.(e.target.value)}
        />
      </div>
    ) : null
  const palettePanel = (bare: boolean) => (
    <PalettePanel
      kind={props.paletteKind}
      onKindChange={props.onPaletteKindChange}
      palette={props.palette}
      inserted={inserted}
      onInsert={props.onInsertPattern}
      canEdit={canEdit}
      plus={plus}
      recent={props.recentPatterns}
      onPlusAction={props.onPlusAction}
      bare={bare}
    />
  )
  const columnPicker = props.onHistoryColumnsChange ? (
    <ColumnPicker
      columns={HISTORY_COLUMNS}
      visible={props.historyColumns ?? HISTORY_COLUMNS.map((c) => c.key)}
      onChange={props.onHistoryColumnsChange}
    />
  ) : null
  const historyBody = (
    <>
      {props.onHistoryQueryChange ? (
        <FilterBar
          query={historyQuery}
          onQueryChange={props.onHistoryQueryChange}
          filters={[]}
          onFilterChange={() => undefined}
          onClear={() => props.onHistoryQueryChange?.("")}
          resultCount={shownHistory.length}
          total={props.history.length}
          searchPlaceholder="검색번호 · 방법 · 신발"
          partId="s04-history-search"
        />
      ) : null}
      {historyQuery.trim() !== "" && shownHistory.length === 0 ? (
        <div className="px-[10px] py-[16px] text-center">
          <p role="status" className="m-0 mb-[8px] text-[12px] text-dim">
            조건에 맞는 항목 없음
          </p>
          <Button size="sm" onClick={() => props.onHistoryQueryChange?.("")}>
            조건 지우기
          </Button>
        </div>
      ) : (
        <div className="min-w-0 overflow-x-auto">
          <DataGrid
            columns={historyColumns(props.onOpenHistory).filter(
              (c) => c.key === "searchNo" || !props.historyColumns || props.historyColumns.includes(c.key),
            )}
            rows={shownHistory}
            rowKey={(r) => String(r.searchNo)}
            selectedKey={props.selectedSearchNo == null ? undefined : String(props.selectedSearchNo)}
            onRowClick={(r) => props.onOpenHistory(r.searchNo)}
            className="text-[11px] [&_td]:h-[30px] [&_td]:px-[4px] [&_th]:h-[26px] [&_th]:px-[4px] [&_th]:text-[10.5px]"
          />
        </div>
      )}
    </>
  )

  // 사건 창 안(11/17 사용자 「컴팩트하면서 고급지게」): 왼쪽 현장 이미지(높이 꽉) | 가운데 4부위 · 팔레트(칸 안 스크롤) |
  // 오른쪽 좁은 칸 밑줄 탭(AI 추출 · 검색 조건 · 검색이력), 바닥 한 줄 = 진행 · 다음 이미지 | 단추(검색만 채움).
  // 겹치는 제목 줄(문양 상세보기 · 감정번호) · 닫기 · 이미지 목록 표(창 왼쪽 목록과 같은 일)는 그리지 않는다.
  if (props.inWindow && (status === "ready" || status === "empty")) {
    // 좁은 창(왼쪽 목록 펼침)에서는 탭 뒤 수를 숨겨 세 탭이 한 줄에 들게 한다
    const countMark = (n: number) => (
      <span className="@max-[760px]:hidden">
        <TabMark kind="count" count={n} />
      </span>
    )
    const sideTabs: [WindowSideTab, React.ReactNode][] = [
      ["extract", <>AI 추출{countMark(props.extracted.length)}</>],
      ["conditions", "검색 조건"],
      ["history", <>검색이력{countMark(props.history.length)}</>],
    ]
    return (
      <section
        aria-label="문양 코딩"
        aria-busy={false}
        data-screen="S04"
        data-slot="pattern-code-window"
        className="@container flex h-full min-h-0 min-w-0 flex-col gap-[10px] p-[12px]"
      >
        <div className="grid min-h-0 flex-1 grid-cols-[220px_minmax(0,1fr)_288px] gap-[14px] @max-[760px]:grid-cols-[210px_minmax(0,1fr)_256px]">
          {/* 왼쪽: 현장 이미지 — 경계선 캔버스 바깥 상자만 키운다(좌표 계약은 슬롯 안 PatternCanvas 몫) */}
          <section aria-label="현장 이미지" className="flex min-h-0 min-w-0 flex-col gap-[8px]">
            <PaneHead title="현장 이미지" end={sourcePicker} />
            {canvasBox("min-h-0 flex-1")}
            {plus && props.priceTagWarning ? (
              <p data-plus="" className="m-0 shrink-0 text-[11px] leading-[1.4] text-warn">
                ▣ 가격표 자리 — AI가 문양을 못 잡을 수 있습니다
              </p>
            ) : null}
            {extractButton("w-full shrink-0 justify-center")}
          </section>

          {/* 가운데: 4부위 문양 · 문자열 · 팔레트 */}
          <section aria-label="현장 이미지 문양" className="flex min-h-0 min-w-0 flex-col gap-[6px]">
            <PaneHead
              title="현장 이미지 문양"
              tip={plus && patternMeta ? researchIdleText(essentialCount) : `${researchIdleText(essentialCount)} 끌어 놓기 · 누르면 빼기 · 우클릭 필수.`}
              sub={
                plus && patternMeta ? (
                  <span data-plus="" className="text-ai">
                    AI 제안 {counts.sug} · 확인 {counts.ok}
                  </span>
                ) : undefined
              }
            />
            <div className="flex shrink-0 flex-wrap items-center gap-[6px]">
              <ResearchLine state={props.researchState} essentialCount={essentialCount} compact />
              {zoneTools ? (
                <span data-plus="" className="ml-auto flex flex-wrap items-center gap-[6px]">
                  {zoneTools}
                </span>
              ) : null}
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-[12px] overflow-y-auto pr-[2px]">
              {zoneRows}
              {soleTextRow}
              {palettePanel(true)}
            </div>
          </section>

          {/* 오른쪽: AI 추출 · 검색 조건 · 검색이력 */}
          <section aria-label="추출 · 검색" className="flex min-h-0 min-w-0 flex-col gap-[10px]">
            <UnderlineTabs
              label="추출 · 검색"
              tabs={sideTabs}
              value={sideTab}
              onChange={setSideTab}
              idPrefix={sideTabsId}
            />
            <div
              role="tabpanel"
              aria-labelledby={`${sideTabsId}-${sideTab}`}
              className="flex min-h-0 min-w-0 flex-1 flex-col gap-[14px] overflow-y-auto px-[2px]"
            >
              {sideTab === "extract" ? (
                <>
                  {extractResults(true)}
                  <section aria-label="코드 설명" className="grid gap-[4px]">
                    <SubHead title="코드 설명" />
                    <p className="m-0 text-[12px] leading-[1.5] break-keep text-fg-2">{codeNoteText}</p>
                  </section>
                </>
              ) : sideTab === "conditions" ? (
                <>
                  {plus && props.searchMethod && props.onSearchMethodChange ? (
                    <SearchMethodPicker value={props.searchMethod} onChange={props.onSearchMethodChange} disabled={!canEdit} bare />
                  ) : null}
                  {plus && props.funnel ? <SearchFunnel steps={props.funnel.steps} note={props.funnel.note} /> : null}
                  <MatchConditions value={props.matchConditions} onChange={props.onMatchConditionsChange} bare />
                </>
              ) : (
                <section aria-label="검색이력" className="flex min-w-0 flex-col gap-[6px]">
                  {columnPicker ? <div className="flex justify-end">{columnPicker}</div> : null}
                  {historyBody}
                </section>
              )}
            </div>
          </section>
        </div>

        {/* 바닥 한 줄: 진행 · 다음 이미지 | SCAS 단추(닫기는 창 ✕ 가 맡음) */}
        <div className="flex shrink-0 flex-wrap items-center gap-[8px] border-0 border-t border-solid border-border pt-[8px]">
          {!canEdit ? <span className="text-[11.5px] text-muted-foreground">{readOnlyNote}</span> : null}
          {progress ? (
            <span data-plus="" className="flex min-w-0 items-center gap-[8px] text-[11px] text-dim">
              <span className="font-code tabular-nums">
                {progress.total}장 중 {progress.done}장 완료
              </span>
              {progress.next ? (
                <Button size="sm" onClick={() => props.onNextImage?.(progress.next as string)}>
                  다음 이미지 {progress.next.slice(progress.next.lastIndexOf("_"))} →
                </Button>
              ) : null}
            </span>
          ) : null}
          {roleChips}
          <span className="ml-auto flex flex-wrap items-center gap-[4px]">
            {aiManageButton}
            {resultsButton}
            {resetButton}
            {searchButton}
          </span>
        </div>
      </section>
    )
  }

  let body: React.ReactNode
  if (status === "loading") {
    body = <p className="px-[14px] py-[40px] text-center text-[12.5px] text-muted-foreground">문양 정보를 불러오는 중…</p>
  } else if (status === "error") {
    body = (
      <div className="flex flex-col items-center gap-[6px] px-[14px] py-[40px]">
        <span className="text-[12.5px] text-fg-2">문양 · 검색 이력을 불러오지 못했습니다.</span>
        <InlineError message="확인 못 함" at={errorAt} onRetry={onRetry} />
      </div>
    )
  } else {
    body = (
      <div className="grid gap-[12px] p-[12px] lg:grid-cols-[220px_minmax(0,1fr)_250px] xl:grid-cols-[240px_minmax(0,1fr)_270px]">
        {/* 왼쪽: 현장 이미지 · AI 추출 결과 · 이미지 목록 · 코드 설명 */}
        <div className="flex min-w-0 flex-col gap-[8px]">
          <Band title="현장 이미지">{sourcePicker}</Band>
          {canvasBox("h-[330px]")}
          {plus && props.priceTagWarning ? (
            <p
              data-plus=""
              className="m-0 flex items-center gap-[6px] rounded-[8px] border border-solid border-warn-line bg-warn-bg px-[8px] py-[6px] text-[11px] leading-[1.4] text-warn"
            >
              ▣ 가격표로 보이는 부분 — 이 자리는 AI가 문양을 못 잡을 수 있습니다
            </p>
          ) : null}
          {extractResults(false)}
          <Band title="이미지 목록">
            {progress ? (
              <span data-plus="" className="font-code text-[11px] text-dim tabular-nums">
                {progress.total}장 중 {progress.done}장 완료
              </span>
            ) : (
              <span className="font-code text-[11px] text-dim">{props.images.length}장</span>
            )}
          </Band>
          <DataGrid
            columns={imageColumns}
            rows={[...props.images]}
            rowKey={(no) => no}
            selectedKey={aprthngNo}
            onRowClick={props.onSelectImage}
            className="[&_td]:h-[30px] [&_td]:px-[8px] [&_th]:h-[28px] [&_th]:px-[8px]"
          />
          {progress ? (
            <div data-plus="" className="flex items-center gap-[6px]">
              {progress.rest ? <span className="text-[11px] text-dim">{progress.rest}</span> : null}
              {progress.next ? (
                <Button size="sm" variant="pri" className="ml-auto" onClick={() => props.onNextImage?.(progress.next as string)}>
                  다음 이미지 {progress.next.slice(progress.next.lastIndexOf("_"))} →
                </Button>
              ) : null}
            </div>
          ) : null}
          <Band title="코드 설명" />
          <p className="m-0 rounded-[8px] border border-solid border-border bg-panel-2 px-[10px] py-[8px] text-[12px] leading-[1.5] break-keep text-fg-2">
            {codeNoteText}
          </p>
        </div>

        {/* 가운데: 현장 이미지 문양 4부위 · 팔레트 */}
        <div className="flex min-w-0 flex-col gap-[8px]">
          <Band title="현장 이미지 문양">
            {plus && patternMeta ? (
              <span data-plus="" className="flex flex-wrap items-center justify-end gap-[6px]">
                <span className="text-[11px] text-ai">
                  AI 제안 {counts.sug} · 확인 {counts.ok}
                </span>
                {zoneTools}
              </span>
            ) : (
              <span className="text-[11px] text-dim">끌어 놓기 · 누르면 빼기 · 우클릭 필수</span>
            )}
          </Band>
          <ResearchLine state={props.researchState} essentialCount={essentialCount} />
          {zoneRows}
          {soleTextRow}
          {palettePanel(false)}
        </div>

        {/* 오른쪽: 매칭 조건 · (검색 방식 · 미리보기) · 검색이력 */}
        <div className="flex min-w-0 flex-col gap-[8px]">
          <MatchConditions value={props.matchConditions} onChange={props.onMatchConditionsChange} />
          {plus && props.searchMethod && props.onSearchMethodChange ? (
            <SearchMethodPicker value={props.searchMethod} onChange={props.onSearchMethodChange} disabled={!canEdit} />
          ) : null}
          {plus && props.funnel ? <SearchFunnel steps={props.funnel.steps} note={props.funnel.note} /> : null}
          <section aria-label="검색이력" className="flex flex-col gap-[6px]">
            <Band title="검색이력">{columnPicker}</Band>
            {historyBody}
          </section>
        </div>
      </div>
    )
  }

  return (
    <section aria-label="문양 코딩" aria-busy={status === "loading"} data-screen="S04" className="min-w-0">
      <Panel
        title={
          <>
            문양 상세보기 <span className="font-code font-normal text-muted-foreground">{aprthngNo}</span>
          </>
        }
        actions={buttons}
      >
        {!canEdit && (status === "ready" || status === "empty") ? (
          <p className="px-[14px] pt-[8px] text-[11.5px] text-muted-foreground">{readOnlyNote}</p>
        ) : null}
        {body}
      </Panel>
    </section>
  )
}
