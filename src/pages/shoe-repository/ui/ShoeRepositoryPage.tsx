import { useCallback, useMemo, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { fetchAllShoes, type Shoe, type ShoePattern } from "@/entities/shoe"
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

/** 전체 신발 목록 쿼리 키(모든 페이지 집계 — 총 건수·전체 브라우징용). */
const ALL_SHOES_KEY = ["shoes", "all"] as const

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
 * 신발 목록은 총 개수를 위해 모든 페이지를 집계(`fetchAllShoes`)한다. 밑창 문양은
 * 서버가 이름만 주므로 이 페이지에서 경로를 hydrate해 편집 시드로 넘긴다.
 */
export function ShoeRepositoryPage() {
  const { modelNumber = "" } = useParams()
  const [searchParams] = useSearchParams()
  const isNew = searchParams.get("mode") === "new"
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  // 기본정보 Sheet 개폐 — 목록의 선택된 행을 한 번 더 클릭하면 연다.
  const [infoSheetOpen, setInfoSheetOpen] = useState(false)

  const shoesQuery = useQuery({
    queryKey: ALL_SHOES_KEY,
    queryFn: fetchAllShoes,
  })
  const shoes = useMemo(() => shoesQuery.data ?? [], [shoesQuery.data])

  // 편집 대상 신발(전체 목록에서 매칭 후 문양 hydrate).
  const currentShoe = useMemo<Shoe | undefined>(() => {
    if (isNew || !modelNumber) return undefined
    const found = shoes.find(
      (item) => String(item.modelNumber) === String(modelNumber)
    )
    return found ? hydrateShoe(found) : undefined
  }, [isNew, modelNumber, shoes])

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
      shoes={shoes}
      selectedModelNumber={modelNumber}
      isLoading={shoesQuery.isFetching}
      onSelect={handleListSelect}
    />
  )

  // 국면 → 워크벤치. 신규=빈 등록, 그 외=기존 편집(신발 미선택이면 목록 브라우즈).
  const workbenchMode = isNew ? "new" : "edit"
  const initialShoe = isNew ? undefined : currentShoe
  // 모드/신발 전환 시 리마운트해 formData·lineState·uploadedRef 잔상을 없앤다.
  const workbenchKey = isNew ? "new" : `${modelNumber || "none"}-edit`

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
