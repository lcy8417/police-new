import * as React from "react"
import { ArrowRight, Settings2, Star, X } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { AiProgress } from "@/shared/ui/ai"
import { Chip, InlineError, Segmented, WorkbenchButton } from "@/shared/ui/kit"
import { PaneHead } from "@/shared/ui/panel"
import {
  DEFAULT_LENS,
  DEFAULT_VIEW_TUNE,
  LensBox,
  ViewControls,
  stepLens,
  viewTuneClass,
  type LensSettings,
  type ViewTune,
} from "@/shared/ui/viewer"

import {
  LOAD_MORE_GAP,
  PAGE_SEC_DEFAULT,
  PAGE_SEC_MAX,
  PAGE_SEC_MIN,
  SCROLL_SPEED_DEFAULT,
  SCROLL_SPEED_MAX,
  SCROLL_SPEED_MIN,
  SCROLL_SPEED_STEP,
  nextPageTop,
  nextScrollTop,
  passedRank,
} from "../model/auto-scroll"
import { viewerRoles } from "../model/roles"
import { parseSimilarity } from "../model/similarity"
import type { AutoMode, AutoScrollMode, ImageMode, SearchResultScreenProps, SearchTarget } from "../model/types"
import { PEEK_H, PEEK_W, PeekPop } from "./PeekPop"
import { WindowCard } from "./WindowCard"

/** 작업판 막대(문양 코드 · 이미지 편집 탭과 같은 결) */
const BAR = "flex shrink-0 flex-wrap items-center gap-x-[8px] gap-y-[4px] bg-panel px-[10px] py-[5px]"
/** 작업판 막대 안 분할 단추를 단추 sm 높이로 */
const SEG = "p-[2px] [&_button]:px-[8px] [&_button]:py-[1px] [&_button]:text-[11px]"
const LABEL = "shrink-0 text-[10.5px] font-semibold text-muted-foreground"

type Per = 1 | 3 | 5
type SeenFilter = "all" | "unseen" | "seen"

const PER_ITEMS = [
  { value: "1", label: "1개" },
  { value: "3", label: "3개" },
  { value: "5", label: "5개" },
]
const GRID: Record<Per, string> = { 1: "grid-cols-1", 3: "grid-cols-3", 5: "grid-cols-5" }
const SEEN_ITEMS = [
  { value: "all", label: "전체" },
  { value: "unseen", label: "안 본 것" },
  { value: "seen", label: "본 것" },
]
const MODE_ITEMS = [
  { value: "원본보기", label: "원본" },
  { value: "이진화보기", label: "이진화" },
]
const AUTO_ITEMS = [
  { value: "manual", label: "수동" },
  { value: "auto", label: "자동" },
]
const SCROLL_ITEMS = [
  { value: "speed", label: "속도" },
  { value: "page", label: "쪽 넘김" },
]

/** 마우스를 이만큼 올려 두면 빠른 비교 */
const PEEK_DELAY_MS = 400
const TIP =
  "순위 내림차순 한 목록. 자동 = 목록이 저절로 내려가고, 카드를 누르면 멈춥니다(⚙ 속도 · 쪽 넘김). 마우스를 올리면 빠른 비교 · Enter 정밀 대조 · S 확인대상."

const perOf = (c: number | undefined): Per => (c === 1 || c === 3 ? c : 5)

/** 움직임 줄이기 설정 */
function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(mq.matches)
    const on = () => setReduced(mq.matches)
    mq.addEventListener?.("change", on)
    return () => mq.removeEventListener?.("change", on)
  }, [])
  return reduced
}

/**
 * 사건 창 「검색 결과」 탭(11/17 사용자 「검색 결과도 전문적이게 … 순위가 쭉 나와야해. 1개 3개 5개 보기 … 점수가 잘 나오고, 어느 문양 일치하는지 살짝 상단 …
 * 화류번호 검색 · 유사도 필터 빼 … 본 것 안 본 것은 좋네 … 자동 누르면 … 스크롤 자체가 내려가는거야 … 클릭해서 멈추는 거고 · 속도 · 페이지 넘김」).
 *   머리(밝은 바탕) — 칸 이름 · 건수 · 검색 번호
 *   어두운 작업판(`data-theme="dark"`): 왼쪽 현장 족적(보기 조정 · 확대경, 높이 꽉 · 본 위치 · 확인대상) | 가운데 순위 목록(도구 막대 + 스크롤)
 *   바닥 단추 줄: 고른 카드 · 확인대상 · 정밀 대조
 * 결과는 1위부터 이어진 한 목록(`results`, page 1) — 끝에 닿으면 `onLoadMore`. 자동 스크롤은 rAF 로 scrollTop 을 올린다(움직임 줄이기면 쪽 넘김만).
 */
