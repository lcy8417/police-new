import { useCallback, useMemo, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft } from "lucide-react"

import { useCrimeStore } from "@/entities/crime"
import { RetrievalResultsGrid, type RetrievalResultItem } from "@/features/crime-search"
import { usePageHeader } from "@/widgets/app-shell"
import { Button } from "@/shared/ui/button"
import { DotGrid, GlowOrb } from "@/shared/ui/glow-fx"
import { imageLoad, imageSearch } from "@/services/api"
import { filteredPatterns } from "@/utils/get-input-change"

import { patternExtractPath, resultDetailPath } from "../model/search-paths"
import { CrimeScenePanel } from "./CrimeScenePanel"

const url = import.meta.env.VITE_API_URL

/** 이진화/원본 보기 토글의 한국어 리터럴(기존 값과 정확히 일치, `imageSearch`가 분기). */
const BINARY_ON = "이진화보기"
const BINARY_OFF = "원본보기"
/** 유사부위 표출 리터럴(기존 값 유지). 토글 시 false로 꺼진다. */
const SIMILARITY_ON = "유사부위표출보기"

// 제목은 정적 — 헤더 effect가 매 렌더 재실행되지 않도록 한 번만 생성한다.
const HEADER_TITLE = (
  <div className="flex flex-col justify-center gap-1">
    <span className="text-[28px] leading-none font-bold text-white">
      사건 검색 결과
    </span>
    <span className="text-[13px] leading-none font-normal text-[#8A93A6]">
      현장 문양으로 신발 DB를 검색한 결과입니다.
    </span>
  </div>
)

/**
 * 커맨드 센터 `/search/:crimeNumber/shoesResult`. 레거시 `ShoesResultMain`의
 * imageLoad→imageSearch 2단 흐름을 TanStack `useQuery` 두 개로 옮겼다: 현장
 * 이미지를 먼저 로드하고, 그 이미지 + 현장 문양으로 신발 검색을 수행한다.
 * URL `page`/`edit` 파라미터와 이진화/유사부위 토글(한국어 리터럴)을 유지한다.
 */
export function ShoesResultPage() {
  const { crimeNumber = "" } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const edit = searchParams.get("edit") === "true"
  const page = parseInt(searchParams.get("page") || "0", 10)

  // 이진화/유사부위 토글은 이 페이지가 소유한다(레거시 wrapper의 상태를 흡수).
  const [binary, setBinary] = useState<string>(BINARY_ON)
  const [similarity, setSimilarity] = useState<string | false>(SIMILARITY_ON)

  // Context 브리지 대신 store 셀렉터로 현장 데이터에 접근한다.
  const crimeData = useCrimeStore((s) => s.crimeData)
  const currentCrimeData = crimeData.find(
    (item) => String(item.crimeNumber) === String(crimeNumber)
  )

  // 현장 문양(필수 토글이 켜진 것만) — 검색 body에 실린다.
  const patterns = useMemo(
    () => filteredPatterns(currentCrimeData),
    [currentCrimeData]
  )

  // 1단계: 검색에 사용할 현장 이미지를 로드한다.
  const loadQuery = useQuery({
    queryKey: ["crimeSearch", "image", crimeNumber, edit],
    queryFn: () => imageLoad({ crimeNumber, edit }),
    enabled: Boolean(crimeNumber),
  })
  const loadedImage = loadQuery.data ?? null

  // 2단계: 로드된 이미지 + 현장 문양으로 신발 검색을 수행한다.
  const searchQuery = useQuery({
    queryKey: ["crimeSearch", "results", crimeNumber, page, binary, similarity],
    queryFn: () =>
      imageSearch({
        crimeNumber,
        body: { image: loadedImage, ...patterns },
        page,
        binary,
        // 레거시(JS)는 유사부위 리터럴 문자열 또는 false를 그대로 넘겼다.
        // api.js가 default 값(false)으로 boolean을 추론하므로 런타임 규약을
        // 유지하며 통과시킨다.
        similarity: similarity as unknown as boolean,
      }),
    enabled: Boolean(loadedImage),
  })

  const results = (searchQuery.data?.result ?? []) as RetrievalResultItem[]
  const totalCount = searchQuery.data?.total ?? 0
  const isSearching = loadQuery.isFetching || searchQuery.isFetching

  // 편집 모드에서는 로드한 이미지를, 아니면 정적 현장 이미지 URL을 표시한다.
  const displayImage = edit
    ? loadedImage
    : `${url}/crime_images/${crimeNumber}.png`

  const handlePageChange = useCallback(
    (next: number) => {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set("page", String(next))
      setSearchParams(nextParams)
    },
    [searchParams, setSearchParams]
  )

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

  // 헤더 액션: 뒤로가기(패턴추출) + 이진화/원본 토글. 핸들러 의존값이 바뀔 때만 재생성.
  const headerActions = useMemo(
    () => (
      <>
        <Button
          type="button"
          size="sm"
          onClick={() => navigate(patternExtractPath(crimeNumber))}
          className="border border-[#1E2A3C] bg-[#0F1826] text-[#C7CEDB] hover:border-[#3B82F6]/50 hover:bg-[#141F30] hover:text-white"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          뒤로가기
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={toggleBinary}
          className="border border-[#3B82F6]/50 bg-[#152238] text-[#4A9EFF] hover:bg-[#182b45]"
        >
          {binary}
        </Button>
      </>
    ),
    [navigate, crimeNumber, binary, toggleBinary]
  )

  usePageHeader({ title: HEADER_TITLE, actions: headerActions })

  return (
    <div className="relative h-[calc(100vh-110px)] w-full overflow-hidden bg-background px-6 py-6">
      <DotGrid />
      <GlowOrb className="-top-24 right-1/4 h-72 w-72 bg-[#2563EB]/10" />
      <GlowOrb className="bottom-0 left-1/3 h-64 w-64 bg-[#4A9EFF]/8" />

      <div className="relative grid h-full grid-cols-1 gap-6 lg:grid-cols-[1fr_1.7fr]">
        <CrimeScenePanel image={displayImage} />
        <RetrievalResultsGrid
          results={results}
          totalCount={totalCount}
          page={page}
          onPageChange={handlePageChange}
          onSelect={handleSelect}
          isLoading={isSearching}
        />
      </div>
    </div>
  )
}
