import * as React from "react"
import { ArrowRight, Check, Layers, List, Maximize2, RotateCcw, Search, Sparkles } from "lucide-react"

import { PatternPeek, type PatternLibraryItem } from "@/entities/pattern"
import { cn } from "@/shared/lib/utils"
import { ScanOverlay } from "@/shared/ui/ai"
import { Field, Segmented, WorkbenchButton } from "@/shared/ui/kit"
import { PaneHead, TabMark, UnderlineTabs } from "@/shared/ui/panel"
import {
  DEFAULT_LENS,
  DEFAULT_VIEW_TUNE,
  LensBox,
  stepLens,
  ViewControls,
  viewTuneClass,
  viewTuneLabels,
  type LensSettings,
  type LensSpot,
  type ViewTune,
} from "@/shared/ui/viewer"

import { patternName, ZONE_ROWS } from "../model/constants"
import type { PatternCodeScreenProps, SearchImageSource } from "../model/types"
import { countOverrides, patternWeights, WEIGHT_RULES } from "../model/weight-rules"
import { SubHead } from "./Band"
import { InspectOverlay } from "./InspectOverlay"
import { MatchConditions } from "./MatchConditions"
import { PatternLibrary } from "./PatternLibrary"
import { SearchRunList } from "./SearchRunList"
import { ZoneBoard } from "./ZoneBoard"

const SOURCES = [
  { value: "original", label: "원본" },
  { value: "edited", label: "편집본" },
]

/** 작업판 막대(한 단 밝은 판 + 가는 선 — 이미지 편집 탭 작업판과 같은 결) */
const BAR = "flex shrink-0 flex-wrap items-center gap-x-[8px] gap-y-[4px] bg-panel px-[10px] py-[5px]"
/** 그림 위 꼬리표 */
const TAG = "pointer-events-none absolute rounded-[5px] bg-canvas/90 px-[7px] py-[2px] font-code text-[10px] text-fg-2"

type SideTab = "library" | "conditions" | "history"

export interface PatternWindowProps extends PatternCodeScreenProps {
  /** 문양 편집 · 추출 · 검색을 할 수 있나 */
  canEdit: boolean
  /** 보기 전용 안내 */
  readOnlyNote: string
  /** 실증 역할 칩(기술책임자 · 수사관) */
  roleChips: React.ReactNode
}

/**
 * 사건 창 「문양 코드」 탭(11/17 사용자 「여기도 아까와같이 먹색으로 전문적여 보이게. 그리고 AI 조건은 빼 … 각각 마우스 대면 확대 기능 …
 * 더블 클릭하면 새로운 편집 창 … 조건으로 어떤 검색이 나온지도 이력 … 룰베이스로 가중치 … 전체 문양 리스트」).
 * 감정관 일의 순서대로: 현장 사진을 들여다보며(보기 조정 · 확대경 · 두 번 눌러 크게) 문양을 찾아 4부위에 넣고 빼고,
 * 필수 · 가중치를 정한 뒤 검색하고, 조건별 결과를 이력으로 비교한다. AI 는 문양 추출(제안 + 확신도)만.
 *   머리(밝은 바탕) — 칸 이름 · 제안/확인/필수 수
 *   어두운 작업판(`data-theme="dark"` — 경찰 다크 팔레트 토큰 그대로): 왼쪽 현장 이미지 | 가운데 4부위 문양 행
 *   오른쪽 보조 칸(밝은 바탕 · 왼쪽 가는 선): 문양 목록 · 검색 조건 · 검색 이력
 *   바닥 단추 줄: 진행 · 다음 이미지 | 다시입력 · 검색결과 · 검색
 * 상태 · 핸들러는 단독 진열과 같다(배치만 다름). 좌표 캔버스(`canvasSlot`)는 바깥 상자만 다룬다 — PatternCanvas 좌표 계약 그대로.
 */
