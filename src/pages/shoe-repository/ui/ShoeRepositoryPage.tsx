import { useCallback, useMemo, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  fetchShoeDetail,
  fetchShoesCount,
  fetchShoesList,
  shoeKeys,
  SHOES_PAGE_SIZE,
  type Shoe,
  type ShoePattern,
} from "@/entities/shoe"
import { insertPatternPath } from "@/entities/pattern"
import { ShoeWorkbench } from "@/widgets/shoe-workbench"
import { usePageHeader } from "@/widgets/app-shell"
import { DotGrid, GlowOrb } from "@/shared/ui/glow-fx"
import { ShoeList } from "@/features/shoe-repository/ui/ShoeList"

import {
  shoeEditModePath,
  shoeRegisterNewPath,
  shoeRepositoryPath,
} from "../model/shoe-paths"

/**
 * 신발 밑창 문양 zone 하나를 전체 경로로 hydrate한다. 서버는 패턴 이름만 주므로
 * `insertPatternPath`로 여기서 경로를 붙인다(신발 패턴은 문자열 분기 그대로 반환).
 */
function hydrateZone(zone: ShoePattern[] = []): ShoePattern[] {
  return zone.map((entry) => insertPatternPath(entry) as ShoePattern)
}

/** 신발의 4부위 문양을 모두 hydrate한 사본을 만든다(편집 시드용). */
function hydrateShoe(shoe: Shoe): Shoe {
  return {
    ...shoe,
    top: hydrateZone(shoe.top),
    mid: hydrateZone(shoe.mid),
    bottom: hydrateZone(shoe.bottom),
    outline: hydrateZone(shoe.outline),
  }
}

/**
 * 통합 커맨드센터 `/shoesRepository`. 신발 **신규 등록 / 기존 편집**을 한 라우트로
 * 묶은 화면이다. 4번째 열의 탭([새 신발]/[기존 신발 목록])으로 두 국면을 전환한다:
 *  - `?mode=new`               → 신규 등록 워크벤치(정보 폼 인라인, POST)
 *  - `:modelNumber`(mode=edit) → 기존 신발 편집(문양 편집 + 목록). 목록의 선택 행을
 *    한 번 더 클릭하면 우측 Sheet에서 기본정보 편집 + 저장(PUT).
 *  - `/shoesRepository`(무선택) → 기존 신발 목록 브라우즈(신발을 고르면 편집).
 *
 * 신발 목록은 서버 페이징(페이지당 50개)으로 가져오고, 전체 건수는 count 엔드포인트로
 * 조회한다. 편집 대상은 개별 상세(`fetchShoeDetail`)로 가져오며, 밑창 문양은 서버가
 * 이름만 주므로 이 페이지에서 경로를 hydrate해 편집 시드로 넘긴다.
 */
