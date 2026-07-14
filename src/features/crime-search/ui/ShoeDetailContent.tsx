import { useEffect, useMemo } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  ArrowLeftRight,
  Award,
  Camera,
  Database,
  Footprints,
  ImageOff,
  Loader2,
  Radar,
  ShieldCheck,
  Target,
  XCircle,
  type LucideIcon,
} from "lucide-react"

import { saveCrimeHistory, useCrimeStore } from "@/entities/crime"
import { Button } from "@/shared/ui/button"
import { DotGrid, GlowOrb } from "@/shared/ui/glow-fx"
import { TechCorners } from "@/shared/ui/tech-corners"
import { cn } from "@/shared/lib/utils"
import { fetchCurrentShoes } from "@/services/crud"
import { fetchSimilarity } from "@/services/api"
import { toPatternPaths } from "@/utils/path-utils"

import { PartialPatternsCompare, type PatternCompareGroup } from "./PartialPatternsCompare"

const url = import.meta.env.VITE_API_URL

/** 유사도 응답의 어텐션 맵 2종(현장 질의맵 / DB 참조맵). */
interface SimilarityResult {
  query_attn_map?: string | null
  ref_attn_map?: string | null
}

/**
 * 결과상세 이미지 3종 URL을 조립하는 로컬 헬퍼(services 미수정).
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
  /** 라벨 아이콘 — 출처(현장=Camera, DB=Database)를 구분한다. 없으면 emphasis일 때 Radar로 대체. */
  icon?: LucideIcon
}

/**
 * 표시 전용 이미지 타일. 어텐션 히트맵은 유사도 판단의 근거라 `emphasis`로
 * 파란 테두리·글로우를 입혀 시각적으로 강조하고, 정적 측면 사진은 절제한 톤으로
 * 둔다. 이미지가 없으면 안내 문구를 보인다.
 */
