import { useCallback, useMemo, useRef, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowLeft,
  Award,
  ExternalLink,
  Footprints,
  History,
  ListTree,
  Loader2,
  Pencil,
  Search,
  X,
} from "lucide-react"
import { toast } from "sonner"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet"

import { crimeKeys, fetchCrimeDetail, useCrimeStore } from "@/entities/crime"
import {
  PatternCanvas,
  PatternPalette,
  PatternZones,
  usePatternManager,
} from "@/features/patterns-extract"
import {
  RetrievalResultsGrid,
  type RetrievalResultItem,
} from "@/features/crime-search"
import { stripPatternPath, type PatternZone } from "@/entities/pattern"
import { usePageHeader } from "@/widgets/app-shell"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { DotGrid, GlowOrb } from "@/shared/ui/glow-fx"
import { fetchPatterns } from "@/services/crud"
import { imageLoad, imageSearch } from "@/services/api"
import { filteredPatterns, imageChangeHandler } from "@/utils/get-input-change"
import { useDebouncedValue } from "@/shared/lib/use-debounced-value"
import { cn } from "@/shared/lib/utils"

import { crimeHistoryPath, resultDetailPath, searchDetailPath } from "../model/search-paths"
import { CaseExplorerPanel } from "./CaseExplorerPanel"

// 제목은 정적 — 헤더 effect가 매 렌더 재실행되지 않도록 한 번만 생성한다.
const HEADER_TITLE = (
  <div className="flex flex-col justify-center gap-1">
    <span className="text-[28px] leading-none font-bold text-white">
      사건 커맨드센터
    </span>
    <span className="text-[13px] leading-none font-normal text-[#8A93A6]">
      사건 확인·경계선 분할·문양 추출·신발 검색을 한 화면에서 수행합니다.
    </span>
  </div>
)

/** 검색이력 테이블 헤더(레거시 `SearchResults`의 4열과 동일). */
const HISTORY_COLUMNS = ["ID", "등록일시", "순위", "매칭된 신발 정보"] as const

/** 부위 인덱스(0~3) → 데이터 키. PatternZones의 ZONES 순서와 일치해야 한다. */
const ZONE_KEYS: PatternZone[] = ["top", "mid", "bottom", "outline"]

/** 이진화/원본 보기 토글의 한국어 리터럴(기존 값과 정확히 일치, `imageSearch`가 분기). */
const BINARY_ON = "이진화보기"
const BINARY_OFF = "원본보기"
/** 유사부위 표출 리터럴(기존 값 유지). 이진화/원본 전환 시 false로 꺼진다. */
const SIMILARITY_ON = "유사부위표출보기"

/**
 * 통합 커맨드센터 `/search/:crimeNumber`. 기존 사건상세(사건정보·검색이력)와 패턴추출
 * (경계선 분할·문양 추출/편집)을 한 화면으로 병합했다. 상태는 이 페이지가 소유하는
 * `usePatternManager`가 관리하고, 3열 그리드(캔버스 워크벤치 · 문양 정보 · 문양 리스트)로
 * 조립한다. 사건정보는 상단 슬림 바로, 검색이력은 하단 접이식 섹션으로 격납해 문양
 * 정보/리스트가 화면의 주인공이 되게 한다.
 */
