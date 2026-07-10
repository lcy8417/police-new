import { useMemo } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useMutation, useQuery } from "@tanstack/react-query"
import { ImageOff, Radar, ScanSearch, Target } from "lucide-react"

import { saveCrimeHistory, useCrimeStore } from "@/entities/crime"
import {
  PartialPatternsCompare,
  type PatternCompareGroup,
} from "@/features/crime-search"
import { usePageHeader } from "@/widgets/app-shell"
import { Button } from "@/shared/ui/button"
import { DotGrid, GlowOrb } from "@/shared/ui/glow-fx"
import { TechCorners } from "@/shared/ui/tech-corners"
import { cn } from "@/shared/lib/utils"
import { fetchCurrentShoes } from "@/services/crud"
import { fetchSimilarity } from "@/services/api"
import { toPatternPaths } from "@/utils/path-utils"

import { searchDetailPath } from "../model/search-paths"

const url = import.meta.env.VITE_API_URL

/** 유사도 응답의 어텐션 맵 2종(현장 질의맵 / DB 참조맵). */
interface SimilarityResult {
  query_attn_map?: string | null
  ref_attn_map?: string | null
}

/**
 * 결과상세 이미지 3종 URL을 조립하는 페이지 로컬 헬퍼(services 미수정, Phase 5).
 * 어텐션 맵이 유사도 근거이므로 있으면 우선 사용하고, 없으면 정적 신발 이미지로
 * 폴백한다. 레거시 `ResultDetailMain`의 URL 규약을 그대로 옮겼다.
 *  - 질의 어텐션: `query_attn_map`(없으면 현장 이미지)
 *  - 바닥 어텐션: `ref_attn_map`(없으면 `shoes_images/B/<모델>.png`)
 *  - 측면: 정적 `shoes_images/S/<모델>.png`
 */
function buildDetailImages(
  modelNumber: string,
  attns: SimilarityResult | undefined,
  sceneImage: string | null | undefined
) {
  return {
    query: attns?.query_attn_map || sceneImage || null,
    bottom: attns?.ref_attn_map || `${url}/shoes_images/B/${modelNumber}.png`,
    side: `${url}/shoes_images/S/${modelNumber}.png`,
  }
}

interface AttentionTileProps {
  /** 영문 대문자 증거 코드(예: SCENE-ATTN, SOLE-B, SOLE-S). */
  code: string
  label: string
  image: string | null
  /** 어텐션 히트맵(유사도 근거)이면 파란 글로우로 강조한다. */
  emphasis?: boolean
}

/**
 * 표시 전용 이미지 타일. 어텐션 히트맵은 유사도 판단의 근거라 `emphasis`로
 * 파란 테두리·글로우를 입혀 시각적으로 강조하고, 정적 측면 사진은 절제한 톤으로
 * 둔다. 이미지가 없으면 안내 문구를 보인다.
 */
function AttentionTile({ code, label, image, emphasis = false }: AttentionTileProps) {
  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-[#0F1826]",
        emphasis
          ? "border-[#3B82F6]/40 shadow-[0_0_22px_rgba(37,99,235,0.18)]"
          : "border-[#1E2A3C]"
      )}
    >
      <div className="flex items-center justify-between border-b border-[#141D2C] bg-[#0D1420]/60 px-3 py-2">
        <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#C7CEDB]">
          {emphasis && (
            <Radar className="size-3.5 text-[#4A9EFF]" aria-hidden="true" />
          )}
          {label}
        </span>
        <span
          className={cn(
            "rounded border px-1.5 py-0.5 font-mono text-[9px] tracking-wide uppercase",
            emphasis
              ? "border-[#3B82F6]/50 bg-[#152238] text-[#4A9EFF]"
              : "border-[#1E2A3C] bg-[#0F1826] text-[#8A93A6]"
          )}
        >
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

interface InfoFieldProps {
  label: string
  value: string | number | null | undefined
}

/** 사건정보 한 항목(라벨 + 값). 값이 없으면 표시하지 않는다. */
function InfoField({ label, value }: InfoFieldProps) {
  if (value === null || value === undefined || value === "") return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[10px] tracking-wide text-[#5B6B85] uppercase">
        {label}
      </span>
      <span className="text-[13px] font-semibold text-[#C7CEDB]">{value}</span>
    </div>
  )
}

