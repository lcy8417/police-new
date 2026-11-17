import * as React from "react"
import { useQueries, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  editFileUrl,
  fetchSearchResultsPage,
  SEARCH_RESULTS_PAGE_SIZE,
  searchHistoryKeys,
  useCrimePatterns,
  useEditHistory,
  useSearchHistory,
  useSearchRun,
  type Crime,
} from "@/entities/crime"
import { FEATURES } from "@/entities/session"
import { shoeImageUrl } from "@/entities/shoe"
import { useSaveSeen } from "@/features/crime-search"
import { imageLoad, imageSearch } from "@/services/api"
import { useDebouncedValue } from "@/shared/lib/use-debounced-value"
import { filteredPatterns } from "@/utils/get-input-change"
import {
  SearchResultScreen,
  type AutoMode,
  type ImageMode,
  type ImageSearchResultItem,
  type ResultColumns,
  type SearchTarget,
  type ThumbSize,
} from "@/widgets/search-result"

import { useSelectedRun } from "./model/search-run-session"
import { targetKey, useTargetsBinding } from "./model/use-targets-binding"
import { toPercentList } from "./model/similarity-scale"
import { useImageSession, useTabSessionStore } from "./model/tab-session"
import type { TabViewer } from "./model/use-viewer"

/** 본 시각 KST ISO → 「MM-DD HH:mm」(이번에 새로 본 곳이면 「지금」) */
function seenLabel(iso: string | null): string {
  return iso ? iso.slice(5, 16).replace("T", " ") : "지금"
}

/** 유사부위 표출 리터럴(지금 앱 값 그대로). 이진화 · 원본을 바꾸면 false 로 꺼진다 */
const SIMILARITY_ON = "유사부위표출보기"

interface SearchPage {
  result: ImageSearchResultItem[]
  total: number
}

export interface SearchTabProps {
  viewer: TabViewer
  image: Crime
  /** 「정밀 대조」(카드 고름) — 정밀 대조 탭으로 */
  onOpenCompare: () => void
}

/**
 * 「검색 결과」 탭(B 단계 묶음 ①):
 *   - 이 감정물에 검색 기록(D1 `record`)이 있으면 **그 검색의 결과 쪽**(D4) — 문양 코드 탭에서 고른 검색, 없으면 가장 최근 검색.
 *     저장 순위 200 + 201위부터는 지금 기준으로 다시 계산(알림 한 번), 순위 기록 없는 옛 이력은 「순위 기록 없음」.
 *     초점이 지나간 순위까지 본 위치(E1)를 올린다(사람마다 · 커지기만).
 *   - 검색 기록이 하나도 없으면 지금 앱 커맨드센터의 인라인 검색 그대로(`LiveSearchTab` — 필수 문양 실시간 재검색).
 */
export function SearchTab(props: SearchTabProps) {
  const aprthngNo = props.image.aprthngNo ?? ""
  const historyQuery = useSearchHistory(aprthngNo)
  const selected = useSelectedRun(aprthngNo)
  const history = historyQuery.data
  const latest = history && history.length ? history[history.length - 1].searchNo : null
  const runNo = selected ?? latest
  // 이력을 못 읽었으면(옛 서버 · 오류) 지금 앱 인라인 검색으로 — 검색 결과를 아예 못 보게 막지 않는다
  if (runNo === null && (historyQuery.isSuccess || historyQuery.isError)) {
    // 즉석 검색(D1 POST)은 검색 권한(CRIME_SEARCH)이 있어야 한다 — 보기 전용(검증자 등)은 403 오류 대신 안내만([검수])
    const canSearch = props.viewer.isAdmin || props.viewer.features.includes(FEATURES.CRIME_SEARCH)
    if (!canSearch) {
      return (
        <p className="m-0 grid h-full place-items-center p-[24px] text-center text-[12.5px] text-muted-foreground">
          검색 기록이 없습니다 — 감정관이 문양 코드 탭에서 검색하면 여기에 결과가 보입니다.
        </p>
      )
    }
    return <LiveSearchTab {...props} />
  }
  return <RunResultsTab key={runNo ?? "none"} {...props} searchNo={runNo} />
}

