import * as React from "react"

import { shouldHandleShortcut, useAutoPlay } from "@/shared/lib"
import { cn } from "@/shared/lib/utils"
import { AiProgress } from "@/shared/ui/ai"
import {
  AutoPlayControl,
  Button,
  Chip,
  FilterBar,
  InlineError,
  Pagination,
  Segmented,
  ViewCountSwitch,
  type FilterGroup,
} from "@/shared/ui/kit"
import { Panel } from "@/shared/ui/panel"
import { EvidenceImage } from "@/shared/ui/viewer"

import { filterResults, hasActiveFilter, optionCount, type FilterContext, type RankedResult } from "../model/result-filter"
import { viewerRoles } from "../model/roles"
import { parseSimilarity } from "../model/similarity"
import type {
  ImageMode,
  ResultColumns,
  ResultFilterKey,
  SearchResultScreenProps,
  SearchTarget,
  ThumbSize,
} from "../model/types"
import { AiTopRail } from "./AiTopRail"
import { LeftPlus } from "./LeftPlus"
import { AI_MARK, CHIP_TEAL, FILTER_NOTE, STAR_NOTE } from "./plus-style"
import { QuickPeekWindow } from "./QuickPeekWindow"
import { ResultCard } from "./ResultCard"
import { ResultDetail } from "./ResultDetail"
import { SearchWindow } from "./SearchWindow"
import { ShortcutHelp } from "./ShortcutHelp"

// S05 검색 결과(F23 · F24) — SCAS 「문양검색결과」 배치: 위 이미지번호 · 결과형태, 왼쪽 현장 족적(고정), 오른쪽 결과 그리드.
// 값은 모두 props(서버 호출 0줄). 보기 거르기 · 상세조회 칸 열림은 저장하지 않는 보기 방식이라 위젯 안 상태다.
// r2: 시안 r3 +α(AI가 먼저 보라는 10건 · 유사도 분포 · 본 위치 · 빠른 비교 · 보기 거르기 · 촘촘 8열 · 카드 ★ · 상세조회 칸)를
// `showPlus` 하나로 감싸 얹는다(감싼 요소마다 `data-plus`). 확인대상(★)은 저장되는 값이라 targets + onToggleTarget(제어형).
// r3(편의 — +α 아님, showPlus 와 무관): 결과형태 1–6개씩 · 썸네일 크기 · 빠른 찾기 · 필터 칩 · 수동/자동(초점 카드가 주기마다
// 다음으로 → 스크롤 → 쪽 끝이면 다음 쪽 · 「어디까지 봤는지」 올림) · 전체 화면 · 단축키(← → Space Enter S ? Esc).
// 값은 모두 제어형 props, 위젯 안 상태는 마우스 올림 멈춤 · 안내 열림 · 전체 화면 여부뿐.

// SCAS 「결과형태」 글자 그대로(1–4열) + r3 확장 5 · 6열. 글자 → 열 수는 parseColumns
const COLUMN_OPTIONS = ["1열", "2열", "3열", "4열", "5열", "6열"] as const
type ColumnLabel = (typeof COLUMN_OPTIONS)[number]
const parseColumns = (label: ColumnLabel): ResultColumns => Number(label.replace("열", "")) as ResultColumns
const THUMB_OPTIONS: readonly ThumbSize[] = ["작게", "보통", "크게"]

// 열 수 → 정적 클래스(Tailwind 가 읽을 수 있게 전부 적는다). 8 = 시안 「촘촘 8열」(+α)
const GRID_COLS: Record<ResultColumns, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  8: "grid-cols-8",
}

// 시안 순서: 원본 · 이진화. 글자는 지금 앱 리터럴 그대로
const MODE_ITEMS: { value: ImageMode; label: ImageMode }[] = [
  { value: "원본보기", label: "원본보기" },
  { value: "이진화보기", label: "이진화보기" },
]

// 시안 r3 보기 거르기 칩(핀 15). 「이미 본 것 흐리게」만 지금 가짜 값으로 동작하고, 나머지는 눌림 모양 + 준비 중 알림
const FILTERS = ["이미 본 것 흐리게", "같은 그룹 묶기", "하 부위 다른 것 뒤로", "제조사별"] as const
type Filter = (typeof FILTERS)[number]