// 제목은 정적 — 헤더 effect가 매 렌더 재실행되지 않도록 한 번만 생성한다.
const HEADER_TITLE = (
  <div className="flex flex-col justify-center gap-1">
    <span className="text-[28px] leading-none font-bold text-white">
      검색 결과 상세
    </span>
    <span className="text-[13px] leading-none font-normal text-[#8A93A6]">
      어텐션 맵과 현장·DB 문양으로 매칭 근거를 확인하고 이력을 저장합니다.
    </span>
  </div>
)

/**
 * 커맨드 센터 `/search/:crimeNumber/shoesResult/detail/:modelNumber`. 레거시
 * `ShoesResultDetail`(useEffect + 로컬 state + `fetchHistorySave`)을 TanStack
 * `useQuery`(신발 상세 + 유사도 어텐션 맵) + `useMutation`(이력 저장)으로 옮겼다.
 * 어텐션 맵을 유사도 근거로 강조하고, 문양 비교는 공용 `PartialPatternsCompare`를
 * 재사용한다. 저장 규약(payload)은 레거시 `fetchHistorySave`와 동등하게 유지한다.
 */
export function ResultDetailPage() {
  const { modelNumber = "", crimeNumber = "" } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const ranking = searchParams.get("ranking")

  // Context 브리지 대신 store 셀렉터로 현장 데이터에 접근한다.
  const crimeData = useCrimeStore((s) => s.crimeData)
  const currentCrimeData = crimeData.find(
    (item) => String(item.crimeNumber) === String(crimeNumber)
  )

  // 신발 상세 + 유사도 어텐션 맵을 한 쿼리로 병렬 로드한다. DB 신발 문양은
  // `toPatternPaths`로 전체 경로로 hydrate한다.
  const detailQuery = useQuery({
    queryKey: ["crimeSearch", "detail", crimeNumber, modelNumber],
    queryFn: async () => {
      const [shoesInfo, attns] = await Promise.all([
        fetchCurrentShoes(modelNumber),
        fetchSimilarity({ crimeNumber, modelNumber }) as Promise<SimilarityResult>,
      ])

      const shoesData = {
        ...shoesInfo,
        top: toPatternPaths(shoesInfo.top) || [],
        mid: toPatternPaths(shoesInfo.mid) || [],
        bottom: toPatternPaths(shoesInfo.bottom) || [],
        outline: toPatternPaths(shoesInfo.outline) || [],
      }

      return { shoesData, attns }
    },
    enabled: Boolean(modelNumber && crimeNumber),
  })

  const shoesData = detailQuery.data?.shoesData
  const images = buildDetailImages(
    modelNumber,
    detailQuery.data?.attns,
    currentCrimeData?.image
  )

  // 현장패턴 vs DB패턴 비교 묶음. 로드 전에는 빈 묶음으로 안전하게 렌더한다.
  const patternItems = useMemo<PatternCompareGroup[]>(
    () => [
      {
        title: "현장패턴",
        top: currentCrimeData?.top || [],
        mid: currentCrimeData?.mid || [],
        bottom: currentCrimeData?.bottom || [],
        outline: currentCrimeData?.outline || [],
      },
      {
        title: "DB패턴",
        top: shoesData?.top || [],
        mid: shoesData?.mid || [],
        bottom: shoesData?.bottom || [],
        outline: shoesData?.outline || [],
      },
    ],
    [currentCrimeData, shoesData]
  )

  // 이력 저장. 레거시 `fetchHistorySave`와 동등한 payload를 쓰는 entities
  // `saveCrimeHistory`로 승격했다. 성공 토스트는 query-client의 meta.success가 낸다.
  const saveMutation = useMutation({
    mutationFn: saveCrimeHistory,
    meta: { success: "신발 정보가 저장되었습니다." },
    onSuccess: () => {
      navigate(searchDetailPath(crimeNumber))
    },
  })

  // 발견=ranking+modelNumber 포함, 불발견=미포함(레거시 규약 동일). currentCrimeData가
  // 없으면 버튼을 막으므로 저장 시점에는 항상 존재한다.
  const saveHistory = (discovered: boolean) => {
    if (!currentCrimeData) return
    saveMutation.mutate({
      crimeNumber,
      currentCrimeData: {
        ...currentCrimeData,
        crimeNumber: currentCrimeData.crimeNumber ?? crimeNumber,
      },
      ...(discovered ? { ranking, modelNumber } : {}),
    })
  }

  const headerActions = useMemo(
    () => (
      <>
        <Button
          type="button"
          size="sm"
          onClick={() => navigate(-1)}
          className="border border-[#1E2A3C] bg-[#0F1826] text-[#C7CEDB] hover:border-[#3B82F6]/50 hover:bg-[#141F30] hover:text-white"
        >
          <ScanSearch className="size-4" aria-hidden="true" />
          검색결과로
        </Button>
        {ranking && (
          <span className="flex items-center gap-1.5 rounded-md border border-[#3B82F6]/50 bg-[#152238] px-3 py-1.5 font-mono text-[13px] font-semibold text-[#4A9EFF] shadow-[0_0_14px_rgba(37,99,235,0.3)]">
            <Target className="size-3.5" aria-hidden="true" />
            매칭 후보 [{ranking}위]
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

      {/* 상단: 어텐션 맵 + 문양 비교(2열) / 하단: 사건정보 + 저장 액션 */}
      <div className="relative grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-6">
        <div className="grid min-h-0 grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 어텐션 맵 패널(표시 전용, 히트맵 강조) */}
          <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
            <TechCorners size={22} />
            <div className="flex items-center justify-between border-b border-[#141D2C] bg-[#0D1420]/60 px-6 py-3.5">
              <span className="flex items-center gap-2 text-[15px] font-semibold text-[#E5E9F0]">
                <Radar className="size-4 text-[#4A9EFF]" aria-hidden="true" />
                어텐션 맵
              </span>
              <span className="font-mono text-[11px] tracking-[0.14em] text-[#5B6B85] uppercase">
                Similarity · Evidence
              </span>
            </div>
            <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1.35fr)_minmax(0,1fr)] gap-4 p-5">
              {/* 질의/참조 어텐션 히트맵 쌍 — 유사도 근거라 나란히 강조한다. */}
              <div className="grid min-h-0 grid-cols-2 gap-4">
                <AttentionTile
                  code="SCENE-ATTN"
                  label="질의 어텐션"
                  image={images.query}
                  emphasis
                />
                <AttentionTile
                  code="SOLE-B"
                  label="바닥 어텐션"
                  image={images.bottom}
                  emphasis
                />
              </div>
              {/* 측면 신발 사진(정적) — 참고용, 절제된 톤. */}
              <AttentionTile code="SOLE-S" label="측면 이미지" image={images.side} />
            </div>
          </section>

          {/* 현장패턴 vs DB패턴 문양 비교 */}
          <PartialPatternsCompare patternItems={patternItems} className="h-full" />
        </div>

        {/* 사건정보 + 발견/불발견 저장 액션 */}
        <section className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] px-6 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)] lg:flex-row lg:items-center lg:justify-between">
          <TechCorners size={20} />
          <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
            <InfoField label="사건등록번호" value={currentCrimeData?.crimeNumber ?? crimeNumber} />
            <InfoField label="모델 번호" value={modelNumber} />
            <InfoField label="이미지 번호" value={currentCrimeData?.imageNumber} />
            <InfoField label="사건 이름" value={currentCrimeData?.crimeName} />
            <InfoField label="채취 일시" value={currentCrimeData?.findTime} />
            <InfoField label="의뢰관서" value={currentCrimeData?.requestOffice} />
            <InfoField label="발견 방법" value={currentCrimeData?.findMethod} />
            <InfoField label="진행상태" value={currentCrimeData?.state} />
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Button
              type="button"
              onClick={() => saveHistory(false)}
              disabled={!currentCrimeData || saveMutation.isPending}
              className="border border-[#1E2A3C] bg-[#0F1826] text-[#C7CEDB] hover:border-[#3B82F6]/50 hover:bg-[#141F30] hover:text-white"
            >
              불발견
            </Button>
            <Button
              type="button"
              onClick={() => saveHistory(true)}
              disabled={!currentCrimeData || saveMutation.isPending}
              className="border border-[#3B82F6]/50 bg-[#152238] text-[#4A9EFF] shadow-[0_0_14px_rgba(37,99,235,0.3)] hover:bg-[#182b45]"
            >
              <Target className="size-4" aria-hidden="true" />
              발견
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
