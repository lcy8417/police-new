import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import type { SearchRun } from "@/widgets/pattern-code"
import {
  SearchResultScreen,
  type AutoMode,
  type ImageMode,
  type ResultColumns,
  type SearchTarget,
  type ThumbSize,
} from "@/widgets/search-result"

import {
  DevScreenFrame,
  SCREEN_CASES,
  devScreen,
  isIntervalMs,
  isStringListRecord,
  oneOf,
  useDevCase,
  useDevNavigate,
  useDevPlus,
  useDevViewer,
  useRememberedState,
  useWorkState,
  useWorkValue,
  useWorkWriter,
  type DevGo,
} from "../frame"
import { fakeShoePatterns, rankOfRun, S04_RUNS_FIELD } from "../s04/mock-cases"
import { fakeSoleUrl } from "../mock-assets/FakeSole"
import { samplePhotoUrl, sampleSoleUrl } from "../mock-assets/sample-images"
import type { ZoneTriple } from "../mock-assets/fake-art"
import { fakeSideShoeUrl } from "../s06/fake-side-shoe"
import {
  INITIAL_TARGETS,
  makeInsight,
  makeRange,
  makeResults,
  S05_ERROR_AT,
  S05_WINDOW_FIRST,
  S05_WINDOW_STEP,
  S05_IMAGE_NO,
  S05_FOCUS_RANK,
  S05_PAGE_SIZE,
  S05_SEEN_AT,
  S05_SEEN_UP_TO,
  S05_RUN_NO_FIELD,
  S05_TOTAL,
  runEssentialSummary,
  runQueryPatterns,
  runResults,
} from "./mock-cases"

const info = devScreen("s05")
const COLUMN_VALUES: readonly (ResultColumns | null)[] = [null, 1, 2, 3, 4, 5, 6, 8]
const THUMB_VALUES: readonly ThumbSize[] = ["작게", "보통", "크게"]

// 결과 밑창 무늬 8가지(시안 S05 Z 배열)를 순위마다 돌려 쓴다
const ZONES: readonly ZoneTriple[] = [
  ["herring", "grid", "herring"],
  ["grid", "grid", "blocks"],
  ["herring", "herring", "lines"],
  ["dots", "herring", "grid"],
  ["wave", "grid", "herring"],
  ["blocks", "herring", "blocks"],
  ["tri", "herring", "grid"],
  ["herring", "dots", "herring"],
]

const PLUS_NOT_READY = "시안 — 기능 준비 중"

export interface S05ContentProps {
  devCase: (typeof SCREEN_CASES.s05)[number]
  /** 검색한 이미지 번호(`<감정번호>_<n>`, 없으면 시안 값) */
  imageNo?: string
  /** 화면 옮기기(없으면 진열 주소 이동) — 사건 창은 탭 바꾸기로 받는다 */
  go?: DevGo
  /** 사건 창 안(11/17) — 먹색 작업판 · 1위부터 이어진 순위 목록 · 자동 스크롤 · 빠른 비교(위젯 `inWindow`) */
  inWindow?: boolean
  /** 보여 줄 검색 번호(문양 코드 탭 검색 이력 「자세히 →」에서 넘어옴) — 없으면 시안 값 */
  searchNo?: string
}

// S05 검색 결과 진열 페이지: 쪽 번호 · 이진화/원본 보기 · 확인대상(★)을 여기서 들고(제어형), 카드를 누르면 S06 으로 간다.
export function S05DevPage() {
  const activeCase = useDevCase(SCREEN_CASES.s05, "ready")
  return (
    <DevScreenFrame screen={info.screen} title={info.title} cases={info.cases}>
      <S05Content devCase={activeCase} />
    </DevScreenFrame>
  )
}

