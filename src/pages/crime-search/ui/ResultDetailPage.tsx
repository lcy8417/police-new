import { useMemo } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { Award, ScanSearch, Target } from "lucide-react"

import { ShoeDetailContent } from "@/features/crime-search"
import { usePageHeader } from "@/widgets/app-shell"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"

import { searchDetailPath } from "../model/search-paths"

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
 * 커맨드 센터 `/search/:crimeNumber/shoesResult/detail/:modelNumber`(풀페이지 딥링크
 * 스텁). 데이터 로드·4섹션 렌더·이력 저장은 공용 `ShoeDetailContent`(variant="page")가
 * 담당하고, 이 페이지는 헤더(제목·ranking 뱃지)와 저장 후 navigate만 조립한다.
 * `/search`의 우측 컴팩트 Sheet가 같은 콘텐츠를 variant="compact"로 재사용한다.
 */
export function ResultDetailPage() {
  const { modelNumber = "", crimeNumber = "" } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const ranking = searchParams.get("ranking")
  // 상위 3위는 검색결과 그리드의 TOP 뱃지와 같은 톤(그린 티어)으로 강조한다.
  const rankNum = ranking ? Number.parseInt(ranking, 10) : null
  const isTopRank = rankNum !== null && !Number.isNaN(rankNum) && rankNum <= 3

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
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-3 py-1.5 font-mono text-[13px] font-semibold",
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
            매칭 후보 [{ranking}위]
          </span>
        )}
      </>
    ),
    [navigate, ranking, isTopRank]
  )

  usePageHeader({ title: HEADER_TITLE, actions: headerActions })

  return (
    <ShoeDetailContent
      variant="page"
      crimeNumber={crimeNumber}
      modelNumber={modelNumber}
      ranking={ranking}
      onSaved={() => navigate(searchDetailPath(crimeNumber))}
    />
  )
}