interface RunResultsTabProps extends SearchTabProps {
  /** 볼 검색번호(이력을 아직 못 읽었으면 null) */
  searchNo: number | null
}

/**
 * 지난 검색의 현장 그림 — 그 검색에 쓴 파일([검수] 예전엔 지금 편집본 · 원본을 보여 순위와 그림이 어긋났다).
 * 지금 작업본 · 편집본과 같은 파일이면 이미 받은 그림을 쓰고(감사 · 내려받기 줄임), 다르면 `/files/{id}`(B2).
 * 파일 번호가 없는 옛 이력은 지금 고른 그림.
 */
function useRunSceneImage(aprthngNo: string, image: Crime, inputFileId: number | null, searchImage: string): string {
  const history = useEditHistory(inputFileId !== null ? aprthngNo : "")
  const fallback = (searchImage === "edited" ? image.editImage : image.image) ?? ""
  if (inputFileId === null) return fallback
  if (!history.isSuccess) return history.isError ? editFileUrl(inputFileId) : fallback
  if (inputFileId === history.data.workingFileId && image.image) return image.image
  if (inputFileId === history.data.currentFileId && image.editImage) return image.editImage
  return editFileUrl(inputFileId)
}

/** 검색 기록 한 건의 결과 쪽(D4) — 1위부터 이어진 한 목록, 끝에 닿으면 다음 쪽 */
function RunResultsTab({ viewer, image, onOpenCompare, searchNo }: RunResultsTabProps) {
  const aprthngNo = image.aprthngNo ?? ""
  const setCompare = useTabSessionStore((s) => s.setCompare)
  const { searchImage } = useImageSession(aprthngNo)
  // 그 검색에 쓴 파일(D3 input_file_id) — 옛 이력 · 못 읽으면 null
  const runQuery = useSearchRun(searchNo)
  const sceneImage = useRunSceneImage(aprthngNo, image, runQuery.data?.inputFileId ?? null, searchImage)
  const [binary, setBinary] = React.useState<ImageMode>("이진화보기")
  const [columns, setColumns] = React.useState<ResultColumns>(4)
  const [thumbSize, setThumbSize] = React.useState<ThumbSize>("보통")
  const [autoMode, setAutoMode] = React.useState<AutoMode>("manual")
  const [playing, setPlaying] = React.useState(false)
  const [focusRank, setFocusRank] = React.useState<number | null>(null)
  const [loaded, setLoaded] = React.useState({ run: searchNo, pages: 1 })
  const pageCount = loaded.run === searchNo ? loaded.pages : 1

  const pageQueries = useQueries({
    queries: Array.from({ length: pageCount }, (_, page) => ({
      queryKey: searchHistoryKeys.results(searchNo ?? 0, page, SEARCH_RESULTS_PAGE_SIZE),
      queryFn: () => fetchSearchResultsPage(searchNo as number, page),
      enabled: searchNo !== null,
      staleTime: 60_000,
    })),
  })
  const first = pageQueries[0]?.data
  const rows = pageQueries.flatMap((q) => q.data?.items ?? [])
  const total = first?.total ?? rows.length
  const recomputed = pageQueries.some((q) => q.data?.recomputed)
  const fetchingMore = pageQueries.some((q) => q.isFetching)

  // 201위부터 「지금 기준 다시 계산한 순위」 — 위젯에 띠 자리가 없어 처음 한 번 알림으로(모델 · 후보 목록이 바뀌었으면 함께)
  const noticed = React.useRef(false)
  React.useEffect(() => {
    if (!recomputed || noticed.current) return
    noticed.current = true
    const changed = pageQueries.some((q) => q.data?.basisChanged)
    toast(`${(first?.stored ?? 200) + 1}위부터는 지금 기준으로 다시 계산한 순위입니다.`, {
      description: changed ? "검색 모델 · 신발 후보 목록이 그때와 다릅니다. 그때 순위가 필요하면 같은 조건으로 새로 검색하세요." : undefined,
    })
  }, [recomputed, pageQueries, first?.stored])

  // 본 위치(E1) — 초점 · 손 스크롤 · 자동 넘김이 지나간 순위까지, 서버 값보다 클 때만 올린다(1초 모아 한 번).
  // 화면 표시(「여기까지 봤음」 · 본 것 거르기)는 서버 값과 이번에 본 곳 중 큰 값(결정 기록 — 기본 화면에서도)
  const saveSeen = useSaveSeen()
  const serverSeen = first?.seen?.seenUpTo ?? 0
  const [localSeen, setLocalSeen] = React.useState(0)
  const seenUpTo = Math.max(serverSeen, localSeen, focusRank ?? 0)
  const savedRef = React.useRef(0)
  React.useEffect(() => {
    savedRef.current = Math.max(savedRef.current, serverSeen)
  }, [serverSeen])
  React.useEffect(() => {
    if (searchNo === null || seenUpTo <= savedRef.current) return
    const t = window.setTimeout(() => {
      savedRef.current = seenUpTo
      saveSeen.mutate({ searchNo, seenUpTo })
    }, 1000)
    return () => window.clearTimeout(t)
  }, [seenUpTo, searchNo, saveSeen])
  const seenAt = seenLabel(localSeen > serverSeen ? null : (first?.seen?.seenDt ?? null))

  // 확인대상 ★(E3 · E4) — 이 검색의 것만 위젯에 넘긴다(결정 기록 — 기본 화면에서도 보이고 저장)
  const binding = useTargetsBinding(aprthngNo)
  React.useEffect(() => {
    if (binding.error) toast.error(binding.error)
  }, [binding.error])

  const shoeKind = binary === "이진화보기" ? "B" : "Shoerinsics"
  const results = React.useMemo<ImageSearchResultItem[]>(
    () =>
      toPercentList(
        rows.map((r) => ({ ftwrId: r.ftwrId, image: shoeImageUrl(r.ftwrId, shoeKind), similarity: r.similarity, brandNm: r.brandCode })),
      ),
    [rows, shoeKind],
  )

  const legacy = Boolean(first?.legacy)
  const status = pageQueries.some((q) => q.isError)
    ? "error"
    : searchNo === null || !first
      ? "loading"
      : results.length === 0
        ? "empty"
        : "ready"

  const openResult = (item: ImageSearchResultItem, ranking: number) => {
    // 검색 번호를 함께 — 정밀 대조 「확인대상」이 이 검색의 확인대상으로 저장한다(E3 — [검수])
    const run = searchNo ?? undefined
    const candidates = results.map((r, i) => ({ ftwrId: r.ftwrId, rank: i + 1, similarity: r.similarity, searchNo: run }))
    setCompare(aprthngNo, { ftwrId: item.ftwrId, rank: ranking, similarity: item.similarity, searchNo: run }, candidates)
    onOpenCompare()
  }

  // 이 검색의 확인대상(받은 순위 안에 있는 것만 — 순위는 카드 자리)
  const targets = React.useMemo<SearchTarget[]>(() => {
    if (searchNo === null || !binding.ready) return []
    return results.flatMap((r, i) => (binding.targets.has(targetKey(searchNo, r.ftwrId)) ? [{ rank: i + 1, ftwrId: r.ftwrId }] : []))
  }, [results, binding.ready, binding.targets, searchNo])

  return (
    <SearchResultScreen
      status={status}
      emptyNote={
        legacy
          ? { title: "옛 이력 — 순위 기록 없음", hint: "문양 코드 탭에서 이 문양으로 새 검색을 하세요" }
          : { title: "결과 없음", hint: "필수 문양을 줄이거나 문양 코드 탭에서 조건을 바꿔 다시 검색하세요" }
      }
      seen={legacy || searchNo === null ? null : { upTo: seenUpTo, at: seenAt }}
      onSeenUpToChange={(rank) => setLocalSeen((s) => Math.max(s, rank))}
      targets={targets}
      onToggleTarget={
        searchNo !== null && binding.canToggle ? (t) => binding.toggleTarget(searchNo, t.ftwrId, "search") : undefined
      }
      onRetry={() => pageQueries.forEach((q) => void q.refetch())}
      isAdmin={viewer.isAdmin}
      features={viewer.features}
      imageNo={aprthngNo}
      sceneImage={sceneImage}
      results={results}
      totalCount={total}
      page={1}
      pageSize={Math.max(results.length, 1)}
      onPageChange={() => undefined}
      imageMode={binary}
      onImageModeChange={setBinary}
      onOpenResult={openResult}
      showPlus={false}
      inWindow
      columns={columns}
      onColumnsChange={setColumns}
      thumbSize={thumbSize}
      onThumbSizeChange={setThumbSize}
      autoMode={autoMode}
      onAutoModeChange={setAutoMode}
      playing={playing}
      onPlayingChange={setPlaying}
      focusRank={focusRank}
      onFocusChange={setFocusRank}
      onNotice={(message) => toast(message)}
      onLoadMore={
        results.length < total && !fetchingMore && !legacy
          ? () => setLoaded({ run: searchNo, pages: pageCount + 1 })
          : undefined
      }
    />
  )
}