/** S05 틀 없는 내용 — 진열 페이지와 사건 창(「검색 결과」 탭)이 같이 쓴다 */
export function S05Content({ devCase: activeCase, imageNo = S05_IMAGE_NO, go, inWindow, searchNo }: S05ContentProps) {
  const nav = useDevNavigate()
  const to = go ?? nav
  const viewer = useDevViewer()
  const showPlus = useDevPlus()
  const [page, setPage] = useState(1)
  // 지금 앱 기본값은 이진화보기
  const [imageMode, setImageMode] = useState<ImageMode>("이진화보기")
  // 확인대상 · 본 위치는 탭을 옮겨도 남는다(사건 창 보관함 — 이미지별)
  const [targets, setTargets] = useWorkState<readonly SearchTarget[]>("s05.targets", INITIAL_TARGETS)
  // 사건 창: 문양 코드 탭 검색 이력의 그 검색(「자세히 →」) — 그 검색의 문양 · 가중치로 낸 순위 · 점수 · 건수를 보인다(1회차 검수)
  const workRuns = useWorkValue<SearchRun[]>(S04_RUNS_FIELD)
  const run = useMemo(() => (searchNo ? workRuns?.find((r) => String(r.searchNo) === searchNo) : undefined), [workRuns, searchNo])
  const runHits = useMemo(() => (run && runQueryPatterns(run).length > 0 ? rankOfRun(run) : undefined), [run])
  const writeWork = useWorkWriter()
  useEffect(() => {
    // 정밀 대조 탭이 같은 검색의 후보를 쓰게 지금 보는 검색번호를 남긴다
    writeWork(S05_RUN_NO_FIELD, runHits && run ? run.searchNo : undefined)
  }, [writeWork, run, runHits])

  // r3 보기 설정 — 결과형태 · 썸네일 · 간격 · 필터는 이 브라우저에 기억(결과형태 null = 화면 기본: +α 8열 · 아니면 4열)
  const [columns, setColumns] = useRememberedState<ResultColumns | null>("s05", "columns", null, oneOf(COLUMN_VALUES))
  const [thumbSize, setThumbSize] = useRememberedState<ThumbSize>("s05", "thumb", "보통", oneOf(THUMB_VALUES))
  const [intervalMs, setIntervalMs] = useRememberedState<number>("s05", "interval", 2000, isIntervalMs)
  const [filters, setFilters] = useRememberedState<Record<string, string[]>>("s05", "filters", {}, isStringListRecord)
  const [query, setQuery] = useState("")
  // 자동 모드는 기억하지 않는다(다시 열 때 저절로 넘어가지 않게)
  const [autoMode, setAutoMode] = useState<AutoMode>("manual")
  const [playing, setPlaying] = useState(false)
  const [focusRank, setFocusRank] = useState<number | null>(runHits ? null : S05_FOCUS_RANK)
  const [seen, setSeen] = useWorkState(`s05.seen.${run?.searchNo ?? "base"}`, runHits ? { upTo: 0, at: "—" } : { upTo: S05_SEEN_UP_TO, at: S05_SEEN_AT })

  // 표본 그림: 현장 = 이 이미지 번호의 실제 사진, 후보 = 신발 번호로 고른 실제 밑창(없으면 가짜 그림)
  const sceneImage = useMemo(() => samplePhotoUrl(imageNo, { zones: ["herring", "herring", "herring"], flip: true, tag: "" }), [imageNo])
  const soleKind = imageMode === "이진화보기" ? "bin" : "shoe"
  const soleUrls = useMemo(
    () => ZONES.map((zones, i) => fakeSoleUrl({ kind: soleKind, zones, seed: i + 1 })),
    [soleKind],
  )
  // 사건 창(11/17 「순위가 쭉」)은 1위부터 이어진 한 목록 — 끝에 닿으면 더 붙인다. 단독 진열은 쪽 넘김 그대로
  const [windowCount, setWindowCount] = useState(S05_WINDOW_FIRST)
  const results = useMemo(() => {
    if (activeCase !== "ready") return []
    const imageFor = (rank: number, ftwrId: string) => sampleSoleUrl(ftwrId, { kind: soleKind }, () => soleUrls[(rank - 1) % soleUrls.length])
    if (inWindow && run && runHits) return runResults(run, runHits, windowCount, imageFor, fakeShoePatterns)
    return inWindow
      ? makeRange(windowCount, imageFor, (rank) => ZONES[(rank - 1) % ZONES.length])
      : makeResults(page, imageFor)
  }, [activeCase, page, soleUrls, soleKind, inWindow, windowCount, run, runHits])
  const total = runHits ? runHits.length : S05_TOTAL
  const baseInsight = useMemo(
    () => ({
      ...makeInsight({
        scene: sceneImage,
        // 상세조회 = 137위 305102(결과 목록 그 카드와 같은 그림)
        shoe: sampleSoleUrl("305102", { kind: "shoe", zones: ZONES[0] }),
        side: fakeSideShoeUrl(),
        aiTop: (zones, ftwrId) => sampleSoleUrl(ftwrId, { kind: "shoe", zones }),
      }),
      ...(searchNo ? { searchNo } : {}),
      // 그 검색의 시각 · 필수 요약 · 넣은 문양(이력 줄 값 그대로). 문양 없이 검색했으면 이미지 유사도 결과(시안 값) 그대로
      ...(run
        ? {
            searchedAt: run.at.slice(5, 16),
            essentialSummary: runEssentialSummary(run),
            searchMethod: runHits ? "문양 점수(가중치)" : "이미지 검색",
            queryPatterns: runQueryPatterns(run),
            ...(runHits ? { focusRank: null, peek: null, detail: null, rerankUp: {} } : {}),
          }
        : {}),
    }),
    [sceneImage, searchNo, run, runHits],
  )
  // 「어디까지 봤는지」는 초점이 지나가며 올라간다(제어형)
  const insight = useMemo(() => ({ ...baseInsight, seenUpTo: seen.upTo, seenAt: seen.at }), [baseInsight, seen])

  return (
    <SearchResultScreen
      status={activeCase}
      errorAt={S05_ERROR_AT}
      onRetry={() => {
        toast("다시 검색합니다(진열용)")
        to("/dev/s05", { case: "ready" })
      }}
      isAdmin={viewer.isAdmin}
      features={viewer.features}
      imageNo={imageNo}
      sceneImage={sceneImage}
      results={results}
      totalCount={activeCase === "ready" ? total : 0}
      page={page}
      pageSize={S05_PAGE_SIZE}
      onPageChange={setPage}
      imageMode={imageMode}
      onImageModeChange={(mode) => {
        setImageMode(mode)
        toast(`${mode} — 결과 이미지를 다시 불러옵니다(진열용)`)
      }}
      onOpenResult={(item, ranking) => to("/dev/s06", { ftwr: item.ftwrId, rank: String(ranking) })}
      showPlus={showPlus}
      inWindow={inWindow}
      insight={insight}
      targets={targets}
      onToggleTarget={(t) => {
        const has = targets.some((x) => x.rank === t.rank)
        setTargets(has ? targets.filter((x) => x.rank !== t.rank) : [...targets, t].sort((a, b) => a.rank - b.rank))
        toast(has ? `${t.rank}위 ${t.ftwrId} 확인대상 제외(진열용)` : `${t.rank}위 ${t.ftwrId} 확인대상 등록(진열용)`)
      }}
      onResume={(rank) => {
        if (inWindow) setWindowCount((n) => Math.max(n, rank + S05_WINDOW_STEP))
        else setPage(Math.ceil(rank / S05_PAGE_SIZE))
        setFocusRank(rank)
      }}
      onLoadMore={inWindow ? () => setWindowCount((n) => Math.min(total, n + S05_WINDOW_STEP)) : undefined}
      onPlusAction={(label) => toast(PLUS_NOT_READY, { description: label })}
      columns={columns ?? undefined}
      onColumnsChange={setColumns}
      thumbSize={thumbSize}
      onThumbSizeChange={setThumbSize}
      query={query}
      onQueryChange={setQuery}
      filters={filters}
      onFiltersChange={(key, values) => setFilters({ ...filters, [key]: values })}
      onClearFilters={() => {
        setQuery("")
        setFilters({})
      }}
      autoMode={autoMode}
      onAutoModeChange={(mode) => {
        setAutoMode(mode)
        setPlaying(mode === "auto")
      }}
      intervalMs={intervalMs}
      onIntervalChange={setIntervalMs}
      playing={playing}
      onPlayingChange={setPlaying}
      focusRank={focusRank}
      onFocusChange={setFocusRank}
      onSeenUpToChange={(rank) => setSeen({ upTo: rank, at: "방금" })}
      onNotice={(message) => toast(message)}
    />
  )
}
