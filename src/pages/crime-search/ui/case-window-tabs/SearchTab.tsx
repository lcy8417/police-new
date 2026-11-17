import * as React from "react"
import { useQueries, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

import type { Crime } from "@/entities/crime"
import {
  fetchSearchResultsPage,
  SEARCH_RESULTS_PAGE_SIZE,
  searchHistoryKeys,
  useSearchHistory,
} from "@/entities/crime/api/search-history-api"
import { shoeImageUrl } from "@/entities/shoe"
import { useSaveSeen } from "@/features/crime-search/api/use-run-search"
import { imageLoad, imageSearch } from "@/services/api"
import { useDebouncedValue } from "@/shared/lib/use-debounced-value"
import { filteredPatterns } from "@/utils/get-input-change"
import {
  SearchResultScreen,
  type AutoMode,
  type ImageMode,
  type ImageSearchResultItem,
  type ResultColumns,
  type ThumbSize,
} from "@/widgets/search-result"

import { useSelectedRun } from "./model/search-run-session"
import { toPercentList } from "./model/similarity-scale"
import { useImageSession, useTabSessionStore } from "./model/tab-session"
import type { TabViewer } from "./model/use-viewer"

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
  if (runNo === null && (historyQuery.isSuccess || historyQuery.isError)) return <LiveSearchTab {...props} />
  return <RunResultsTab key={runNo ?? "none"} {...props} searchNo={runNo} />
}

interface RunResultsTabProps extends SearchTabProps {
  /** 볼 검색번호(이력을 아직 못 읽었으면 null) */
  searchNo: number | null
}

/** 검색 기록 한 건의 결과 쪽(D4) — 1위부터 이어진 한 목록, 끝에 닿으면 다음 쪽 */
function RunResultsTab({ viewer, image, onOpenCompare, searchNo }: RunResultsTabProps) {
  const aprthngNo = image.aprthngNo ?? ""
  const setCompare = useTabSessionStore((s) => s.setCompare)
  const { searchImage } = useImageSession(aprthngNo)
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

  // 본 위치(E1) — 초점이 지나간 순위까지, 서버 값보다 클 때만 올린다(1초 모아 한 번)
  const saveSeen = useSaveSeen()
  const seenRef = React.useRef(0)
  React.useEffect(() => {
    seenRef.current = Math.max(seenRef.current, first?.seen?.seenUpTo ?? 0)
  }, [first?.seen?.seenUpTo])
  React.useEffect(() => {
    if (searchNo === null || focusRank === null || focusRank <= seenRef.current) return
    const t = window.setTimeout(() => {
      seenRef.current = focusRank
      saveSeen.mutate({ searchNo, seenUpTo: focusRank })
    }, 1000)
    return () => window.clearTimeout(t)
  }, [focusRank, searchNo, saveSeen])

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
    const candidates = results.map((r, i) => ({ ftwrId: r.ftwrId, rank: i + 1, similarity: r.similarity }))
    setCompare(aprthngNo, { ftwrId: item.ftwrId, rank: ranking, similarity: item.similarity }, candidates)
    onOpenCompare()
  }

  return (
    <SearchResultScreen
      status={status}
      emptyNote={
        legacy
          ? { title: "옛 이력 — 순위 기록 없음", hint: "문양 코드 탭에서 이 문양으로 새 검색을 하세요" }
          : { title: "결과 없음", hint: "필수 문양을 줄이거나 문양 코드 탭에서 조건을 바꿔 다시 검색하세요" }
      }
      onRetry={() => pageQueries.forEach((q) => void q.refetch())}
      isAdmin={viewer.isAdmin}
      features={viewer.features}
      imageNo={aprthngNo}
      sceneImage={(searchImage === "edited" ? image.editImage : image.image) ?? ""}
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

  // 필수 문양(이름 배열) → 디바운스 시그니처. 키와 body 를 같은 디바운스 값에서 만든다
  const searchPatterns = React.useMemo(() => filteredPatterns(image), [image])
  const patternsSignature = JSON.stringify(searchPatterns)
  const patternsKey = useDebouncedValue(patternsSignature, 300)
  const debouncedPatterns = React.useMemo(() => JSON.parse(patternsKey) as typeof searchPatterns, [patternsKey])
  const settled = patternsKey === patternsSignature

  // 받은 쪽 수 — 검색 조건이 바뀌면 1쪽부터(조건 문자열이 다르면 1로 본다)
  const conditionKey = `${searchEdit}|${binary}|${String(similarity)}|${patternsKey}`
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
      // 지금 앱(CrimeDetailPage)과 같은 키 모양 — 같은 감정물 · 같은 조건이면 캐시를 같이 쓴다
      queryKey: ["crimeSearch", "results", aprthngNo, searchEdit, page, binary, similarity, patternsKey],
      queryFn: () =>
        imageSearch({
          aprthngNo,
          body: { image: loadedImage, ...debouncedPatterns },
          page,
          binary,
          // 지금 앱(JS)은 유사부위 리터럴 문자열 또는 false 를 그대로 넘겼다
          similarity: similarity as unknown as boolean,
        }) as Promise<SearchPage>,
      enabled: Boolean(loadedImage) && (!searchEdit || hasEditImage) && settled,
    })),
  })

  const first = pageQueries[0]
  const totalCount = first?.data?.total ?? 0
  const results = toPercentList(pageQueries.flatMap((q) => q.data?.result ?? []))
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