/**
 * 검색 기록이 없는 감정물 — 지금 앱 커맨드센터의 인라인 검색을 그대로(docs/api-communication.md §5):
 *   1) `imageLoad`(원본 · 편집본 — 문양 코드 탭에서 고른 이미지) → 2) `imageSearch`(필수 문양만, 이름 배열)
 *   쿼리 키에 300ms 디바운스된 문양 시그니처, body 는 같은 디바운스 값에서, 디바운스 = 라이브일 때만 발사(settled 게이트).
 * 사건 창 목록은 1위부터 이어진 한 목록이라 쪽(page 0, 1, …)을 차례로 받아 붙인다(끝에 닿으면 다음 쪽). 유사도는 퍼센트로 맞춘다.
 */
function LiveSearchTab({ viewer, image, onOpenCompare }: SearchTabProps) {
  const aprthngNo = image.aprthngNo ?? ""
  const { searchImage } = useImageSession(aprthngNo)
  const setCompare = useTabSessionStore((s) => s.setCompare)
  const searchEdit = searchImage === "edited"
  const hasEditImage = Boolean(image.editImage)

  const [binary, setBinary] = React.useState<ImageMode>("이진화보기")
  const [similarity, setSimilarity] = React.useState<string | false>(SIMILARITY_ON)
  const [columns, setColumns] = React.useState<ResultColumns>(4)
  const [thumbSize, setThumbSize] = React.useState<ThumbSize>("보통")
  const [autoMode, setAutoMode] = React.useState<AutoMode>("manual")
  const [playing, setPlaying] = React.useState(false)
  const [focusRank, setFocusRank] = React.useState<number | null>(null)

  // 필수 문양(이름 배열) → 디바운스 시그니처. 키와 body 를 같은 디바운스 값에서 만든다.
  // 문양은 서버 문양(C1 — 옛 전역 store 아님). 읽는 동안은 검색을 내보내지 않는다(빈 문양으로 먼저 나가는 이중 요청 방지)
  const patternsQuery = useCrimePatterns(aprthngNo)
  const patternsReady = !patternsQuery.isPending
  const patternSource = patternsQuery.data ?? image
  const searchPatterns = React.useMemo(() => filteredPatterns(patternSource), [patternSource])
  const patternsSignature = JSON.stringify(searchPatterns)
  const patternsKey = useDebouncedValue(patternsSignature, 300)
  const debouncedPatterns = React.useMemo(() => JSON.parse(patternsKey) as typeof searchPatterns, [patternsKey])
  const settled = patternsKey === patternsSignature

  // 받은 쪽 수 — 검색 조건이 바뀌면 1쪽부터(조건 문자열이 다르면 1로 본다).
  // 이진화 · 원본 · 유사부위 표출은 화면 전용 값이라 조건이 아니다(서버 순위와 무관 — 바꿔도 다시 검색하지 않고 그림 폴더만 바꿈)
  const conditionKey = `${searchEdit}|${patternsKey}`
  const [loaded, setLoaded] = React.useState({ key: conditionKey, pages: 1 })
  const pageCount = loaded.key === conditionKey ? loaded.pages : 1

  const loadQuery = useQuery({
    queryKey: ["crimeSearch", "image", aprthngNo, searchEdit],
    queryFn: () => imageLoad({ aprthngNo, edit: searchEdit }),
    enabled: Boolean(aprthngNo) && (!searchEdit || hasEditImage),
  })
  const loadedImage = loadQuery.data ?? null

  // @MX:WARN: settled 게이트(docs/api-communication.md §5) — enabled 의 patternsKey === patternsSignature 를 지우면 스테일 문양으로 먼저 나가는 이중 요청
  const pageQueries = useQueries({
    queries: Array.from({ length: pageCount }, (_, page) => ({
      // 키 = 순위에 영향 주는 값만(감정물 · 원본/편집본 · 쪽 · 필수 문양). 이진화 · 원본 · 유사부위 토글은 키에 넣지 않는다 —
      // 예전에는 토글마다 받은 모든 쪽의 검색 POST 가 다시 나갔다(분석 보고서 B7). 그림 주소는 아래 results 에서 지금 보기로 만든다
      queryKey: ["crimeSearch", "results", aprthngNo, searchEdit, page, patternsKey],
      queryFn: () =>
        imageSearch({
          aprthngNo,
          body: { image: loadedImage, ...debouncedPatterns },
          page,
          binary,
          // 지금 앱(JS)은 유사부위 리터럴 문자열 또는 false 를 그대로 넘겼다(서버는 순위에 쓰지 않음)
          similarity: similarity as unknown as boolean,
        }) as Promise<SearchPage>,
      enabled: Boolean(loadedImage) && (!searchEdit || hasEditImage) && settled && patternsReady,
    })),
  })

  const first = pageQueries[0]
  const totalCount = first?.data?.total ?? 0
  // 그림 폴더는 지금 보기(이진화 · 원본)로 — 받은 결과의 image 는 받을 때 보기라 다시 만든다(RunResultsTab 과 같은 규칙)
  const shoeKind = binary === "이진화보기" ? "B" : "Shoerinsics"
  const results = toPercentList(
    pageQueries.flatMap((q) => (q.data?.result ?? []).map((r) => ({ ...r, image: shoeImageUrl(r.ftwrId, shoeKind) }))),
  )
  const fetchingMore = pageQueries.some((q) => q.isFetching)

  const noEditImage = searchEdit && !hasEditImage
  const status = noEditImage
    ? "empty"
    : loadQuery.isError || first?.isError
      ? "error"
      : !first?.data
        ? "loading"
        : results.length === 0
          ? "empty"
          : "ready"

  const openResult = (item: ImageSearchResultItem, ranking: number) => {
    const candidates = results.map((r, i) => ({ ftwrId: r.ftwrId, rank: i + 1, similarity: r.similarity }))
    setCompare(aprthngNo, { ftwrId: item.ftwrId, rank: ranking, similarity: item.similarity }, candidates)
    onOpenCompare()
  }

  return (
    <SearchResultScreen
      status={status}
      emptyNote={noEditImage ? { title: "편집 이미지 없음", hint: "이미지 편집 탭에서 저장하거나 문양 코드 탭에서 원본으로 바꾸세요" } : undefined}
      onRetry={() => {
        void loadQuery.refetch()
        pageQueries.forEach((q) => void q.refetch())
      }}
      isAdmin={viewer.isAdmin}
      features={viewer.features}
      imageNo={aprthngNo}
      sceneImage={(searchEdit ? image.editImage : image.image) ?? ""}
      results={results}
      totalCount={totalCount}
      page={1}
      pageSize={Math.max(results.length, 1)}
      onPageChange={() => undefined}
      imageMode={binary}
      onImageModeChange={(mode) => {
        setBinary(mode)
        // 지금 앱 규약: 이진화 · 원본을 바꾸면 유사부위 표출을 끈다
        setSimilarity(false)
      }}
      onOpenResult={openResult}
      showPlus={false}
      inWindow
      columns={columns}
      onColumnsChange={setColumns}
      thumbSize={thumbSize}
      onThumbSizeChange={setThumbSize}
      autoMode={autoMode}
      onAutoModeChange={setAutoMode}
      playing={playing}
      onPlayingChange={setPlaying}
      focusRank={focusRank}
      onFocusChange={setFocusRank}
      onNotice={(message) => toast(message)}
      onLoadMore={
        results.length < totalCount && !fetchingMore
          ? () => setLoaded({ key: conditionKey, pages: pageCount + 1 })
          : undefined
      }
    />
  )
}