const NOT_READY = "준비 중"

const DEFAULT_INTERVAL_MS = 2000
const FULLSCREEN_UNAVAILABLE = "이 브라우저에서는 전체 화면을 쓸 수 없습니다 — 브라우저의 전체 화면(F11)을 써 주세요"

// 자동 넘김 시계: 공용 useAutoPlay 를 「주기마다 앞으로 한 걸음」 시계로만 쓴다. 초점(rank)은 화면이 제어형으로 들고
// 쪽을 넘나들므로 시계의 칸 번호는 쓰지 않는다. 칸 수를 아주 크게 + 돌아가기라 시계는 끝나지 않는다 —
// 「마지막에서 멈춤」은 advance 가 판단해 재생을 끈다. 손 걸음(← →)은 advance 를 바로 부르고 goTo(지금 칸)으로 주기만 다시 센다.
const CLOCK_COUNT = 1_000_000

type StepDir = 1 | -1

/** S05 검색 결과 — 사건 창 안(`inWindow`)이면 먹색 작업판 순위 목록(SearchWindow), 아니면 단독 진열(SCAS 배치 그대로) */
export function SearchResultScreen(props: SearchResultScreenProps) {
  return props.inWindow ? <SearchWindow {...props} /> : <SearchResultPage {...props} />
}