export function SearchWindow(props: SearchResultScreenProps) {
  const {
    status,
    results,
    totalCount,
    insight,
    targets = [],
    focusRank: focusProp,
    autoMode = "manual",
    showPlus = true,
  } = props
  const plus = showPlus && insight ? insight : null
  const roles = viewerRoles(props.isAdmin, props.features)
  const per = perOf(props.columns)
  const reduced = useReducedMotion()

  const [seenFilter, setSeenFilter] = React.useState<SeenFilter>("all")
  const [scrollMode, setScrollMode] = React.useState<AutoScrollMode>("speed")
  const [speed, setSpeed] = React.useState(SCROLL_SPEED_DEFAULT)
  const [pageSec, setPageSec] = React.useState(PAGE_SEC_DEFAULT)
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [tune, setTune] = React.useState<ViewTune>(DEFAULT_VIEW_TUNE)
  const [lens, setLens] = React.useState<LensSettings>(DEFAULT_LENS)
  const [peek, setPeek] = React.useState<{ rank: number; left: number; top: number; hover: boolean } | null>(null)

  const listRef = React.useRef<HTMLDivElement>(null)
  const stageRef = React.useRef<HTMLElement>(null)
  const peekTimer = React.useRef<number | undefined>(undefined)
  const pendingScroll = React.useRef<number | null>(null)
  const loadAskedAt = React.useRef(-1)

  const seenUpTo = plus?.seenUpTo ?? 0
  const focus = focusProp !== undefined ? focusProp : null
  const effectiveMode: AutoScrollMode = reduced ? "page" : scrollMode
  const auto = autoMode === "auto" && status === "ready"
  // 마우스 올림 빠른 비교가 떠 있는 동안은 잠시 멈춘다(카드가 손 밑에서 빠져나가지 않게)
  const running = auto && !(peek?.hover ?? false)
  const hasMore = results.length < totalCount && Boolean(props.onLoadMore)
  const isTarget = (rank: number) => targets.some((t) => t.rank === rank)

  const setAuto = (mode: AutoMode) => {
    props.onAutoModeChange?.(mode)
    props.onPlayingChange?.(mode === "auto")
  }
  const toggleTarget = (t: SearchTarget) => props.onToggleTarget?.(t)

  // ── 이어 붙이기 · 지나간 카드 「본 것」 ──
  const askMore = React.useCallback(() => {
    if (!hasMore || loadAskedAt.current === results.length) return false
    loadAskedAt.current = results.length
    props.onLoadMore?.()
    return true
  }, [hasMore, results.length, props])

  const atEndRef = React.useRef<() => void>(() => undefined)
  React.useEffect(() => {
    atEndRef.current = () => {
      if (askMore() || hasMore) return
      setAuto("manual")
      props.onNotice?.("목록 끝 — 자동을 멈췄습니다")
    }
  })

  const onListScroll = () => {
    const el = listRef.current
    if (!el) return
    if (el.scrollHeight - el.scrollTop - el.clientHeight < LOAD_MORE_GAP) askMore()
  }

  // ── 자동 스크롤: 속도(rAF) · 쪽 넘김(n초) ──
  React.useEffect(() => {
    const el = listRef.current
    if (!running || !el) return
    const maxTop = () => Math.max(0, el.scrollHeight - el.clientHeight)
    if (effectiveMode === "page") {
      const id = window.setInterval(() => {
        if (el.scrollTop >= maxTop() - 1) {
          atEndRef.current()
          return
        }
        el.scrollTop = nextPageTop(el.scrollTop, el.clientHeight, maxTop())
      }, pageSec * 1000)
      return () => window.clearInterval(id)
    }
    let raf = 0
    let last = performance.now()
    let pos = el.scrollTop
    const tick = (now: number) => {
      if (Math.abs(el.scrollTop - pos) > 2) pos = el.scrollTop // 손으로 굴렸으면 그 자리부터
      const max = maxTop()
      pos = nextScrollTop(pos, now - last, speed, max)
      last = now
      el.scrollTop = pos
      if (pos >= max - 0.5) atEndRef.current()
      raf = window.requestAnimationFrame(tick)
    }
    raf = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(raf)
  }, [running, effectiveMode, speed, pageSec])

  // 자동 중에는 위로 지나간 카드까지 「본 것」으로 올린다
  const seenRef = React.useRef({ upTo: seenUpTo, set: props.onSeenUpToChange })
  React.useEffect(() => {
    seenRef.current = { upTo: seenUpTo, set: props.onSeenUpToChange }
  })
  const hasPlus = plus !== null
  React.useEffect(() => {
    if (!running || !hasPlus) return
    const id = window.setInterval(() => {
      const el = listRef.current
      if (!el) return
      const top = el.getBoundingClientRect().top
      const cards = Array.from(el.querySelectorAll<HTMLElement>("[data-result-card]")).map((c) => ({
        rank: Number(c.dataset.rank),
        bottom: c.getBoundingClientRect().bottom,
      }))
      const r = passedRank(cards, top)
      if (r !== null && r > seenRef.current.upTo) seenRef.current.set?.(r)
    }, 300)
    return () => window.clearInterval(id)
  }, [running, hasPlus])

  // 이어 보기 · 확인대상 누름 → 그 카드를 목록 맨 위로(붙인 뒤에)
  React.useEffect(() => {
    const rank = pendingScroll.current
    const el = listRef.current
    if (rank === null || !el) return
    const card = el.querySelector<HTMLElement>(`[data-result-card][data-rank="${rank}"]`)
    if (!card) return
    pendingScroll.current = null
    el.scrollTop += card.getBoundingClientRect().top - el.getBoundingClientRect().top - 8
  }, [results.length, focus])

  const goTo = (rank: number) => {
    pendingScroll.current = rank
    props.onResume?.(rank)
    props.onFocusChange?.(rank)
  }

  // ── 빠른 비교 자리 ──
  const placePeek = (el: HTMLElement, rank: number, hover: boolean) => {
    const stage = stageRef.current
    if (!stage) return
    const s = stage.getBoundingClientRect()
    const c = el.getBoundingClientRect()
    // 카드 오른쪽 → 왼쪽 → (둘 다 모자라면) 카드 가운데에서 먼 쪽 가장자리
    const right = c.right - s.left + 8
    const leftSide = c.left - s.left - PEEK_W - 8
    let left = right + PEEK_W <= s.width ? right : leftSide >= 0 ? leftSide : (c.left + c.right) / 2 - s.left < s.width / 2 ? s.width - PEEK_W - 4 : 4
    left = Math.max(4, Math.min(left, s.width - PEEK_W - 4))
    const top = Math.max(4, Math.min(c.top - s.top, s.height - PEEK_H - 4))
    setPeek({ rank, left, top, hover })
  }
  const startPeek = (el: HTMLElement, rank: number, now: boolean) => {
    window.clearTimeout(peekTimer.current)
    if (now) placePeek(el, rank, false)
    else peekTimer.current = window.setTimeout(() => placePeek(el, rank, true), PEEK_DELAY_MS)
  }
  const endPeek = () => {
    window.clearTimeout(peekTimer.current)
    setPeek(null)
  }
  React.useEffect(() => () => window.clearTimeout(peekTimer.current), [])

  // ⚙ 설정 팝: Esc 로 닫기
  React.useEffect(() => {
    if (!settingsOpen) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSettingsOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [settingsOpen])

  // ── 목록 ──
  const ranked = results.map((item, i) => ({ item, rank: i + 1 }))
  const visible = ranked.filter(({ rank }) =>
    seenFilter === "all" ? true : seenFilter === "seen" ? rank <= seenUpTo : rank > seenUpTo,
  )
  const selected = focus !== null ? ranked.find((r) => r.rank === focus) : undefined
  const peekRow = peek ? ranked.find((r) => r.rank === peek.rank) : undefined

  let body: React.ReactNode
  if (status === "loading") {
    body = (
      <div aria-busy="true" className="grid h-full place-content-center justify-items-center gap-[10px] text-[12px] text-muted-foreground">
        <AiProgress state="running" label="신발 검색 중" className="w-[220px]" />
        신발 검색 중
      </div>
    )
  } else if (status === "error") {
    body = (
      <div className="grid h-full place-content-center">
        <InlineError message="검색 결과를 확인 못 함" at={props.errorAt} onRetry={props.onRetry} />
      </div>
    )
  } else if (status === "empty") {
    body = (
      <div className="grid h-full place-content-center justify-items-center gap-[4px] text-[12.5px] text-muted-foreground">
        <span className="font-semibold text-fg-2">결과 없음</span>
        <span className="text-[11.5px]">필수 문양을 조정해 다시 검색해 보세요</span>
      </div>
    )
  } else {
    const items: React.ReactNode[] = []
    visible.forEach(({ item, rank }, i) => {
      items.push(
        <WindowCard
          key={`${item.ftwrId}-${rank}`}
          item={item}
          rank={rank}
          per={per}
          selected={focus === rank}
          seen={plus !== null && rank <= seenUpTo}
          starred={isTarget(rank)}
          canStar={roles.analyst}
          onSelect={() => {
            props.onFocusChange?.(rank)
            if (auto) setAuto("manual")
          }}
          onOpen={() => props.onOpenResult(item, rank)}
          onStar={() => toggleTarget({ rank, ftwrId: item.ftwrId })}
          onPeekStart={(el, now) => startPeek(el, rank, now)}
          onPeekEnd={endPeek}
        />,
      )
      const next = visible[i + 1]
      if (plus && seenFilter === "all" && rank === seenUpTo && next) {
        items.push(
          <li key="seen-line" data-seen-line className="col-span-full flex items-center gap-[8px] font-code text-[10.5px] text-brand">
            <span aria-hidden="true" className="h-px flex-1 bg-brand-line" />
            {`여기까지 봤음 · ${seenUpTo}위 · ${plus.seenAt}`}
            <span aria-hidden="true" className="h-px flex-1 bg-brand-line" />
          </li>,
        )
      }
    })
    body = (
      <ol data-result-grid data-per={per} className={cn("m-0 grid min-w-0 list-none gap-[8px] p-0", GRID[per])}>
        {items}
        {hasMore ? (
          <li className="col-span-full flex justify-center py-[6px]">
            <WorkbenchButton size="sm" variant="ghost" onClick={() => askMore()}>
              {`더 보기 · ${results.length} / ${totalCount}`}
            </WorkbenchButton>
          </li>
        ) : null}
      </ol>
    )
  }

  const roleChips = showPlus ? (
    <span className="inline-flex gap-[6px]">
      {roles.verifier ? <Chip>기술책임자 · 보기만</Chip> : null}
      {roles.investigator ? <Chip>수사관 · 볼 수 없음</Chip> : null}
    </span>
  ) : null

  const sceneImg = (
    <img src={props.sceneImage} alt="현장 족적" draggable={false} className="block size-full object-contain" />
  )
  const cls = viewTuneClass(tune)

  return (
    <section
      aria-label="검색 결과"
      data-screen="S05"
      data-slot="search-result-window"
      className="@container relative flex h-full min-h-0 min-w-0 flex-col gap-[8px] p-[12px]"
    >
      <PaneHead
        title="검색 결과"
        sub={
          status === "ready" ? (
            <span className="font-code tabular-nums">
              {`${totalCount}건`}
              {plus ? ` · 검색 ${plus.searchNo} · ${plus.searchedAt}` : null}
            </span>
          ) : undefined
        }
        tip={TIP}
        end={roleChips}
      />
      <div
        data-theme="dark"
        data-slot="search-workbench"
        className="grid min-h-0 flex-1 grid-cols-[260px_minmax(0,1fr)] overflow-hidden rounded-[12px] border border-solid border-border bg-panel text-foreground [box-shadow:0_6px_18px_var(--t-panel-drop)] @max-[900px]:grid-cols-[210px_minmax(0,1fr)]"
      >
        {/* 왼쪽: 현장 족적 — 보기 조정 · 확대경, 아래 본 위치 · 확인대상 */}
        <section aria-label="현장 족적" className="flex min-h-0 min-w-0 flex-col border-0 border-r border-solid border-border">
          <div className={cn(BAR, "border-0 border-b border-solid border-border")}>
            <h3 className="m-0 text-[12px] font-bold whitespace-nowrap text-foreground">현장 족적</h3>
          </div>
          <div className={cn(BAR, "border-0 border-b border-solid border-border py-[4px]")}>
            <ViewControls tune={tune} onTuneChange={setTune} lens={lens} onLensChange={setLens} noBrightness />
          </div>
          <div className="relative min-h-0 flex-1 bg-canvas p-[8px]">
            <LensBox
              enabled={lens.on}
              size={lens.size}
              zoom={lens.zoom}
              source={sceneImg}
              tune={cls}
              onSizeStep={(by) => setLens((l) => ({ ...l, size: stepLens(l.size, by) }))}
              className="size-full"
            >
              <div className="relative size-full overflow-hidden rounded-[8px] border border-solid border-line-3 bg-canvas">
                <div className={cn("absolute inset-0", cls.outer)}>
                  <div className={cn("absolute inset-0", cls.inner)}>{sceneImg}</div>
                </div>
              </div>
            </LensBox>
          </div>
          {plus && status === "ready" ? (
            <div className="grid shrink-0 gap-[8px] border-0 border-t border-solid border-border bg-panel px-[10px] py-[8px]">
              <div data-seen-box className="grid gap-[5px]">
                <span className="flex items-baseline justify-between text-[11.5px]">
                  <b>본 위치</b>
                  <span className="font-code tabular-nums text-fg-2">{`${seenUpTo} / ${totalCount}`}</span>
                </span>
                <span className="flex items-center gap-[6px] text-[10.5px] text-muted-foreground">
                  {plus.seenAt}
                  <WorkbenchButton size="sm" variant="soft" icon={ArrowRight} className="ml-auto" onClick={() => goTo(seenUpTo + 1)}>
                    {`${seenUpTo + 1}위부터 이어 보기`}
                  </WorkbenchButton>
                </span>
              </div>
              <div data-target-box className="grid gap-[3px]">
                <span className="flex items-baseline justify-between text-[11.5px]">
                  <b>확인대상</b>
                  <span className="font-code tabular-nums text-fg-2">{targets.length}</span>
                </span>
                {targets.map((t) => (
                  <span key={t.rank} className="flex items-center gap-[4px] text-[11px] text-fg-2">
                    <Star aria-hidden="true" className="size-[11px] fill-current text-warn" strokeWidth={2} />
                    <button
                      type="button"
                      onClick={() => goTo(t.rank)}
                      className="cursor-pointer border-none bg-transparent p-0 text-left font-code text-[11px] text-fg-2 hover:text-foreground"
                    >
                      {`${t.rank}위 · ${t.ftwrId}`}
                    </button>
                    <WorkbenchButton
                      size="sm"
                      variant="ghost"
                      icon={X}
                      iconOnly
                      aria-label={`${t.rank}위 ${t.ftwrId} 확인대상 제외`}
                      disabled={!roles.analyst}
                      onClick={() => toggleTarget(t)}
                      className="ml-auto h-[20px] w-[20px]"
                    />
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        {/* 가운데: 순위 목록 */}
        <section ref={stageRef} aria-label="순위 목록" className="relative flex min-h-0 min-w-0 flex-col bg-canvas">
          <div className={cn(BAR, "relative border-0 border-b border-solid border-border")}>
            <h3 className="m-0 text-[12px] font-bold whitespace-nowrap text-foreground">순위</h3>
            {plus ? (
              <Segmented
                aria-label="본 것 거르기"
                items={SEEN_ITEMS}
                value={seenFilter}
                onValueChange={(v) => setSeenFilter(v as SeenFilter)}
                className={SEG}
              />
            ) : null}
            <span className="ml-auto inline-flex flex-wrap items-center gap-[8px]">
              <span className={LABEL}>보기</span>
              <Segmented
                aria-label="한 줄 개수"
                items={PER_ITEMS}
                value={String(per)}
                onValueChange={(v) => props.onColumnsChange?.(Number(v) as Per)}
                className={SEG}
              />
              <Segmented
                aria-label="결과 이미지 보기"
                items={MODE_ITEMS}
                value={props.imageMode}
                onValueChange={(v) => props.onImageModeChange(v as ImageMode)}
                className={SEG}
              />
              <span aria-hidden="true" className="h-[16px] w-px bg-line-3" />
              <Segmented
                aria-label="넘김"
                items={AUTO_ITEMS}
                value={autoMode}
                onValueChange={(v) => setAuto(v as AutoMode)}
                className={SEG}
              />
              <WorkbenchButton
                size="sm"
                variant="ghost"
                icon={Settings2}
                iconOnly
                aria-label="자동 설정"
                aria-expanded={settingsOpen}
                aria-pressed={settingsOpen}
                onClick={() => setSettingsOpen((v) => !v)}
              />
            </span>
            {settingsOpen ? (
              <div
                role="dialog"
                aria-label="자동 설정"
                className="absolute top-[calc(100%+4px)] right-[8px] z-[25] grid w-[240px] gap-[8px] rounded-[10px] border border-solid border-line-3 bg-panel p-[10px] [box-shadow:0_12px_32px_var(--t-panel-drop)]"
              >
                <span className="flex items-center gap-[8px]">
                  <span className={LABEL}>방식</span>
                  <Segmented
                    aria-label="자동 방식"
                    items={SCROLL_ITEMS}
                    value={effectiveMode}
                    onValueChange={(v) => setScrollMode(v as AutoScrollMode)}
                    className={cn(SEG, "ml-auto")}
                  />
                </span>
                {effectiveMode === "speed" ? (
                  <label className="grid grid-cols-[auto_minmax(0,1fr)_52px] items-center gap-[8px]">
                    <span className={LABEL}>속도</span>
                    <input
                      type="range"
                      aria-label="자동 속도"
                      min={SCROLL_SPEED_MIN}
                      max={SCROLL_SPEED_MAX}
                      step={SCROLL_SPEED_STEP}
                      value={speed}
                      onChange={(e) => setSpeed(Number(e.target.value))}
                      className="h-[16px] cursor-pointer accent-brand"
                    />
                    <span className="text-right font-code text-[11px] tabular-nums text-fg-2">{`${speed}px/초`}</span>
                  </label>
                ) : (
                  <label className="grid grid-cols-[auto_minmax(0,1fr)_52px] items-center gap-[8px]">
                    <span className={LABEL}>간격</span>
                    <input
                      type="range"
                      aria-label="쪽 넘김 간격"
                      min={PAGE_SEC_MIN}
                      max={PAGE_SEC_MAX}
                      step={1}
                      value={pageSec}
                      onChange={(e) => setPageSec(Number(e.target.value))}
                      className="h-[16px] cursor-pointer accent-brand"
                    />
                    <span className="text-right font-code text-[11px] tabular-nums text-fg-2">{`${pageSec}초`}</span>
                  </label>
                )}
                {reduced ? <span className="text-[10.5px] text-muted-foreground">움직임 줄이기 — 쪽 넘김만</span> : null}
              </div>
            ) : null}
          </div>
          <div
            ref={listRef}
            data-result-list
            data-auto={running ? "running" : auto ? "paused" : undefined}
            onScroll={onListScroll}
            className="min-h-0 flex-1 overflow-y-auto p-[10px]"
          >
            {body}
          </div>
          {peek && peekRow ? (
            <PeekPop
              item={peekRow.item}
              rank={peekRow.rank}
              sceneImage={props.sceneImage}
              queryPatterns={plus?.queryPatterns}
              left={peek.left}
              top={peek.top}
            />
          ) : null}
        </section>
      </div>

      {/* 바닥 단추 줄: 고른 카드 · 확인대상 · 정밀 대조 */}
      <div className="flex shrink-0 flex-wrap items-center gap-[8px] border-0 border-t border-solid border-border pt-[8px]">
        {selected ? (
          <span data-selected-summary className="inline-flex items-baseline gap-[8px] text-[12px]">
            <b className="font-code tabular-nums">{`${selected.rank}위`}</b>
            <span className="font-code text-fg-2">{selected.item.ftwrId}</span>
            <b className="font-code tabular-nums">{`${parseSimilarity(selected.item.similarity)?.toFixed(1) ?? "—"}%`}</b>
          </span>
        ) : (
          <span className="text-[11.5px] text-muted-foreground">카드를 눌러 고르세요</span>
        )}
        <span className="ml-auto flex flex-wrap items-center gap-[6px]">
          <WorkbenchButton
            variant="soft"
            icon={Star}
            disabled={!selected || !roles.analyst}
            aria-pressed={selected ? isTarget(selected.rank) : false}
            onClick={() => selected && toggleTarget({ rank: selected.rank, ftwrId: selected.item.ftwrId })}
          >
            확인대상
          </WorkbenchButton>
          <WorkbenchButton
            variant="primary"
            icon={ArrowRight}
            disabled={!selected}
            onClick={() => selected && props.onOpenResult(selected.item, selected.rank)}
          >
            정밀 대조
          </WorkbenchButton>
        </span>
      </div>
    </section>
  )
}