export function PatternWindow(props: PatternWindowProps) {
  const { zones, selectedZone, patternMeta, canEdit } = props
  const [sideTab, setSideTab] = React.useState<SideTab>("library")
  const sideTabsId = React.useId()
  const [tune, setTune] = React.useState<ViewTune>(DEFAULT_VIEW_TUNE)
  const [lens, setLens] = React.useState<LensSettings>(DEFAULT_LENS)
  const [inspecting, setInspecting] = React.useState(false)
  // 확대 보기 칸: 확대경이 마지막으로 본 자리(마우스를 떼도 유지 · 「고정」이면 멈춤) · 문양 목록에서 마우스를 올린 문양
  const [spot, setSpot] = React.useState<LensSpot | null>(null)
  const [pinned, setPinned] = React.useState(false)
  const [hovered, setHovered] = React.useState<PatternLibraryItem | null>(null)

  const weights = React.useMemo(
    () => patternWeights(zones, patternMeta, props.patternKinds, props.weightOverrides),
    [zones, patternMeta, props.patternKinds, props.weightOverrides]
  )
  const overrideCount = countOverrides(props.weightOverrides)
  const counts = ZONE_ROWS.reduce(
    (acc, { zone }) => {
      for (const [path, flag] of zones[zone]) {
        const st = patternMeta?.[zone]?.[patternName(path)]?.status
        if (st === "suggested") acc.sug += 1
        if (st === "ai") acc.ok += 1
        if (flag) acc.must += 1
      }
      return acc
    },
    { sug: 0, ok: 0, must: 0 }
  )
  const cls = viewTuneClass(tune)
  const canvasCls = viewTuneClass({ ...tune, rotate: 0 })
  const tuneLabels = viewTuneLabels(tune)
  const progress = props.showPlus === false ? undefined : props.imageProgress
  const runs = props.searchRuns
  const extracting = props.extractState === "running"
  const sourceLabel = props.searchImage === "edited" ? (props.editedLook ? `편집본 · ${props.editedLook}` : "편집본") : "원본"
  const lensStep = (by: 1 | -1) => setLens((l) => ({ ...l, size: stepLens(l.size, by) }))

  const library = {
    kind: props.paletteKind,
    onKindChange: props.onPaletteKindChange,
    palette: props.palette,
    kindCounts: props.paletteCounts,
    zones,
    selectedZone,
    onSelectZone: props.onSelectZone,
    onInsert: props.onInsertPattern,
    onRemove: props.onRemovePattern,
    canEdit,
    extracted: props.extracted,
    extractState: props.extractState,
    codeNote: props.codeNote,
  }

  const sourcePicker = (
    <Segmented
      aria-label="검색 이미지"
      items={SOURCES}
      value={props.searchImage}
      onValueChange={(v) => props.onSearchImageChange(v as SearchImageSource)}
      className="p-[2px] [&_button]:px-[7px] [&_button]:py-[1px] [&_button]:text-[11px]"
    />
  )

  const research =
    props.researchState === "running" ? (
      // 재검색은 이 탭의 AI 일(문양 추출 — 결정 기록 §3-3)이 아니다 — AI 진행 막대 대신 글자만(2회차 검수, motion.md)
      <span role="status" className="flex min-w-[140px] flex-1 items-center gap-[6px] text-[11px] text-muted-foreground">
        <span className="whitespace-nowrap">결과 갱신 중…</span>
      </span>
    ) : (
      <span role="status" className="min-w-0 truncate text-[11px] text-muted-foreground">
        {props.researchState === "done" ? `필수 ${counts.must}개로 결과를 갱신했습니다` : null}
      </span>
    )

  // 좁은 창(1280 + 왼쪽 목록 펼침 — 안쪽 폭 약 884)에서는 앞말(문양 · 검색)과 탭 뒤 수를 숨겨 세 탭이 한 줄에 들게 한다.
  // 기준 920(1회차 검수: 860 이면 1280 + 목록 펼침에서 발동하지 않아 오른쪽 탭이 잘림)
  // 탭 안은 flex 라 낱말 사이 빈칸이 접히므로 보이는 글은 앞말 끝 빈칸(U+00A0)으로 띄우고, 이름은 숨은 글로 그대로 준다
  const tabName = (lead: string, word: string) => (
    <>
      <span aria-hidden="true">
        <span className="@max-[920px]:hidden">{`${lead} `}</span>
        {word}
      </span>
      <span className="sr-only">{`${lead} ${word}`}</span>
    </>
  )
  const countMark = (n: number) => (
    <span className="@max-[920px]:hidden">
      <TabMark kind="count" count={n} />
    </span>
  )
  const sideTabs: [SideTab, React.ReactNode][] = [
    ["library", tabName("문양", "목록")],
    ["conditions", <>{tabName("검색", "조건")}{overrideCount > 0 ? countMark(overrideCount) : null}</>],
    ["history", <>{tabName("검색", "이력")}{runs ? countMark(runs.length) : null}</>],
  ]

  const handleSearch = () => {
    props.onSearch()
    if (runs) setSideTab("history")
  }

  return (
    <section
      aria-label="문양 코딩"
      aria-busy={false}
      data-screen="S04"
      data-slot="pattern-code-window"
      className="@container relative flex h-full min-h-0 min-w-0 flex-col gap-[8px] p-[12px]"
    >
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_280px] @max-[920px]:grid-cols-[minmax(0,1fr)_240px]">
        <div className="flex min-h-0 min-w-0 flex-col gap-[8px] pr-[14px] @max-[920px]:pr-[10px]">
          <PaneHead
            title="문양 코딩"
            tip="현장 이미지를 두 번 누르면 크게 살펴봅니다. 문양은 오른쪽 목록에서 누르거나 끌어 넣고, 카드에서 필수 · 가중치를 정합니다. 확인 전 AI 제안은 검색에 들어가지 않습니다."
            sub={`제안 ${counts.sug} · 확인 ${counts.ok} · 필수 ${counts.must}`}
          />
          <div
            data-theme="dark"
            data-slot="pattern-workbench"
            className="grid min-h-0 flex-1 grid-cols-[252px_minmax(0,1fr)] overflow-hidden rounded-[12px] border border-solid border-border bg-panel text-foreground [box-shadow:0_6px_18px_var(--t-panel-drop)] @max-[920px]:grid-cols-[216px_minmax(0,1fr)]"
          >
            {/* 왼쪽: 현장 이미지 — 보기 조정 · 확대경 · 두 번 눌러 크게 */}
            <section aria-label="현장 이미지" className="flex min-h-0 min-w-0 flex-col border-0 border-r border-solid border-border">
              <div className={cn(BAR, "border-0 border-b border-solid border-border")}>
                <h3 className="m-0 text-[12.5px] font-bold whitespace-nowrap text-foreground">현장 이미지</h3>
                {sourcePicker}
                <WorkbenchButton
                  size="sm"
                  variant="ghost"
                  icon={Maximize2}
                  iconOnly
                  aria-label="크게 살펴보기"
                  title="크게 살펴보기 — 이미지를 두 번 눌러도 열립니다"
                  className="ml-auto"
                  onClick={() => setInspecting(true)}
                />
              </div>
              <div className={cn(BAR, "border-0 border-b border-solid border-border py-[4px]")}>
                <ViewControls tune={tune} onTuneChange={setTune} lens={lens} onLensChange={setLens} />
              </div>
              <div className="relative min-h-0 flex-1 bg-canvas p-[10px]">
                <LensBox
                  enabled={lens.on}
                  size={lens.size}
                  zoom={lens.zoom}
                  source={props.lensSource}
                  tune={cls}
                  lensSlot="pattern-lens"
                  onLensMove={pinned ? undefined : setSpot}
                  onSizeStep={lensStep}
                  onDoubleClick={() => setInspecting(true)}
                  className="size-full"
                >
                  {/* 경계선 캔버스 바깥 상자(슬롯) — 안쪽 좌표 캔버스(PatternCanvas)는 이 상자를 꽉 채운다. 보기 조정은 겹 클래스만 */}
                  <div
                    title="두 번 누르면 크게 살펴봅니다"
                    className="relative size-full min-w-0 overflow-hidden rounded-[8px] border border-solid border-line-3 bg-canvas [box-shadow:0_8px_24px_var(--t-panel-drop)]"
                  >
                    {/* 좌표 캔버스 겹은 색 필터(대비 · 밝기 · 반전 · 이진화 · 감마)만 — 회전 같은 변형은 bounding rect 를 바꿔 좌표가 틀어지므로 절대 걸지 않는다(1회차 검수 확인) */}
                    <div className={cn("absolute inset-0", canvasCls.outer)}>
                      <div className={cn("absolute inset-0", canvasCls.inner)}>{props.canvasSlot}</div>
                    </div>
                    <ScanOverlay active={extracting} />
                    <span className={cn(TAG, "top-[6px] right-[6px]")}>{sourceLabel}</span>
                    {tuneLabels.length ? <span className={cn(TAG, "top-[30px] right-[6px] text-brand")}>{tuneLabels.join(" · ")}</span> : null}
                    <span className={cn(TAG, "bottom-[6px] left-[6px] bg-transparent px-0 text-muted-foreground")}>ROI · 경계선 끌어서 조정</span>
                  </div>
                </LensBox>
              </div>
              <div className={cn(BAR, "flex-col items-stretch border-0 border-t border-solid border-border py-[7px]")}>
                {/* R6 1280: 좁을 때 두 줄로 깨지지 않게 한 줄 + … (전체는 마우스 설명) */}
                {props.showPlus !== false && props.priceTagWarning ? (
                  <p title="가격표 자리 — AI가 문양을 못 잡을 수 있습니다" className="m-0 truncate text-[10px] leading-[1.4] text-warn">
                    ▣ 가격표 자리 — AI가 문양을 못 잡을 수 있습니다
                  </p>
                ) : null}
                <WorkbenchButton
                  variant="soft"
                  icon={Sparkles}
                  disabled={!canEdit || extracting}
                  onClick={props.onExtract}
                  title="이 탭의 AI 기능 — 문양 추출(제안 + 확신도). 확인 전 제안은 검색에 들어가지 않습니다"
                  className="w-full justify-center border-ai-line text-ai hover:border-ai"
                >
                  {props.searchImage === "edited" ? "편집한 이미지로 다시 추출" : "원본 이미지로 추출"}
                </WorkbenchButton>
              </div>
            </section>

            {/* 가운데: 상 · 중 · 하 · 윤곽 4부위 문양 */}
            <section aria-label="현장 이미지 문양" className="flex min-h-0 min-w-0 flex-col bg-canvas">
              <div className={cn(BAR, "border-0 border-b border-solid border-border")}>
                <h3 className="m-0 text-[12.5px] font-bold whitespace-nowrap text-foreground">4부위 문양</h3>
                {research}
                <span className="ml-auto inline-flex items-center gap-[4px]">
                  {patternMeta ? (
                    <WorkbenchButton
                      size="sm"
                      variant="ghost"
                      icon={Check}
                      disabled={!canEdit || counts.sug === 0 || !props.onConfirmAllSuggestions}
                      onClick={props.onConfirmAllSuggestions}
                    >
                      <span className="@max-[920px]:sr-only">제안 모두 확인</span>
                    </WorkbenchButton>
                  ) : null}
                  <WorkbenchButton
                    size="sm"
                    variant="ghost"
                    icon={Layers}
                    title="상·중·하 같은 문양 한 번에"
                    disabled={!canEdit}
                    onClick={() => props.onPlusAction?.("상·중·하 같은 문양 한 번에")}
                  >
                    <span className="@max-[1000px]:sr-only">상·중·하 같은 문양 한 번에</span>
                  </WorkbenchButton>
                </span>
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-[8px] overflow-y-auto p-[10px] @max-[920px]:p-[8px]">
                <ZoneBoard
                  zones={zones}
                  selectedZone={selectedZone}
                  onSelectZone={props.onSelectZone}
                  onDropToZone={props.onInsertPatternToZone}
                  onRemovePattern={props.onRemovePattern}
                  onToggleEssential={props.onToggleEssential}
                  canEdit={canEdit}
                  meta={patternMeta}
                  weights={weights}
                  onWeightChange={props.onWeightChange}
                  onConfirmSuggestion={props.onConfirmSuggestion}
                  onCountChange={props.onCountChange}
                />
                {props.onSoleTextChange ? (
                  <label className="grid grid-cols-[46px_minmax(0,1fr)] items-center gap-[8px] px-[8px]">
                    <b className="text-[12.5px] text-foreground">문자열</b>
                    <Field
                      aria-label="문자열"
                      placeholder="밑창에 글자가 보이면 입력"
                      value={props.soleText ?? ""}
                      readOnly={!canEdit}
                      onChange={(e) => props.onSoleTextChange?.(e.target.value)}
                      className="text-[12.5px]"
                    />
                  </label>
                ) : null}
              </div>
            </section>
          </div>
        </div>

        {/* 오른쪽 보조 칸 — 밝은 바탕, 왼쪽 가는 선 */}
        <section aria-label="문양 · 검색" className="flex min-h-0 min-w-0 flex-col gap-[10px] border-0 border-l border-solid border-border pl-[14px] @max-[920px]:pl-[10px]">
          <UnderlineTabs label="문양 · 검색" tabs={sideTabs} value={sideTab} onChange={setSideTab} idPrefix={sideTabsId} />
          <div role="tabpanel" aria-labelledby={`${sideTabsId}-${sideTab}`} className="flex min-h-0 min-w-0 flex-1 flex-col gap-[14px] overflow-y-auto px-[2px]">
            {sideTab === "library" ? (
              <>
                <PatternPeek
                  lens={
                    lens.on
                      ? { spot, zoom: lens.zoom, source: props.lensSource, tune: cls, pinned, onPinnedChange: setPinned }
                      : null
                  }
                  pattern={hovered}
                />
                <PatternLibrary {...library} onHoverItem={(it) => (it ? setHovered(it) : undefined)} className="min-h-[160px] flex-1" />
              </>
            ) : sideTab === "conditions" ? (
              <>
                <MatchConditions value={props.matchConditions} onChange={props.onMatchConditionsChange} bare />
                <section aria-label="가중치 규칙" className="flex flex-col gap-[6px]">
                  <SubHead title="가중치 규칙">
                    <span title="합을 −1 ~ +1 로 자름 · 카드에서 고른 「직접」 값이 규칙보다 먼저 · 필수는 따로 거르기" className="text-[11px] text-muted-foreground">
                      직접 {overrideCount}개
                    </span>
                  </SubHead>
                  <ul className="m-0 flex list-none flex-col gap-[3px] p-0">
                    {WEIGHT_RULES.map((r) => (
                      <li key={r.id} className="flex gap-[6px] text-[11px] text-fg-2">
                        <b className="w-[20px] shrink-0 font-code text-[10px] font-semibold text-muted-foreground">{r.id}</b>
                        {r.text}
                      </li>
                    ))}
                  </ul>
                  <WorkbenchButton
                    size="sm"
                    variant="soft"
                    icon={RotateCcw}
                    disabled={!canEdit || overrideCount === 0 || !props.onResetWeights}
                    onClick={props.onResetWeights}
                    className="self-start"
                  >
                    규칙 기본값으로
                  </WorkbenchButton>
                </section>
              </>
            ) : (
              <section aria-label="검색이력" className="flex min-w-0 flex-col gap-[6px]">
                <SearchRunList runs={runs ?? []} currentNo={props.currentRunNo} onRestore={props.onRestoreRun} onOpen={props.onOpenRun} canEdit={canEdit} />
              </section>
            )}
          </div>
        </section>
      </div>

      {/* 바닥 단추 줄: 진행 · 다음 이미지 | 다시입력 · 검색결과 · 검색(닫기는 창 ✕) */}
      <div className="flex shrink-0 flex-wrap items-center gap-[8px] border-0 border-t border-solid border-border pt-[8px]">
        {!canEdit ? <span className="text-[11px] text-muted-foreground">{props.readOnlyNote}</span> : null}
        {progress ? (
          <span className="flex min-w-0 items-center gap-[8px] text-[11px] text-muted-foreground">
            <span className="font-code tabular-nums">
              {progress.total}장 중 {progress.done}장 완료
            </span>
            {progress.next ? (
              <WorkbenchButton size="sm" variant="ghost" onClick={() => props.onNextImage?.(progress.next as string)}>
                다음 이미지 {progress.next.slice(progress.next.lastIndexOf("_"))}
                <ArrowRight aria-hidden="true" className="size-[13px]" strokeWidth={2} />
              </WorkbenchButton>
            ) : null}
          </span>
        ) : null}
        {props.roleChips}
        <span className="ml-auto flex flex-wrap items-center gap-[6px]">
          <WorkbenchButton variant="ghost" icon={RotateCcw} disabled={!canEdit} onClick={props.onReset}>
            다시입력
          </WorkbenchButton>
          <WorkbenchButton variant="soft" icon={List} onClick={props.onOpenResults}>
            검색결과
          </WorkbenchButton>
          <WorkbenchButton variant="primary" icon={Search} title="신발 검색" disabled={!canEdit} onClick={handleSearch}>
            검색
          </WorkbenchButton>
        </span>
      </div>

      {inspecting ? (
        <InspectOverlay
          aprthngNo={props.aprthngNo}
          searchImage={props.searchImage}
          onSearchImageChange={props.onSearchImageChange}
          source={props.lensSource}
          tune={tune}
          onTuneChange={setTune}
          lens={lens}
          onLensChange={setLens}
          library={library}
          onClose={() => setInspecting(false)}
        />
      ) : null}
    </section>
  )
}
