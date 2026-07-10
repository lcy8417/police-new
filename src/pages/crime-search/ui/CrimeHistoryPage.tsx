import { useMemo, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, ImageOff, Target } from "lucide-react"

import { crimeKeys } from "@/entities/crime"
import {
  PartialPatternsCompare,
  RetrievalResultsGrid,
  type PatternCompareGroup,
  type RetrievalResultItem,
} from "@/features/crime-search"
import { usePageHeader } from "@/widgets/app-shell"
import { Button } from "@/shared/ui/button"
import { DotGrid, GlowOrb } from "@/shared/ui/glow-fx"
import { TechCorners } from "@/shared/ui/tech-corners"
import { fetchHistoryData, fetchCurrentShoes } from "@/services/crud"
import { imageSearch } from "@/services/api"
import { toPatternPaths } from "@/utils/path-utils"

const url = import.meta.env.VITE_API_URL

/** 사건이력 화면의 페이지네이션 기준(레거시 `RetrievalResults`의 50과 동일). */
const HISTORY_PAGE_SIZE = 50

/**
 * 사건이력 이미지 4분할(현장/편집/바닥/측면) URL을 조립하는 페이지 로컬 헬퍼.
 * 레거시 `CrimeHistoryMain`의 URL 규약을 그대로 옮겼다(services 리팩터는 Phase 5).
 * `matchingShoes`가 없으면 해당 신발 이미지는 null(플레이스홀더 표시).
 * 측면 이미지는 레거시의 `B`→`S` 치환 트릭을 유지한다.
 */
function buildHistoryImages(historyData: {
  editImage?: string | null
  matchingShoes?: string | null
} | undefined) {
  const matchingShoes = historyData?.matchingShoes ?? null
  return {
    edit: historyData?.editImage || null,
    bottom: matchingShoes ? `${url}/shoes_images/B/${matchingShoes}.png` : null,
    side: matchingShoes
      ? `${url}/shoes_images/S/${matchingShoes.replace("B", "S")}.png`
      : null,
  }
}

interface ImageTileProps {
  /** 4분할 내 순번(1~4) — 좌상단 증거 번호 태그로 표시된다. */
  index: number
  /** 영문 대문자 증거 코드(예: SCENE, EDIT, SOLE-B, SOLE-S). */
  code: string
  label: string
  image: string | null
}

/**
 * 표시 전용 이미지 타일(업로드/에디터 없음). 반복되던 "Read-Only" 라벨 대신
 * 타일별 증거 번호(01~04)와 코드(SCENE/EDIT/SOLE-B/SOLE-S)를 태그로 달아 4분할
 * 전체가 하나의 증거 세트처럼 읽히게 한다. 이미지가 없으면 안내 문구를 보인다.
 */