function AttentionTile({ code, label, image, emphasis = false, icon }: AttentionTileProps) {
  const Icon = icon ?? (emphasis ? Radar : null)
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
          {Icon && <Icon className="size-3.5 text-[#4A9EFF]" aria-hidden="true" />}
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

/**
 * 어텐션 맵 패널 내부의 소구획 라벨(가는 룰 + 중앙 텍스트). 질의·참조 쌍과
 * 정적 참고 이미지 사이의 시각적 위계를 텍스트로도 명시한다.
 */
function SectionRule({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-0.5" aria-hidden="true">
      <span className="h-px flex-1 bg-[#1E2A3C]" />
      <span className="shrink-0 font-mono text-[9px] tracking-[0.16em] text-[#5B6B85] uppercase">
        {label}
      </span>
      <span className="h-px flex-1 bg-[#1E2A3C]" />
    </div>
  )
}

/**
 * 질의 어텐션 ↔ 바닥 어텐션 타일 사이의 대응 관계를 표시하는 연결 배지.
 * 두 히트맵이 같은 유사도 산정의 짝이라는 것을 시각적으로 잇는다.
 */
function PairConnector() {
  return (
    <div className="relative hidden w-8 shrink-0 sm:block" aria-hidden="true">
      <div className="absolute inset-y-6 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#3B82F6]/50 to-transparent" />
      <span className="absolute top-1/2 left-1/2 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#3B82F6]/50 bg-[#152238] text-[#4A9EFF] shadow-[0_0_10px_rgba(37,99,235,0.4)]">
        <ArrowLeftRight className="size-3" aria-hidden="true" />
      </span>
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

export interface ShoeDetailContentProps {
  crimeNumber: string
  modelNumber: string
  /** 유사도 순위(1-based). 헤더 뱃지·저장 payload에 쓰인다. */
  ranking?: string | number | null
  /** 풀페이지(`page`) / 컴팩트 Sheet(`compact`) 표시 형태. */
  variant?: "page" | "compact"
  /** 이력 저장 성공 후 동작(page=navigate, compact=닫기+refetch). */
  onSaved?: () => void
  /** 저장 진행 상태 보고 — 컴팩트 Sheet가 저장 중 강제 닫기를 막는 데 쓴다. */
  onPendingChange?: (pending: boolean) => void
}

/**
 * 신발 검색 결과 상세 콘텐츠(데이터 로드 + 4섹션 렌더 + 이력 저장). 풀페이지
 * `ResultDetailPage`와 `/search` 우측 컴팩트 Sheet가 공유한다. 레거시
 * `ShoesResultDetail`(useEffect + 로컬 state + `fetchHistorySave`)을 TanStack
 * `useQuery`(신발 상세 + 유사도 어텐션 맵) + `useMutation`(이력 저장)으로 옮겼다.
 * 저장 규약(payload)은 레거시 `fetchHistorySave`와 동등하게 유지한다.
 */
export function ShoeDetailContent({
  crimeNumber,
  modelNumber,
  ranking = null,
  variant = "page",
  onSaved,
  onPendingChange,
}: ShoeDetailContentProps) {
  // 상위 3위는 검색결과 그리드의 TOP 뱃지와 같은 톤(그린 티어)으로 강조한다.
  const rankNum = ranking != null && ranking !== "" ? Number.parseInt(String(ranking), 10) : null
  const isTopRank = rankNum !== null && !Number.isNaN(rankNum) && rankNum <= 3

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
      onSaved?.()
    },
  })

  // 저장 진행 상태를 상위(컴팩트 Sheet)에 보고해 저장 중 강제 닫기를 막게 한다.
  useEffect(() => {
    onPendingChange?.(saveMutation.isPending)
  }, [saveMutation.isPending, onPendingChange])

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

  // 어텐션 히트맵 쌍(질의 ↔ 바닥) — 두 variant가 공유하는 시각 언어.
  const attentionPair = (
    <div className="grid min-h-0 grid-cols-[1fr_auto_1fr] gap-1">
      <AttentionTile
        code="SCENE-ATTN"
        label="질의 어텐션"
        image={images.query}
        emphasis
        icon={Camera}
      />
      <PairConnector />
      <AttentionTile
        code="SOLE-B"
        label="바닥 어텐션"
        image={images.bottom}
        emphasis
        icon={Database}
      />
    </div>
  )

  // 사건정보 8필드 — page(4열)와 compact(2열)가 그리드 열수만 다르다.
  const infoFields = (
    <>
      <InfoField label="사건등록번호" value={currentCrimeData?.crimeNumber ?? crimeNumber} />
      <InfoField label="모델 번호" value={modelNumber} />
      <InfoField label="이미지 번호" value={currentCrimeData?.imageNumber} />
      <InfoField label="사건 이름" value={currentCrimeData?.crimeName} />
      <InfoField label="채취 일시" value={currentCrimeData?.findTime} />
      <InfoField label="의뢰관서" value={currentCrimeData?.requestOffice} />
      <InfoField label="발견 방법" value={currentCrimeData?.findMethod} />
      <InfoField label="진행상태" value={currentCrimeData?.state} />
    </>
  )

  // 판정 버튼 쌍(불발견/발견) — 저장 중이면 스피너로 교체하고 비활성화한다.
  const verdictButtons = (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        onClick={() => saveHistory(false)}
        disabled={!currentCrimeData || saveMutation.isPending}
        className="border border-[#1E2A3C] bg-[#0F1826] text-[#8A93A6] hover:border-[#EF4444]/50 hover:bg-[#241212] hover:text-[#F87171]"
      >
        {saveMutation.isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <XCircle className="size-4" aria-hidden="true" />
        )}
        불발견
      </Button>
      <Button
        type="button"
        onClick={() => saveHistory(true)}
        disabled={!currentCrimeData || saveMutation.isPending}
        className="border border-[#3B82F6]/50 bg-[#152238] text-[#4A9EFF] shadow-[0_0_18px_rgba(37,99,235,0.35)] hover:bg-[#182b45]"
      >
        {saveMutation.isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Target className="size-4" aria-hidden="true" />
        )}
        발견
      </Button>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // 컴팩트 variant: 우측 Sheet 3층 구조(고정 헤더 / 본문 스크롤 / 고정 판정바).
  // SheetContent(p-0 flex flex-col)의 직접 자식으로 얹히도록 fragment로 반환한다.
  // ─────────────────────────────────────────────────────────────────────────
  if (variant === "compact") {
    return (
      <>
        {/* ① 고정 시각 헤더 — 모델번호 + ranking 뱃지. 자동 X버튼(top-4 right-4) 회피 pr-12. */}
        <div className="flex shrink-0 items-center gap-3 border-b border-[#141D2C] bg-[#0D1420]/60 px-4 py-3 pr-12">
          <span className="flex min-w-0 items-center gap-2 text-[15px] font-semibold text-[#E5E9F0]">
            <Footprints className="size-4 shrink-0 text-[#4A9EFF]" aria-hidden="true" />
            <span className="truncate">{modelNumber}</span>
          </span>
          {ranking != null && ranking !== "" && (
            <span
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[12px] font-semibold",
                isTopRank
                  ? "border-[#22C55E]/50 bg-[#12241A] text-[#4ADE80] shadow-[0_0_14px_rgba(34,197,94,0.35)]"
                  : "border-[#3B82F6]/50 bg-[#152238] text-[#4A9EFF] shadow-[0_0_14px_rgba(37,99,235,0.3)]"
              )}
            >
              {isTopRank ? (
                <Award className="size-3.5" aria-hidden="true" />
              ) : (
                <Target className="size-3.5" aria-hidden="true" />
              )}
              [{ranking}위]
            </span>
          )}
        </div>

        {/* ② 본문(스크롤) — 세로 스택: 어텐션 쌍 → 측면 → 문양비교 → 사건정보. */}
        <div className="relative flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          <TechCorners size={20} />

          <SectionRule label="질의 · 참조 쌍" />
          {/* 어텐션 쌍 — 스크롤 컨테이너 안에선 부모 높이가 없어 타일의 h-full이
              0으로 접힌다. 각 타일을 aspect-square로 감싸 고유 높이를 준다
              (page variant는 grid-rows가 높이를 잡아주므로 공유 attentionPair 사용). */}
          <div className="grid shrink-0 grid-cols-[1fr_auto_1fr] gap-1">
            <div className="aspect-square">
              <AttentionTile
                code="SCENE-ATTN"
                label="질의 어텐션"
                image={images.query}
                emphasis
                icon={Camera}
              />
            </div>
            <PairConnector />
            <div className="aspect-square">
              <AttentionTile
                code="SOLE-B"
                label="바닥 어텐션"
                image={images.bottom}
                emphasis
                icon={Database}
              />
            </div>
          </div>

          <SectionRule label="문양 비교" />
          {/* 스크롤 컨테이너 안이라 자연 높이면 내부 flex-1이 0으로 접혀 썸네일이
              사라진다 → 고정 높이를 줘 내부 자체 스크롤로 표시한다. */}
          <PartialPatternsCompare patternItems={patternItems} className="h-[440px] shrink-0" />

          <SectionRule label="사건 정보" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">{infoFields}</div>
        </div>

        {/* ③ 고정 판정바 — 하단 border-t. */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#141D2C] bg-[#0D1420]/60 px-4 py-3">
          <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-[0.14em] text-[#8A93A6] uppercase">
            <ShieldCheck className="size-3.5 text-[#4A9EFF]" aria-hidden="true" />
            판정 · 이력 저장
          </span>
          {verdictButtons}
        </div>
      </>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 페이지 variant: 기존 풀페이지 레이아웃(DotGrid/GlowOrb + 2열 상단 + 하단 정보/판정).
  // ─────────────────────────────────────────────────────────────────────────
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
            <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1.5fr)_auto_minmax(0,1fr)] gap-3 p-5">
              <SectionRule label="질의 · 참조 쌍" />
              {/* 질의/참조 어텐션 히트맵 쌍 — 유사도 근거라 커넥터로 대응 관계를 잇는다. */}
              {attentionPair}
              <SectionRule label="참고 이미지" />
              {/* 측면 신발 사진(정적) — 참고용, 절제된 톤. */}
              <AttentionTile code="SOLE-S" label="측면 이미지" image={images.side} />
            </div>
          </section>

          {/* 현장패턴 vs DB패턴 문양 비교 */}
          <PartialPatternsCompare patternItems={patternItems} className="h-full" />
        </div>

        {/* 사건정보 + 발견/불발견 저장 액션 */}
        <section className="relative flex flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
          <TechCorners size={20} />
          <div className="flex items-center justify-between border-b border-[#141D2C] bg-[#0D1420]/60 px-6 py-3.5">
            <span className="text-[15px] font-semibold text-[#E5E9F0]">사건 정보</span>
            <span className="font-mono text-[11px] tracking-[0.14em] text-[#5B6B85] uppercase">
              Case · Verdict
            </span>
          </div>
          <div className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
              {infoFields}
            </div>

            <div className="hidden h-16 w-px shrink-0 self-center bg-[#1E2A3C] lg:block" aria-hidden="true" />

            {/* 판정 존: 이 화면의 핵심 결정이라 라벨 + 명확한 긍정/부정 톤으로 감쌌다. */}
            <div className="flex shrink-0 flex-col gap-2">
              <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-[0.14em] text-[#8A93A6] uppercase">
                <ShieldCheck className="size-3.5 text-[#4A9EFF]" aria-hidden="true" />
                판정 · 이력 저장
              </span>
              {verdictButtons}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