export function CrimeDetailPage() {
  const { crimeNumber = "" } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const imgRef = useRef<HTMLImageElement | null>(null)

  // Context 브리지 대신 store 셀렉터로 현장 데이터에 접근한다.
  const crimeData = useCrimeStore((s) => s.crimeData)
  const index = crimeData.findIndex(
    (item) => String(item.crimeNumber) === String(crimeNumber)
  )
  const currentCrimeData = crimeData[index]

  // 패턴추출 상태는 이 페이지가 소유(기존 PatternExtractPage 소유분 이관). 좌표 로직은
  // usePatternManager 내부(clamp 포함)에 있으므로 여기서는 반환 API만 배선한다.
  const {
    canvasRef,
    patterns,
    selected,
    lineState,
    setLineState,
    setSelected,
    extractPattern,
    clearPattern,
    patternsKindSelect,
    insertPattern,
    insertPatternToZone,
    deletePattern,
    essentialCheck,
  } = usePatternManager({
    index,
    currentData: currentCrimeData ?? null,
    imgRef,
  })

  // 현재 선택된 부위에 이미 삽입된 문양 이름 집합. 팔레트가 이 이름의 썸네일을
  // 비활성화하도록 이름 기준(경로 표현 차이 무시)으로 계산한다.
  const insertedNames = useMemo(() => {
    if (selected === null || !currentCrimeData) return new Set<string>()
    const key = ZONE_KEYS[selected]
    const entries = currentCrimeData[key] ?? []
    return new Set(
      entries.map(
        (entry) =>
          stripPatternPath(typeof entry === "string" ? entry : entry[0]) as string
      )
    )
  }, [selected, currentCrimeData])
  const isInserted = useCallback(
    (src: string) => insertedNames.has(stripPatternPath(src) as string),
    [insertedNames]
  )

  const [isExtracting, setIsExtracting] = useState(false)
  // 검색이력은 기본 접힘 — 문양 작업이 주 흐름이라 필요할 때만 펼친다.
  const [historyOpen, setHistoryOpen] = useState(false)

  // 인라인 신발 검색 상태(레거시 ShoesResultPage에서 이관). searchActive가 true면
  // 본문이 검색모드(이미지·문양정보·결과 그리드)로 전환된다.
  // 검색모드는 URL 쿼리(?mode=search)로 관리한다 — [신발 검색]이 history에 항목을 쌓아
  // 브라우저 뒤로가기로 문양추출(검색 종료) 상태로 바로 복귀할 수 있게 한다.
  const searchActive = searchParams.get("mode") === "search"
  // 현장/편집 스와퍼의 현재 표시 대상. 검색 edit 여부가 이 값에서 파생되므로,
  // 검색모드에서 편집이미지로 전환하면 검색도 그 이미지로 자동 재실행된다.
  const [sceneView, setSceneView] = useState<"origin" | "edit">("origin")
  const searchEdit = sceneView === "edit"
  const [binary, setBinary] = useState<string>(BINARY_ON)
  const [similarity, setSimilarity] = useState<string | false>(SIMILARITY_ON)
  const [searchPage, setSearchPage] = useState(0)

  // 현장 문양(필수 토글이 켜진 것만) — 검색 body에 실린다. 부위별 이름 배열.
  const searchPatterns = useMemo(
    () => filteredPatterns(currentCrimeData),
    [currentCrimeData]
  )
  // 필수 문양 시그니처를 300ms 디바운스 → 쿼리 키에 실어 실시간 재검색을 구동한다.
  // 연속 토글 시 마지막 값만 요청되도록 안정 직렬화 문자열 하나로 관리한다.
  const patternsSignature = JSON.stringify(searchPatterns)
  const patternsKey = useDebouncedValue(patternsSignature, 300)
  // 검색 body는 쿼리 키와 "동일한" 디바운스 소스(patternsKey)에서 파생한다. 키(디바운스)와
  // body(라이브 searchPatterns)가 어긋나면 데이터 로드 시점에 요청이 두 번 나가므로,
  // 파싱해 하나의 소스로 통일한다.
  const debouncedPatterns = useMemo(
    () => JSON.parse(patternsKey) as typeof searchPatterns,
    [patternsKey]
  )

  // 1단계: 검색에 사용할 현장 이미지를 로드한다(검색모드 진입 시에만).
  const loadQuery = useQuery({
    queryKey: ["crimeSearch", "image", crimeNumber, searchEdit],
    queryFn: () => imageLoad({ crimeNumber, edit: searchEdit }),
    enabled: searchActive && Boolean(crimeNumber),
  })
  const loadedImage = loadQuery.data ?? null

  // 2단계: 로드된 이미지 + 현장 문양으로 신발 검색을 수행한다. 쿼리 키에 디바운스된
  // 문양 시그니처를 포함해, 필수 토글이 바뀌면 300ms 후 결과가 자동 갱신된다.
  const searchResultQuery = useQuery({
    queryKey: [
      "crimeSearch",
      "results",
      crimeNumber,
      searchEdit,
      searchPage,
      binary,
      similarity,
      patternsKey,
    ],
    queryFn: () =>
      imageSearch({
        crimeNumber,
        body: { image: loadedImage, ...debouncedPatterns },
        page: searchPage,
        binary,
        // 레거시(JS)는 유사부위 리터럴 문자열 또는 false를 그대로 넘겼다.
        similarity: similarity as unknown as boolean,
      }),
    // 디바운스가 라이브 값과 "일치할 때만"(settled) 발사한다. 디바운스가 뒤처지는
    // 동안(스테일 patternsKey) 발사되어 빈 요청이 먼저 나가는 이중 요청을 원천 차단한다.
    // (currentCrimeData 로드 전에는 patternsKey와 signature가 어긋나 자연히 비활성.)
    enabled:
      searchActive &&
      Boolean(loadedImage) &&
      Boolean(currentCrimeData) &&
      patternsKey === patternsSignature,
  })

  const results = (searchResultQuery.data?.result ?? []) as RetrievalResultItem[]
  const totalCount = searchResultQuery.data?.total ?? 0
  const isSearching = loadQuery.isFetching || searchResultQuery.isFetching

  const handleExtract = useCallback(async () => {
    try {
      setIsExtracting(true)
      await extractPattern()
    } catch (error) {
      console.error("패턴 추출 중 오류:", error)
      toast.error("패턴 추출 중 오류가 발생했습니다.")
    } finally {
      setIsExtracting(false)
    }
  }, [extractPattern])

  // 현장/편집 이미지 스와퍼 — imgRef.src를 직접 교체하고, 검색 edit 판정용 sceneView도 갱신한다.
  const showOrigin = useCallback(() => {
    setSceneView("origin")
    imageChangeHandler("origin", imgRef, currentCrimeData)
  }, [currentCrimeData])
  const showEdit = useCallback(() => {
    setSceneView("edit")
    imageChangeHandler("edit", imgRef, currentCrimeData)
  }, [currentCrimeData])

  // 검색이력: 레거시의 ad hoc `fetch(/crime/:crimeNumber)`를 entities
  // `fetchCrimeDetail`(같은 엔드포인트, camelCase) + useQuery로 승격했다.
  // 접힘 여부와 무관하게 항상 조회하고(펼침은 표시만 토글), 데이터는 미리 준비해 둔다.
  const historyQuery = useQuery({
    queryKey: crimeKeys.detail(crimeNumber),
    queryFn: () => fetchCrimeDetail(crimeNumber),
    enabled: Boolean(crimeNumber),
  })
  const historyRows = historyQuery.data ?? []

  const openHistory = (row: { id?: number; ranking?: number }) => {
    if (row.id === undefined) return
    const path = crimeHistoryPath(crimeNumber, row.id, { ranking: row.ranking })
    window.open(
      `${window.location.origin}${path}`,
      "_blank",
      "noopener,noreferrer"
    )
  }

  // 신발 검색: 현재 문양을 서버에 저장(PUT)하고, 페이지 이동 없이 검색모드로 전환한다.
  // 편집 여부는 스와퍼의 sceneView(파생 searchEdit)가 쿼리 키로 관리하므로 여기서 고정하지 않는다.
  const handleSearch = useCallback(() => {
    try {
      if (currentCrimeData) {
        void fetchPatterns(crimeNumber, currentCrimeData)
      }
      setSearchPage(0)
      // history에 항목을 쌓는다(replace 아님) → 뒤로가기로 문양추출로 복귀.
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set("mode", "search")
        return next
      })
    } catch (error) {
      console.error("Error updating patterns:", error)
      toast.error("문양 업데이트 중 오류가 발생했습니다.")
    }
  }, [crimeNumber, currentCrimeData, setSearchParams])

  // 결과 카드 클릭 → 기존과 동일하게 결과 상세로 이동한다.
  const handleSelect = useCallback(
    (item: RetrievalResultItem, ranking: number) => {
      navigate(resultDetailPath(crimeNumber, item.shoesName, { ranking }))
    },
    [navigate, crimeNumber]
  )

  const toggleBinary = useCallback(() => {
    setBinary((prev) => (prev === BINARY_ON ? BINARY_OFF : BINARY_ON))
    // 레거시 규약: 이진화/원본 전환 시 유사부위 표출을 끈다.
    setSimilarity(false)
  }, [])

  const exitSearch = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete("mode")
      return next
    })
  }, [setSearchParams])

  const headerActions = useMemo(() => {
    // 두 모드 공통: [목록으로][편집].
    const commonActions = (
      <>
        <Button
          type="button"
          size="sm"
          onClick={() => navigate(-1)}
          className="border border-[#1E2A3C] bg-[#0F1826] text-[#C7CEDB] hover:border-[#3B82F6]/50 hover:bg-[#141F30] hover:text-white"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          목록으로
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() =>
            window.open(
              `${window.location.origin}/edit/${crimeNumber}`,
              "_blank",
              "noopener,noreferrer"
            )
          }
          className="border border-[#1E2A3C] bg-[#0F1826] text-[#C7CEDB] hover:border-[#3B82F6]/50 hover:bg-[#141F30] hover:text-white"
        >
          <Pencil className="size-4" aria-hidden="true" />
          편집
        </Button>
      </>
    )

    // 검색모드: [목록으로][편집] + [이진화/원본 토글] + [검색 종료].
    if (searchActive) {
      return (
        <>
          {commonActions}
          <Button
            type="button"
            size="sm"
            onClick={toggleBinary}
            className="border border-[#3B82F6]/50 bg-[#152238] text-[#4A9EFF] hover:bg-[#182b45]"
          >
            {binary}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={exitSearch}
            className="border border-[#1E2A3C] bg-[#0F1826] text-[#C7CEDB] hover:border-[#3B82F6]/50 hover:bg-[#141F30] hover:text-white"
          >
            <X className="size-4" aria-hidden="true" />
            검색 종료
          </Button>
        </>
      )
    }

    // 일반모드: [목록으로][편집][검색 이력][신발 검색].
    return (
      <>
        {commonActions}
        <Button
          type="button"
          size="sm"
          onClick={() => setHistoryOpen(true)}
          className="border border-[#1E2A3C] bg-[#0F1826] text-[#C7CEDB] hover:border-[#3B82F6]/50 hover:bg-[#141F30] hover:text-white"
        >
          <History className="size-4" aria-hidden="true" />
          검색 이력
          {historyRows.length > 0 && (
            <span className="rounded-full border border-[#1E2A3C] bg-[#0B121D] px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-[#8A93A6]">
              {historyRows.length}
            </span>
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSearch}
          className="border border-[#3B82F6]/50 bg-[#152238] text-[#4A9EFF] shadow-[0_0_18px_rgba(37,99,235,0.35)] hover:bg-[#182b45]"
        >
          <Search className="size-4" aria-hidden="true" />
          신발 검색
        </Button>
      </>
    )
  }, [
    navigate,
    crimeNumber,
    handleSearch,
    historyRows.length,
    searchActive,
    binary,
    toggleBinary,
    exitSearch,
  ])

  usePageHeader({ title: HEADER_TITLE, actions: headerActions })

  return (
    <div className="relative flex h-[calc(100vh-110px)] w-full flex-col gap-4 overflow-y-auto bg-background px-6 py-6">
      <DotGrid />
      <GlowOrb className="-top-24 right-1/4 h-72 w-72 bg-[#2563EB]/10" />
      <GlowOrb className="bottom-0 left-1/3 h-64 w-64 bg-[#4A9EFF]/8" />

      {/* 본문 4열: 캔버스 워크벤치 · 문양 정보 · 문양 리스트 · 사건정보(세로).
          이미지 열은 정한 폭(1.1fr)을 쓴다 — 세로 이미지를 높이에 꽉 채운(h-full) 폭이
          열 안에 들어오도록 충분히 넓게 잡는다(fit-content 같은 내부 사이징은 자연 높이를
          강제해 삐지므로 쓰지 않음). 사건정보는 맨 오른쪽 좁은 열(0.55fr)에 세로로 격납한다.
          xl 미만에서는 세로 스택으로 폴백하고 페이지 전체가 스크롤된다. */}
      {/* 검색모드(searchActive)에서는 3열 [이미지 | 문양 정보 | 검색 결과(2fr)]로 전환한다.
          문양 리스트·사건정보 열은 렌더하지 않고, 문양 정보(필수 토글)는 유지해 필수를
          바꾸면 오른쪽 결과가 300ms 후 자동 갱신되게 한다. */}
      {/* 그리드 트랙은 모드와 무관하게 4열 고정 — 검색모드에선 문양리스트+사건정보(3·4열)
          자리에 결과를 col-span-2로 얹어, 이미지·문양정보(1·2열)는 전환 시 움직이지 않는다.
          이미지 열은 0.8fr로 좁혀 세로 이미지의 좌우 여백을 줄인다. */}
      <div className="relative grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.75fr)_minmax(0,0.95fr)_minmax(0,0.95fr)_minmax(0,0.85fr)]">
        {/* 각 열 래퍼: 내부 grid-rows로 자식 section이 열 높이를 꽉 채우게 하고,
            xl 미만에서는 min-h로 최소 높이를 확보해 캔버스가 붕괴하지 않게 한다. */}
        <div className="grid min-h-[560px] grid-rows-[minmax(0,1fr)] xl:h-full xl:min-h-0">
          <PatternCanvas
            canvasRef={canvasRef}
            imgRef={imgRef}
            image={currentCrimeData?.image ?? null}
            lineState={lineState}
            setLineState={setLineState}
            onExtract={handleExtract}
            onClear={clearPattern}
            onShowOrigin={showOrigin}
            onShowEdit={showEdit}
            isExtracting={isExtracting}
          />
        </div>

        <div className="grid min-h-[420px] grid-rows-[minmax(0,1fr)] xl:h-full xl:min-h-0">
          <PatternZones
            selected={selected}
            setSelected={setSelected}
            deletePattern={deletePattern}
            essentialCheck={essentialCheck}
            currentData={currentCrimeData}
            onDropToZone={insertPatternToZone}
          />
        </div>

        {searchActive ? (
          // 검색모드: 문양리스트+사건정보 두 열 자리(col-span-2)에 검색 결과 그리드.
          <div className="min-h-[420px] min-w-0 xl:col-span-2 xl:h-full xl:min-h-0">
            <RetrievalResultsGrid
              results={results}
              totalCount={totalCount}
              page={searchPage}
              onPageChange={setSearchPage}
              onSelect={handleSelect}
              isLoading={isSearching}
            />
          </div>
        ) : (
          <>
            <div className="grid min-h-[420px] grid-rows-[minmax(0,1fr)] xl:h-full xl:min-h-0">
              <PatternPalette
                patterns={patterns}
                patternsKindSelect={patternsKindSelect}
                insertPattern={insertPattern}
                isInserted={isInserted}
              />
            </div>

            {/* 맨 오른쪽 세로 열 — 사건 탐색 패널(핀 카드 + 통합검색 + 사건 목록) */}
            <div className="grid min-h-[420px] grid-rows-[minmax(0,1fr)] xl:h-full xl:min-h-0">
              <CaseExplorerPanel
                crimeData={crimeData}
                currentCrimeData={currentCrimeData}
                crimeNumber={crimeNumber}
                onSelect={(n) => navigate(searchDetailPath(n))}
              />
            </div>
          </>
        )}
      </div>

      {/* 검색 이력 — 우측 슬라이드 시트(Sheet)로 분리. 헤더의 [검색 이력] 버튼으로 연다.
          데이터는 시트 개폐와 무관하게 항상 로드된다. */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent
          side="right"
          className="w-full gap-0 border-[#1E2A3C] bg-[#0B121D] p-0 text-[#C7CEDB] sm:max-w-[760px]"
        >
          <SheetHeader className="space-y-1 border-b border-[#141D2C] bg-[#0D1420]/60 px-6 py-4">
            <SheetTitle className="flex items-center gap-2 text-[15px] font-semibold text-[#E5E9F0]">
              <History className="size-4 text-[#4A9EFF]" aria-hidden="true" />
              검색 이력
              <span className="rounded-full border border-[#1E2A3C] bg-[#0F1826] px-2 py-0.5 font-mono text-[11px] tabular-nums text-[#8A93A6]">
                {historyRows.length}
              </span>
            </SheetTitle>
            <SheetDescription className="font-mono text-[11px] tracking-[0.14em] text-[#5B6B85] uppercase">
              Search · History
            </SheetDescription>
          </SheetHeader>

          <div className="h-[calc(100dvh-88px)] overflow-auto">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-[#0D1420]">
              <tr>
                {HISTORY_COLUMNS.map((col) => (
                  <th
                    key={col}
                    className="border-b border-[#1E2A3C] px-6 py-2.5 font-mono text-[11px] tracking-wide text-[#5B6B85] uppercase"
                  >
                    {col}
                  </th>
                ))}
                {/* 행 클릭 시 새 창이 열린다는 어포던스 아이콘 전용 열(헤더는 시각적으로 비움). */}
                <th className="w-10 border-b border-[#1E2A3C] px-3 py-2.5">
                  <span className="sr-only">새 창에서 열기</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {historyRows.length > 0 ? (
                historyRows.map((row, rowIndex) => {
                  const isTopRank =
                    row.ranking !== undefined &&
                    row.ranking !== null &&
                    row.ranking <= 3
                  return (
                    <tr
                      key={row.id ?? rowIndex}
                      onClick={() => openHistory(row)}
                      className="group cursor-pointer border-b border-[#141D2C] transition-colors hover:bg-[#141F30] hover:shadow-[inset_2px_0_0_0_rgba(59,130,246,0.6)]"
                    >
                      <td className="px-6 py-3 font-mono text-[12px] tabular-nums text-[#5B6B85]">
                        #{row.id}
                      </td>
                      <td className="px-6 py-3 font-mono text-[12px] tabular-nums text-[#8A93A6]">
                        {row.registerTime ?? "-"}
                      </td>
                      <td className="px-6 py-3">
                        <Badge
                          className={cn(
                            "gap-1 border font-mono text-[11px] font-semibold tabular-nums",
                            isTopRank
                              ? "border-[#22C55E]/50 bg-[#12241A] text-[#4ADE80] shadow-[0_0_10px_rgba(34,197,94,0.35)]"
                              : "border-[#3B82F6]/40 bg-[#152238]/60 text-[#4A9EFF]"
                          )}
                        >
                          {isTopRank && <Award className="size-3" aria-hidden="true" />}
                          {row.ranking ?? "-"}위
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-[13px] font-medium text-[#C7CEDB]">
                        <span className="flex items-center gap-1.5">
                          <Footprints
                            className="size-3.5 shrink-0 text-[#5B6B85]"
                            aria-hidden="true"
                          />
                          {row.matchingShoes ?? "-"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <ExternalLink
                          className="ml-auto size-3.5 text-[#4A9EFF] opacity-0 transition-opacity group-hover:opacity-100"
                          aria-hidden="true"
                        />
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td
                    colSpan={HISTORY_COLUMNS.length + 1}
                    className="px-6 py-12 text-center"
                  >
                    <div className="flex flex-col items-center gap-2 text-[#5B6B85]">
                      {historyQuery.isFetching ? (
                        <Loader2
                          className="size-7 animate-spin text-[#4A9EFF]"
                          aria-hidden="true"
                        />
                      ) : (
                        <ListTree className="size-7" aria-hidden="true" />
                      )}
                      <span className="text-[13px] font-medium">
                        {historyQuery.isFetching
                          ? "검색 이력을 불러오는 중..."
                          : "저장된 검색 이력이 없습니다."}
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