function ImageTile({ index, code, label, image }: ImageTileProps) {
  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[#1E2A3C] bg-[#0F1826]">
      <div className="flex items-center justify-between border-b border-[#141D2C] bg-[#0D1420]/60 px-3 py-2">
        <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#C7CEDB]">
          <span className="rounded border border-[#1E2A3C] bg-[#05080D] px-1 font-mono text-[9px] tabular-nums text-[#5B6B85]">
            {String(index).padStart(2, "0")}
          </span>
          {label}
        </span>
        <span className="rounded border border-[#1E2A3C] bg-[#0F1826] px-1.5 py-0.5 font-mono text-[9px] tracking-wide text-[#8A93A6] uppercase">
          {code}
        </span>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#05080D]">
        {image ? (
          <img
            src={image}
            alt={label}
            className="absolute inset-0 size-full object-contain p-3"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-[#5B6B85]">
            <ImageOff className="size-6" aria-hidden="true" />
            <span className="text-[11px] font-medium">이미지 없음</span>
          </div>
        )}
      </div>
    </div>
  )
}

// 제목은 정적 — 헤더 effect가 매 렌더 재실행되지 않도록 한 번만 생성한다.
const HEADER_TITLE = (
  <div className="flex flex-col justify-center gap-1">
    <span className="text-[28px] leading-none font-bold text-white">사건 이력</span>
    <span className="text-[13px] leading-none font-normal text-[#8A93A6]">
      저장된 매칭 이력의 현장·DB 문양과 검색 결과를 확인합니다.
    </span>
  </div>
)

/**
 * 커맨드 센터 `/search/:crimeNumber/crimeHistory/:historyId`. 레거시
 * `CrimeHistoryMain`(useEffect 2개 + 로컬 state)을 TanStack `useQuery` 두 개로
 * 옮겼다: (1) 이력 상세 + 매칭 신발을 로드해 현장/DB 문양을 구성하고,
 * (2) 과거 검색결과(현재는 더미)를 페이지 단위로 조회한다. 읽기 전용 화면이라
 * 이미지 4분할은 표시 전용 타일로 렌더한다.
 */
export function CrimeHistoryPage() {
  const { crimeNumber = "", historyId = "" } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const ranking = searchParams.get("ranking")

  // 검색결과 페이지는 이 화면이 소유한다(레거시 로컬 state와 동일한 규약).
  const [page, setPage] = useState(0)

  // 1단계: 이력 상세 + 매칭 신발을 로드해 현장/DB 문양 묶음을 구성한다.
  const historyQuery = useQuery({
    queryKey: crimeKeys.history(crimeNumber, historyId),
    queryFn: async () => {
      const historyData = await fetchHistoryData(historyId)

      // 매칭 신발이 있을 때만 DB 신발 문양을 로드한다(없으면 빈 묶음).
      let shoesData = { top: [], mid: [], bottom: [], outline: [] }
      if (historyData?.matchingShoes) {
        const shoesInfo = await fetchCurrentShoes(historyData.matchingShoes)
        shoesData = {
          ...shoesInfo,
          top: toPatternPaths(shoesInfo.top) || [],
          mid: toPatternPaths(shoesInfo.mid) || [],
          bottom: toPatternPaths(shoesInfo.bottom) || [],
          outline: toPatternPaths(shoesInfo.outline) || [],
        }
      }

      return { historyData, shoesData }
    },
    enabled: Boolean(historyId),
  })

  const historyData = historyQuery.data?.historyData
  const shoesData = historyQuery.data?.shoesData

  // 2단계: 과거 검색결과 조회.
  // TODO: 실제 검색 결과로 연동 필요 (별도 티켓) — 현재는 crimeNumber를 그대로
  // body.image에 실어 보내는 더미 요청이며, 동작을 바꾸지 않고 그대로 이관했다.
  const searchQuery = useQuery({
    queryKey: ["crimeHistory", "search", crimeNumber, page],
    queryFn: () =>
      imageSearch({ crimeNumber, body: { image: crimeNumber }, page }),
    enabled: Boolean(crimeNumber),
  })

  const results = (searchQuery.data?.result ?? []) as RetrievalResultItem[]
  const totalCount = searchQuery.data?.total ?? 0

  // 현장패턴 vs DB패턴 비교 묶음. 이력 로드 전에는 빈 묶음으로 안전하게 렌더한다.
  const currentPatterns = useMemo<PatternCompareGroup[]>(
    () => [
      {
        title: "현장패턴",
        top: historyData?.top || [],
        mid: historyData?.mid || [],
        bottom: historyData?.bottom || [],
        outline: historyData?.outline || [],
      },
      {
        title: "DB패턴",
        top: shoesData?.top || [],
        mid: shoesData?.mid || [],
        bottom: shoesData?.bottom || [],
        outline: shoesData?.outline || [],
      },
    ],
    [historyData, shoesData]
  )

  // 이미지 4분할 URL 조립(현장은 crimeNumber 기반 정적 URL).
  const images = buildHistoryImages(historyData)
  const sceneImage = `${url}/crime_images/${crimeNumber}.png`

  const headerActions = useMemo(
    () => (
      <>
        <Button
          type="button"
          size="sm"
          onClick={() => navigate(-1)}
          className="border border-[#1E2A3C] bg-[#0F1826] text-[#C7CEDB] hover:border-[#3B82F6]/50 hover:bg-[#141F30] hover:text-white"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          뒤로가기
        </Button>
        {ranking && (
          <span className="flex items-center gap-1.5 rounded-md border border-[#3B82F6]/50 bg-[#152238] px-3 py-1.5 font-mono text-[13px] font-semibold text-[#4A9EFF] shadow-[0_0_14px_rgba(37,99,235,0.3)]">
            <Target className="size-3.5" aria-hidden="true" />
            발견 [{ranking}위]
          </span>
        )}
      </>
    ),
    [navigate, ranking]
  )

  usePageHeader({ title: HEADER_TITLE, actions: headerActions })

  return (
    <div className="relative h-[calc(100vh-110px)] w-full overflow-hidden bg-background px-6 py-6">
      <DotGrid />
      <GlowOrb className="-top-24 right-1/4 h-72 w-72 bg-[#2563EB]/10" />
      <GlowOrb className="bottom-0 left-1/3 h-64 w-64 bg-[#4A9EFF]/8" />

      {/* 3블록을 뷰포트 높이에 맞춰 2행으로 배분한다: 증거·문양(1행) / 검색결과(2행,
          비중 큼) — ShoesResultPage와 같은 "페이지는 고정, 패널 내부만 스크롤" 규약. */}
      <div className="relative grid h-full min-h-0 grid-rows-[minmax(0,1fr)_minmax(0,1.2fr)] gap-6">
        <div className="grid min-h-0 grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 증거 이미지 4분할(표시 전용) */}
          <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
            <TechCorners size={22} />
            <div className="flex items-center justify-between border-b border-[#141D2C] bg-[#0D1420]/60 px-6 py-3.5">
              <span className="text-[15px] font-semibold text-[#E5E9F0]">증거 이미지</span>
              <span className="font-mono text-[11px] tracking-[0.14em] text-[#5B6B85] uppercase">
                Evidence · 4-View
              </span>
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-4 p-5">
              <ImageTile index={1} code="SCENE" label="현장이미지" image={sceneImage} />
              <ImageTile index={2} code="EDIT" label="편집이미지" image={images.edit} />
              <ImageTile index={3} code="SOLE-B" label="바닥이미지" image={images.bottom} />
              <ImageTile index={4} code="SOLE-S" label="측면이미지" image={images.side} />
            </div>
          </section>

          {/* 현장패턴 vs DB패턴 문양 비교 — 좌측 패널과 같은 행 높이를 그대로 채운다. */}
          <PartialPatternsCompare patternItems={currentPatterns} className="h-full" />
        </div>

        {/* 과거 검색결과(비클릭 재사용) */}
        <div className="min-h-0">
          <RetrievalResultsGrid
            results={results}
            totalCount={totalCount}
            page={page}
            pageSize={HISTORY_PAGE_SIZE}
            onPageChange={setPage}
            isLoading={searchQuery.isFetching}
          />
        </div>
      </div>
    </div>
  )
}