export function ShoeRepositoryPage() {
  const { modelNumber = "" } = useParams()
  const [searchParams] = useSearchParams()
  const isNew = searchParams.get("mode") === "new"
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  // 기본정보 Sheet 개폐 — 목록의 선택된 행을 한 번 더 클릭하면 연다.
  const [infoSheetOpen, setInfoSheetOpen] = useState(false)

  // 현재 페이지 상태(서버 페이징). 목록은 페이지당 50개만 가져오고, 전체 건수는 별도
  // count 엔드포인트로 조회한다(예전엔 전체 페이지를 순회 집계해 서버 페이징을 무력화했다).
  const [page, setPage] = useState(0)

  const countQuery = useQuery({
    queryKey: shoeKeys.count(),
    queryFn: fetchShoesCount,
  })
  const total = countQuery.data ?? 0
  const totalPages = Math.max(1, Math.ceil(total / SHOES_PAGE_SIZE))
  // 건수가 줄어(삭제 등) 현재 페이지가 범위를 벗어나도 안전하게 clamp한다.
  const safePage = Math.min(page, totalPages - 1)

  const shoesQuery = useQuery({
    queryKey: shoeKeys.list(safePage),
    queryFn: () => fetchShoesList(safePage),
    // 페이지 이동 시 이전 페이지 데이터를 유지해 깜빡임을 줄인다.
    placeholderData: keepPreviousData,
  })
  const pageShoes = useMemo(() => shoesQuery.data ?? [], [shoesQuery.data])

  // 편집 대상 신발 — 서버 페이징이라 전체 목록이 없으므로 개별 상세로 조회한다.
  // 이미 캐시된 목록 페이지에 있으면 placeholderData로 즉시 시드(행 클릭 시 무플리커),
  // 없으면(콜드 진입) 상세를 새로 가져온다. 문양 경로 hydrate는 아래 useMemo에서.
  const detailQuery = useQuery({
    queryKey: shoeKeys.detail(modelNumber),
    queryFn: () => fetchShoeDetail(modelNumber),
    enabled: !isNew && !!modelNumber,
    placeholderData: () => {
      const cachedPages = queryClient.getQueriesData<Shoe[]>({
        queryKey: ["shoes", "list"],
      })
      for (const [, data] of cachedPages) {
        const hit = data?.find(
          (item) => String(item.modelNumber) === String(modelNumber)
        )
        if (hit) return hit
      }
      return undefined
    },
  })
  const currentShoe = useMemo<Shoe | undefined>(
    () => (detailQuery.data ? hydrateShoe(detailQuery.data) : undefined),
    [detailQuery.data]
  )

  // 저장(등록/수정) 성공 → Sheet 닫고 목록 캐시 무효화 후 해당 신발 편집으로.
  const handleSaved = useCallback(
    (savedModelNumber: string) => {
      setInfoSheetOpen(false)
      queryClient.invalidateQueries({ queryKey: ["shoes"] })
      navigate(
        savedModelNumber
          ? shoeEditModePath(savedModelNumber)
          : shoeRepositoryPath()
      )
    },
    [queryClient, navigate]
  )

  // 목록 행 클릭: 이미 선택된 행이면 기본정보 Sheet를 열고, 아니면 그 신발 편집으로.
  const handleListSelect = useCallback(
    (value: string) => {
      if (!isNew && value === modelNumber) {
        setInfoSheetOpen(true)
        return
      }
      setInfoSheetOpen(false)
      navigate(shoeEditModePath(value))
    },
    [isNew, modelNumber, navigate]
  )

  const headerTitle = useMemo(() => {
    const [title, subtitle] = isNew
      ? ["신규 신발 등록", "신발 이미지를 등록하고 밑창 문양을 추출·입력하세요."]
      : modelNumber
        ? [
            `신발 편집 · ${modelNumber}`,
            "밑창 문양을 편집하고, 목록의 선택 행을 다시 누르면 기본정보를 편집합니다.",
          ]
        : ["신발", "등록된 신발을 조회·편집하거나 새 신발을 등록합니다."]
    return (
      <div className="flex flex-col justify-center gap-1">
        <span className="text-[28px] leading-none font-bold text-white">
          {title}
        </span>
        <span className="text-[13px] leading-none font-normal text-[#8A93A6]">
          {subtitle}
        </span>
      </div>
    )
  }, [isNew, modelNumber])

  usePageHeader({ title: headerTitle })

  const shoeListPanel = (
    <ShoeList
      shoes={pageShoes}
      total={total}
      page={safePage}
      totalPages={totalPages}
      selectedModelNumber={modelNumber}
      isLoading={shoesQuery.isFetching}
      onSelect={handleListSelect}
      onPageChange={setPage}
    />
  )

  // 국면 → 워크벤치. 신규=빈 등록, 그 외=기존 편집(신발 미선택이면 목록 브라우즈).
  const workbenchMode = isNew ? "new" : "edit"
  const initialShoe = isNew ? undefined : currentShoe
  // 모드/신발 전환 시 리마운트해 formData·lineState·uploadedRef 잔상을 없앤다.
  // 추가로 currentShoe 로드 여부를 key에 실어, 상세가 도착하면 워크벤치를 remount해
  // initialShoe를 seed한다(ShoeWorkbench는 마운트 시점 lazy state로만 시드하므로,
  // 콜드 진입 시 상세가 늦게 와도 빈 폼에 갇히지 않는다).
  const workbenchKey = isNew
    ? "new"
    : currentShoe
      ? `${modelNumber}-edit`
      : `${modelNumber || "none"}-loading`

  return (
    <div className="relative h-[calc(100vh-110px)] w-full overflow-hidden bg-background px-6 py-6">
      <DotGrid />
      <GlowOrb className="-top-24 right-1/4 h-72 w-72 bg-[#2563EB]/10" />
      <GlowOrb className="bottom-0 left-1/3 h-64 w-64 bg-[#4A9EFF]/8" />

      {/* 4열 커맨드센터: 캔버스 · 문양정보 · 문양리스트 + 탭([새 신발]/[기존 신발 목록]) */}
      <ShoeWorkbench
        key={workbenchKey}
        mode={workbenchMode}
        initialShoe={initialShoe}
        onSaved={handleSaved}
        onNewRegister={() => navigate(shoeRegisterNewPath())}
        onBrowseList={() => navigate(shoeRepositoryPath())}
        listPanel={shoeListPanel}
        infoSheetOpen={infoSheetOpen}
        onInfoSheetOpenChange={setInfoSheetOpen}
      />
    </div>
  )
}