function SearchResultPage({
  status,
  errorAt,
  onRetry,
  isAdmin,
  features,
  imageNo,
  sceneImage,
  results,
  totalCount,
  page,
  pageSize,
  onPageChange,
  imageMode,
  onImageModeChange,
  onOpenResult,
  showPlus = true,
  insight,
  targets = [],
  onToggleTarget,
  onResume,
  onPlusAction,
  columns: columnsProp,
  onColumnsChange,
  thumbSize = "보통",
  onThumbSizeChange,
  query = "",
  onQueryChange,
  filters = {},
  onFiltersChange,
  onClearFilters,
  autoMode = "manual",
  onAutoModeChange,
  intervalMs = DEFAULT_INTERVAL_MS,
  onIntervalChange,
  playing = false,
  onPlayingChange,
  focusRank: focusProp,
  onFocusChange,
  onSeenUpToChange,
  onNotice,
}: SearchResultScreenProps) {
  const plus = showPlus && insight ? insight : null
  // 결과형태: 제어형(columns)이 없으면 위젯 안 기본값 — 시안 SCAS 기본 4열, +α 를 켜면 시안 r3 의 「촘촘 8열」
  const [ownColumns, setOwnColumns] = React.useState<ResultColumns>(plus ? 8 : 4)
  const rawColumns = columnsProp ?? ownColumns
  // 촘촘 8열은 +α — 끄면 SCAS 기본 4열로 보인다
  const columns: ResultColumns = rawColumns === 8 && !plus ? 4 : rawColumns
  const setColumns = (next: ResultColumns) => (onColumnsChange ? onColumnsChange(next) : setOwnColumns(next))
  const [chips, setChips] = React.useState<ReadonlySet<Filter>>(() => new Set<Filter>(["이미 본 것 흐리게"]))
  const [detailOpen, setDetailOpen] = React.useState(true)
  const [hold, setHold] = React.useState(false)
  const [helpOpen, setHelpOpen] = React.useState(false)
  const [full, setFull] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const gridRef = React.useRef<HTMLOListElement>(null)
  const pendingRef = React.useRef<"first" | "last" | null>(null)

  const roles = viewerRoles(isAdmin, features)
  const firstRank = (page - 1) * pageSize + 1
  const lastRank = firstRank + results.length - 1
  const hasNext = page * pageSize < totalCount
  const action = (label: string) => onPlusAction?.(label)
  // 확인대상은 신발 ID 로 가른다(순위로 가르면 다른 검색의 같은 순위 카드에 ★ — 2회차 검수)
  const isTarget = (ftwrId: string) => targets.some((t) => t.ftwrId === ftwrId)
  const colCount = columns
  const auto = autoMode === "auto" && status === "ready"
  const focus = focusProp !== undefined ? focusProp : (plus?.focusRank ?? null)

  // ── 빠른 찾기 · 필터(지금 쪽 안에서) ──
  const ranked: RankedResult[] = React.useMemo(
    () => results.map((item, i) => ({ item, rank: firstRank + i })),
    [results, firstRank],
  )
  const aiIds = React.useMemo(() => (plus ? new Set(plus.aiTop.map((t) => t.ftwrId)) : null), [plus])
  const ctx: FilterContext = { seenUpTo: plus?.seenUpTo ?? null, targets, aiIds }
  const visible = filterResults(ranked, query, filters, ctx)
  const filterActive = hasActiveFilter(query, filters)
  const visibleRanks = visible.map((v) => v.rank)
  const visibleKey = visibleRanks.join(",")
  const focusOnPage = focus !== null && focus >= firstRank && focus <= lastRank

  const toggleChip = (f: Filter) => {
    setChips((prev) => {
      const next = new Set(prev)
      if (next.has(f)) next.delete(f)
      else next.add(f)
      return next
    })
    if (f !== "이미 본 것 흐리게") action(f)
  }

  const toggleTarget = (target: SearchTarget) => {
    onToggleTarget?.(target)
    // ★ 를 누르면 자동 넘김은 잠시 멈춘다(다시 재생은 Space · 재생 버튼)
    if (auto && playing) onPlayingChange?.(false)
  }

  // ── 초점 이동(자동 주기 · ← →) ──
  const markSeen = (rank: number | null) => {
    if (!plus || rank === null || !focusOnPage) return
    if (rank > plus.seenUpTo) onSeenUpToChange?.(rank)
  }

  const advance = (dir: StepDir) => {
    if (status !== "ready") return
    let target: number | undefined
    if (dir === 1) target = focusOnPage ? visibleRanks.find((r) => focus !== null && r > focus) : visibleRanks[0]
    else target = focusOnPage ? [...visibleRanks].reverse().find((r) => focus !== null && r < focus) : visibleRanks.at(-1)
    if (target !== undefined) {
      if (dir === 1) markSeen(focus)
      onFocusChange?.(target)
      return
    }
    if (dir === 1 && hasNext) {
      markSeen(focus)
      pendingRef.current = "first"
      onPageChange(page + 1)
      return
    }
    if (dir === -1 && page > 1) {
      pendingRef.current = "last"
      onPageChange(page - 1)
      return
    }
    // 마지막 카드: 본 것으로 올리고 자동 넘김은 멈춘다
    if (dir === 1) {
      markSeen(focus)
      if (auto && playing) onPlayingChange?.(false)
    }
  }

  // 시계 칸 번호(onStep 이 곧바로 알려 준다 — 렌더를 기다리지 않아 손 걸음이 늦은 값으로 되감지 않는다)
  const clockAtRef = React.useRef(0)
  const clock = useAutoPlay({
    count: CLOCK_COUNT,
    loop: true,
    intervalMs,
    enabled: auto,
    onStep: (i) => {
      clockAtRef.current = i
      advance(1)
    },
  })
  const { play: clockPlay, pause: clockPause, goTo: clockGoTo } = clock
  const wantPlay = auto && playing && !hold
  React.useEffect(() => {
    if (wantPlay) clockPlay()
    else clockPause()
  }, [wantPlay, clockPlay, clockPause])
  /** 손으로 한 걸음(← → · 이전/다음). 자동 모드면 주기도 처음부터 다시 센다(같은 칸 goTo = 주기만 다시) */
  const step = (dir: StepDir) => {
    advance(dir)
    clockGoTo(clockAtRef.current)
  }
  const remainingRatio = auto && intervalMs > 0 ? clock.remainingMs / intervalMs : 0

  // 쪽을 넘긴 뒤(자동 · ← →) 그 쪽의 첫 · 끝 카드로 초점(걸러져 보이는 카드가 없으면 다음 걸음에 또 넘긴다)
  React.useEffect(() => {
    const pending = pendingRef.current
    if (!pending) return
    pendingRef.current = null
    const ranks = visibleKey ? visibleKey.split(",").map(Number) : []
    const to = pending === "first" ? ranks[0] : ranks.at(-1)
    if (to !== undefined) onFocusChange?.(to)
  }, [page, visibleKey, onFocusChange])

  // 쪽 · 보이는 카드가 바뀌면 마우스 올림 멈춤을 푼다(사라진 카드에서는 mouseleave 가 오지 않는다)
  React.useEffect(() => {
    setHold(false)
  }, [page, visibleKey])

  // 초점 카드가 화면 밖이면 보이게(가까운 쪽으로만 — 움직임 줄이기와 무관하게 즉시)
  React.useEffect(() => {
    if (focus === null) return
    const el = gridRef.current?.querySelector<HTMLElement>(`[data-result-card][data-rank="${focus}"]`)
    if (el && typeof el.scrollIntoView === "function") el.scrollIntoView({ block: "nearest" })
  }, [focus, page])

  // ── 전체 화면(Fullscreen API — 못 쓰면 안내) ──
  React.useEffect(() => {
    const onChange = () => setFull(rootRef.current !== null && document.fullscreenElement === rootRef.current)
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined)
      return
    }
    const el = rootRef.current
    if (!el || typeof el.requestFullscreen !== "function" || document.fullscreenEnabled === false) {
      onNotice?.(FULLSCREEN_UNAVAILABLE)
      return
    }
    el.requestFullscreen().catch(() => onNotice?.(FULLSCREEN_UNAVAILABLE))
  }

  // ── 단축키(← → Space Enter S PgDn PgUp ? Esc) — 공용 검사(shouldHandleShortcut): 글자 입력 중 · 보조키 ·
  // 이미 처리된 키는 듣지 않고, 버튼 · 체크박스 위 Space · Enter 와 라디오 · 탭 위 화살표는 그 컨트롤 몫 ──
  const focusedRow = focusOnPage ? visible.find((v) => v.rank === focus) : undefined
  const keyRef = React.useRef<(e: KeyboardEvent) => void>(() => undefined)
  React.useEffect(() => {
    keyRef.current = (e: KeyboardEvent) => {
      if (!shouldHandleShortcut(e)) return
      if (e.key === "?") {
        e.preventDefault()
        setHelpOpen((v) => !v)
        return
      }
      if (e.key === "Escape") {
        setHelpOpen(false)
        return
      }
      if (status !== "ready") return
      switch (e.key) {
        case "ArrowRight":
          e.preventDefault()
          step(1)
          return
        case "ArrowLeft":
          e.preventDefault()
          step(-1)
          return
        case "PageDown":
          if (hasNext) {
            e.preventDefault()
            // 새 쪽의 첫 카드로 초점
            pendingRef.current = "first"
            onPageChange(page + 1)
          }
          return
        case "PageUp":
          if (page > 1) {
            e.preventDefault()
            pendingRef.current = "first"
            onPageChange(page - 1)
          }
          return
        case " ":
          if (autoMode !== "auto") return
          e.preventDefault()
          onPlayingChange?.(!playing)
          return
        case "Enter":
          if (!focusedRow) return
          e.preventDefault()
          onOpenResult(focusedRow.item, focusedRow.rank)
          return
      }
      // S ★ — 한글 입력 상태(「ㄴ」)에서도 같은 자판 자리로 받는다
      if (e.key === "s" || e.key === "S" || e.code === "KeyS") {
        if (!plus || !roles.analyst || !focusedRow) return
        e.preventDefault()
        toggleTarget({ rank: focusedRow.rank, ftwrId: focusedRow.item.ftwrId })
      }
    }
  })
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => keyRef.current(e)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // ── 필터 칩 묶음(+α 값이 있어야 보이는 묶음은 plus 일 때만) ──
  const groupOf = (key: ResultFilterKey, label: string, options: { value: string; label: string }[]): FilterGroup => ({
    key,
    label,
    value: filters[key] ?? [],
    options: options.map((o) => ({ ...o, count: optionCount(ranked, key, o.value, ctx) })),
  })
  const filterGroups: FilterGroup[] = [
    groupOf("grade", "유사도", [
      { value: "ok", label: "80↑" },
      { value: "warn", label: "60↑" },
      { value: "danger", label: "60↓" },
    ]),
    ...(plus
      ? [
          groupOf("seen", "본 것", [
            { value: "seen", label: "본 것" },
            { value: "unseen", label: "안 본 것" },
          ]),
          groupOf("target", "확인대상", [{ value: "star", label: "확인대상 ★" }]),
          groupOf("ai", "AI", [{ value: "top10", label: "AI 10건만" }]),
        ]
      : []),
  ]

  let body: React.ReactNode
  if (status === "loading") {
    body = (
      <div aria-busy="true" className="grid min-h-[320px] place-content-center justify-items-center gap-[10px] text-[12px] text-muted-foreground">
        <AiProgress state="running" label="신발 검색 중" className="w-[220px]" />
        <span>신발 검색 중 — 신발 DB 와 비교하고 있습니다</span>
      </div>
    )
  } else if (status === "error") {
    body = (
      <div className="grid min-h-[320px] place-content-center">
        <InlineError message="검색 결과를 확인 못 함" at={errorAt} onRetry={onRetry} />
      </div>
    )
  } else if (status === "empty") {
    body = (
      <div className="grid min-h-[320px] place-content-center justify-items-center gap-[4px] text-[12.5px] text-muted-foreground">
        <span className="font-semibold text-fg-2">결과 없음</span>
        <span className="text-[11.5px] text-dim">필수 문양을 조정해 다시 검색해 보세요</span>
      </div>
    )
  } else {
    const cards: React.ReactNode[] = []
    visible.forEach(({ item, rank: ranking }, i) => {
      const value = parseSimilarity(item.similarity)
      const focused = focus === ranking
      const side = i % colCount < colCount / 2 ? "right" : "left"
      cards.push(
        <ResultCard
          key={`${item.ftwrId}-${ranking}`}
          item={item}
          ranking={ranking}
          compact={columns === 8}
          focused={focused}
          thumbSize={thumbSize}
          onOpen={() => onOpenResult(item, ranking)}
          onHover={setHold}
          plus={
            plus
              ? {
                  dim: chips.has("이미 본 것 흐리게") && ranking <= plus.seenUpTo,
                  starred: isTarget(item.ftwrId),
                  rerankUp: plus.rerankUp[ranking] ?? 0,
                  canStar: roles.analyst,
                  onStar: () => toggleTarget({ rank: ranking, ftwrId: item.ftwrId }),
                  peek:
                    focused && plus.peek ? (
                      <QuickPeekWindow
                        peek={plus.peek}
                        rank={ranking}
                        ftwrId={item.ftwrId}
                        similarity={value === null ? "—" : `${value.toFixed(1)}%`}
                        shoeImage={item.image}
                        side={side}
                      />
                    ) : undefined,
                }
              : undefined
          }
        />,
      )
      // 시안 「여기까지 봤음」 선: 본 위치 카드 바로 뒤에 한 줄 전체(걸러져 안 보이면 그 다음 보이는 카드 앞)
      const nextRow = visible[i + 1]
      if (plus && ranking <= plus.seenUpTo && nextRow && nextRow.rank > plus.seenUpTo) {
        cards.push(
          <li
            key="seen-line"
            data-plus
            data-seen-line
            className="col-span-full flex items-center gap-[8px] text-[11px] text-brand"
          >
            <span aria-hidden="true" className="h-px flex-1 bg-brand-2" />
            {`여기까지 봤음 · ${plus.seenUpTo}위 · ${plus.seenAt}`}
            <span aria-hidden="true" className="h-px flex-1 bg-brand-2" />
          </li>,
        )
      }
    })

    body = (
      <div className="grid min-w-0 gap-[8px]">
        {plus ? (
          <>
            <AiTopRail items={plus.aiTop} targets={targets} />
            <div data-plus data-filters className="flex flex-wrap items-center gap-[6px] text-[11px]">
              <span className="text-dim">보기</span>
              {FILTERS.map((f) => {
                const on = chips.has(f)
                return (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleChip(f)}
                    className="cursor-pointer border-none bg-transparent p-0"
                  >
                    <Chip variant={on ? "blue" : "default"} on={on} className="h-[21px]">
                      {f}
                    </Chip>
                  </button>
                )
              })}
              <span className="ml-auto text-dim">{FILTER_NOTE}</span>
            </div>
          </>
        ) : null}
        {onFiltersChange ? (
          <FilterBar
            query={query}
            onQueryChange={(q) => onQueryChange?.(q)}
            filters={filterGroups}
            onFilterChange={(key, values) => onFiltersChange(key as ResultFilterKey, values)}
            onClear={() => onClearFilters?.()}
            resultCount={visible.length}
            total={results.length}
            searchPlaceholder="화류번호 · 상표(이 쪽 안에서)"
          />
        ) : null}
        {filterActive && visible.length === 0 ? (
          <div
            data-filter-empty
            className="grid min-h-[200px] place-content-center justify-items-center gap-[8px] rounded-[10px] border border-dashed border-line-3 text-[12.5px] text-muted-foreground"
          >
            <span className="font-semibold text-fg-2">조건에 맞는 항목 없음</span>
            <span className="text-[11.5px] text-dim">이 쪽의 결과는 그대로 있습니다 — 조건을 지우거나 다른 쪽을 보세요</span>
            <Button size="sm" onClick={() => onClearFilters?.()}>
              조건 지우기
            </Button>
          </div>
        ) : (
          <ol
            ref={gridRef}
            data-result-grid
            data-columns={columns}
            data-thumb={thumbSize}
            className={cn("grid min-w-0 gap-[6px]", GRID_COLS[columns])}
          >
            {cards}
          </ol>
        )}
        <div className="flex flex-wrap items-center gap-[10px]">
          <Pagination
            total={totalCount}
            page={page}
            pageSize={pageSize}
            hasNext={hasNext}
            onPageChange={onPageChange}
            className="px-0"
          />
          {plus ? (
            <span data-plus className="ml-auto text-[11px] text-dim">
              {STAR_NOTE}
            </span>
          ) : null}
        </div>
      </div>
    )
  }

  const detail = plus?.detail ?? null
  const position = Math.min(Math.max(0, (focusOnPage && focus !== null ? focus : firstRank) - 1), Math.max(0, totalCount - 1))

  // ── 두 배치(단독 진열 · 사건 창)가 같이 쓰는 조각 — 상태 · 핸들러는 하나 ──
  const roleChips = showPlus ? (
    <span data-plus className="inline-flex gap-[6px]">
      {roles.verifier ? <Chip>기술책임자 · 보기만</Chip> : null}
      {roles.investigator ? <Chip>수사관 · 볼 수 없음</Chip> : null}
    </span>
  ) : undefined
  const countText =
    status === "ready" ? (
      plus ? (
        <span data-plus className="font-code text-[12px] tabular-nums text-fg-2">{`${firstRank}위 / ${totalCount}건`}</span>
      ) : (
        <span className="font-code text-[12px] tabular-nums text-fg-2">{`전체 ${totalCount}건`}</span>
      )
    ) : null
  const columnSwitch = (
    // r3: 1–4열 그대로 + 5 · 6개씩 확장(SCAS 「결과형태」 자리)
    <ViewCountSwitch<string>
      label="결과형태"
      options={COLUMN_OPTIONS}
      // 촘촘 8열(+α)이면 어느 칸도 눌리지 않는다
      value={`${columns}열`}
      onChange={(label) => setColumns(parseColumns(label as ColumnLabel))}
    />
  )
  const confirmViewButton = (
    // SCAS 버튼 — 확인대상 보기 기능이 지금 앱에 없어 비활성(준비 중)
    <span title={NOT_READY} className="inline-flex">
      <Button size="sm" disabled>
        확인대상보기
      </Button>
    </span>
  )
  const denseButton = (
    <Button
      data-plus
      size="sm"
      aria-pressed={columns === 8}
      onClick={() => setColumns(8)}
      className={cn(columns === 8 && "text-foreground [box-shadow:inset_0_0_0_1px_var(--t-brand)]")}
    >
      촘촘 8열
    </Button>
  )
  const rerankChip = (className?: string) => (
    <Chip data-plus className={cn(CHIP_TEAL, className)}>
      <span className={AI_MARK}>AI</span> 순위 다시 매김
    </Chip>
  )
  const autoPlay =
    onAutoModeChange && status === "ready" ? (
      <AutoPlayControl
        mode={autoMode}
        onModeChange={onAutoModeChange}
        intervalMs={intervalMs}
        onIntervalChange={(ms) => onIntervalChange?.(ms)}
        playing={playing}
        onPlayPause={() => onPlayingChange?.(!playing)}
        position={{ index: position, total: totalCount }}
        remainingRatio={remainingRatio}
      />
    ) : null
  const thumbSwitch = onThumbSizeChange ? (
    <ViewCountSwitch label="썸네일" options={THUMB_OPTIONS} value={thumbSize} onChange={onThumbSizeChange} />
  ) : null
  const fullButton = (
    <Button size="sm" aria-pressed={full} onClick={toggleFullscreen}>
      {full ? "전체 화면 끝내기" : "전체 화면"}
    </Button>
  )
  const helpButton = (
    <Button
      size="sm"
      aria-expanded={helpOpen}
      aria-controls="s05-shortcut-help"
      aria-keyshortcuts="?"
      onClick={() => setHelpOpen((v) => !v)}
    >
      단축키 ?
    </Button>
  )
  const modeSegmented = (className: string) => (
    <Segmented
      items={MODE_ITEMS}
      value={imageMode}
      onValueChange={(v) => onImageModeChange(v as ImageMode)}
      aria-label="결과 이미지 보기"
      className={className}
    />
  )
  const leftPlus = (bare: boolean) =>
    plus && status === "ready" ? (
      <LeftPlus
        insight={plus}
        total={totalCount}
        targets={targets}
        canEditTargets={roles.analyst}
        onResume={() => onResume?.(plus.seenUpTo + 1)}
        onRemoveTarget={toggleTarget}
        bare={bare}
      />
    ) : (
      <span className="text-[11px] leading-[1.5] text-dim">결과 신발 이미지를 이진화 / 원본으로 바꿔 봅니다</span>
    )
  const resultDetail = (compact: boolean) =>
    detail && detailOpen && status === "ready" ? (
      <ResultDetail
        detail={detail}
        canWrite={roles.analyst}
        onRegister={() => {
          if (!isTarget(detail.ftwrId)) toggleTarget({ rank: detail.rank, ftwrId: detail.ftwrId })
        }}
        onAction={action}
        onClose={() => setDetailOpen(false)}
        compact={compact}
      />
    ) : null

  return (
    <div ref={rootRef} data-fullscreen-root className={cn("min-w-0", full && "overflow-auto bg-background p-[12px]")}>
      <Panel title="문양검색결과" className="min-w-0" actions={roleChips}>
        <div className="flex flex-wrap items-center gap-[10px] border-b border-solid border-line-2 px-[14px] py-[8px]">
          <span className="text-[12px] text-muted-foreground">
            이미지번호 <b className="font-code text-foreground">{imageNo}</b>
          </span>
          {countText}
          <span className="ml-auto inline-flex items-center gap-[6px]">
            {columnSwitch}
            {confirmViewButton}
          </span>
          {plus ? (
            <>
              <span data-plus aria-hidden="true" className="h-[20px] w-px bg-line-3" />
              {denseButton}
              {rerankChip("mr-[6px]")}
            </>
          ) : null}
        </div>

        {/* r3 편의 줄: 수동 · 자동 · 썸네일 크기 · 전체 화면 · 단축키 */}
        <div
          data-r3-toolbar
          className="relative flex flex-wrap items-center gap-x-[14px] gap-y-[6px] border-b border-solid border-line-2 px-[14px] py-[6px]"
        >
          {autoPlay}
          <span className="ml-auto inline-flex flex-wrap items-center gap-[8px]">
            {thumbSwitch}
            {fullButton}
            {helpButton}
          </span>
          {helpOpen ? <ShortcutHelp className="right-[14px]" /> : null}
        </div>

        <div className="p-[12px_14px_14px]">
          <div className="grid min-w-0 grid-cols-[240px_minmax(0,1fr)] gap-[12px]">
            <div className="grid content-start gap-[8px]">
              <div className="flex min-h-[30px] items-center gap-[8px] border-l-[3px] border-solid border-brand-2 bg-panel-3 px-[10px] text-[12.5px] font-semibold">
                현장 족적
                {modeSegmented("ml-auto p-[2px] font-normal [&_button]:px-[8px] [&_button]:py-[2px] [&_button]:text-[11.5px]")}
              </div>
              <EvidenceImage
                src={sceneImage}
                alt="현장 족적"
                caption={plus ? "고정 · 두 번 누르면 뷰어" : undefined}
                className={cn(plus && "aspect-auto h-[330px]")}
              />
              {leftPlus(false)}
            </div>
            <div className="min-w-0">{body}</div>
          </div>
          {resultDetail(false)}
        </div>
      </Panel>
    </div>
  )
}
