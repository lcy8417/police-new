import { useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Pencil } from "lucide-react"

import {
  fetchShoesList,
  shoeKeys,
  type Shoe,
  type ShoePattern,
} from "@/entities/shoe"
import { insertPatternPath } from "@/entities/pattern"
import { usePageHeader } from "@/widgets/app-shell"
import { Button } from "@/shared/ui/button"
import { DotGrid, GlowOrb } from "@/shared/ui/glow-fx"
import { ShoeList } from "@/features/shoe-repository/ui/ShoeList"
import { ShoeDetail } from "@/features/shoe-repository/ui/ShoeDetail"

import { shoeRepositoryPath, shoeEditPath } from "../model/shoe-paths"

// 제목은 정적 — 헤더 effect가 매 렌더 재실행되지 않도록 한 번만 생성한다.
const HEADER_TITLE = (
  <div className="flex flex-col justify-center gap-1">
    <span className="text-[28px] leading-none font-bold text-white">
      신발 조회
    </span>
    <span className="text-[13px] leading-none font-normal text-[#8A93A6]">
      등록된 신발 DB에서 대상을 선택해 측면 이미지와 밑창 문양을 확인합니다.
    </span>
  </div>
)

/**
 * 신발 밑창 문양 zone 하나를 전체 경로로 hydrate한다. 서버(`fetchShoesList`)는
 * 패턴 이름만 보내므로(단계 F: entities/shoe는 hydrate하지 않음), 레거시
 * `ShoesRepositoryMain.jsx:51-57`의 `toPatternPaths`를 typed 후속인
 * `insertPatternPath`로 대체해 여기서 붙인다. 신발 패턴은 순수 문자열이라
 * `insertPatternPath`의 문자열 분기가 문자열을 그대로 반환한다.
 */
function hydrateZone(zone: ShoePattern[] = []): ShoePattern[] {
  return zone.map((entry) => insertPatternPath(entry) as ShoePattern)
}

/**
 * 커맨드 센터 `/shoesRepository/:modelNumber`. 레거시 `ShoesRepositoryMain`
 * (raw `fetchShoesData` + 로컬 state + 하드코딩 CSS)을 TanStack `useQuery`
 * (`entities/shoe#fetchShoesList`) + 다크 forensic FSD로 옮겼다. 좌측 신발 리스트
 * 에서 행을 선택하면 URL이 `:modelNumber`로 갱신되고 우측 상세가 해당 신발로
 * 바뀐다. 밑창 문양은 서버가 이름만 주므로 이 페이지에서 경로를 hydrate한다.
 */
export function ShoeRepositoryPage() {
  const { modelNumber = "" } = useParams()
  const navigate = useNavigate()
  const [page, setPage] = useState(0)

  const shoesQuery = useQuery({
    queryKey: shoeKeys.list(page),
    queryFn: () => fetchShoesList(page),
  })
  // 매 렌더마다 새 배열([])이 생겨 아래 useMemo 의존성이 흔들리지 않도록 메모한다.
  const shoes = useMemo(() => shoesQuery.data ?? [], [shoesQuery.data])

  // 선택된 신발을 찾아 밑창 문양 4부위를 전체 경로로 hydrate해 상세에 넘긴다.
  const currentShoe = useMemo<Shoe | undefined>(() => {
    const found = shoes.find(
      (item) => String(item.modelNumber) === String(modelNumber)
    )
    if (!found) return undefined
    return {
      ...found,
      top: hydrateZone(found.top),
      mid: hydrateZone(found.mid),
      bottom: hydrateZone(found.bottom),
      outline: hydrateZone(found.outline),
    }
  }, [shoes, modelNumber])

  const headerActions = useMemo(
    () => (
      <Button
        type="button"
        size="sm"
        disabled={!modelNumber}
        onClick={() => navigate(shoeEditPath(modelNumber))}
        className="border border-[#3B82F6]/50 bg-[#152238] text-[#4A9EFF] shadow-[0_0_18px_rgba(37,99,235,0.35)] hover:bg-[#182b45] disabled:border-[#1E2A3C] disabled:bg-[#0F1826] disabled:text-[#5B6B85] disabled:shadow-none"
      >
        <Pencil className="size-4" aria-hidden="true" />
        편집
      </Button>
    ),
    [navigate, modelNumber]
  )

  usePageHeader({ title: HEADER_TITLE, actions: headerActions })

  return (
    <div className="relative h-[calc(100vh-110px)] w-full overflow-hidden bg-background px-6 py-6">
      <DotGrid />
      <GlowOrb className="-top-24 right-1/4 h-72 w-72 bg-[#2563EB]/10" />
      <GlowOrb className="bottom-0 left-1/3 h-64 w-64 bg-[#4A9EFF]/8" />

      {/* 좌: 신발 리스트(~1fr) / 우: 선택 상세(~1.6fr) */}
      <div className="relative grid h-full min-h-0 grid-cols-1 gap-6 lg:grid-cols-[1fr_1.6fr]">
        <div className="min-h-0">
          <ShoeList
            shoes={shoes}
            selectedModelNumber={modelNumber}
            page={page}
            isLoading={shoesQuery.isFetching}
            onSelect={(value) => navigate(shoeRepositoryPath(value))}
            onEdit={(value) => navigate(shoeEditPath(value))}
            onPageChange={setPage}
          />
        </div>
        <div className="min-h-0">
          <ShoeDetail shoe={currentShoe} />
        </div>
      </div>
    </div>
  )
}
