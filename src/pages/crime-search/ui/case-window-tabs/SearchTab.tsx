import * as React from "react"
import { useQueries, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

import type { Crime } from "@/entities/crime"
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
 * 「검색 결과」 탭 — 지금 앱 커맨드센터의 인라인 검색을 그대로(docs/api-communication.md §5):
 *   1) `imageLoad`(원본 · 편집본 — 문양 코드 탭에서 고른 이미지) → 2) `imageSearch`(필수 문양만, 이름 배열)
 *   쿼리 키에 300ms 디바운스된 문양 시그니처, body 는 같은 디바운스 값에서, 디바운스 = 라이브일 때만 발사(settled 게이트).
 * 사건 창 목록은 1위부터 이어진 한 목록이라 쪽(page 0, 1, …)을 차례로 받아 붙인다(끝에 닿으면 다음 쪽). 유사도는 퍼센트로 맞춘다.
 * 본 위치 · 확인대상 ★ 저장(E1 · E3 · E4)은 API 가 없어 숨김(+α 끔). 자동 스크롤 · 빠른 비교는 화면 기능이라 그대로.
 */
export function SearchTab({ viewer, image, onOpenCompare }: SearchTabProps) {
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
