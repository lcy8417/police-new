import { useCallback, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Search } from "lucide-react"
import { toast } from "sonner"

import { useCrimeStore } from "@/entities/crime"
import {
  PatternCanvas,
  PatternPalette,
  PatternZones,
  usePatternManager,
} from "@/features/patterns-extract"
import { usePageHeader } from "@/widgets/app-shell"
import { Button } from "@/shared/ui/button"
import { DotGrid, GlowOrb } from "@/shared/ui/glow-fx"
import { fetchPatterns } from "@/services/crud"
import { imageChangeHandler } from "@/utils/get-input-change"

import { shoesResultPath } from "../model/search-paths"

// 제목은 정적 — 헤더 effect가 매 렌더 재실행되지 않도록 한 번만 생성한다.
const HEADER_TITLE = (
  <div className="flex flex-col justify-center gap-1">
    <span className="text-[28px] leading-none font-bold text-white">
      현장이미지 패턴 추출
    </span>
    <span className="text-[13px] leading-none font-normal text-[#8A93A6]">
      경계선으로 상·중·하를 나누고 문양을 추출해 신발 DB를 검색합니다.
    </span>
  </div>
)

/**
 * 커맨드 센터 `/search/:crimeNumber/patternExtract`. 레거시 `PatternExtract.jsx`
 * (+ `PatternExtractMain.jsx`, `Canvas.jsx` 공유)를 FSD로 재작성했다. 상태는 라우트
 * 레벨에서 `usePatternManager`(무수정 재사용)가 소유하고, 신규 전용 `PatternCanvas`
 * (선편집 + 이미지 표시 + 추출/초기화)와 `PatternZones`/`PatternPalette`(문양 정보/리스트)
 * 를 조립한다. 레거시 Context 대신 `useCrimeStore` 셀렉터로 현장 데이터에 접근한다.
 */
export function PatternExtractPage() {
  const { crimeNumber = "" } = useParams()
  const navigate = useNavigate()
  const imgRef = useRef<HTMLImageElement | null>(null)

  // Context 브리지 대신 store 셀렉터로 현장 데이터에 접근한다.
  const crimeData = useCrimeStore((s) => s.crimeData)
  const index = crimeData.findIndex(
    (item) => String(item.crimeNumber) === String(crimeNumber)
  )
  const currentCrimeData = crimeData[index]

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
    deletePattern,
    essentialCheck,
  } = usePatternManager({
    index,
    currentData: currentCrimeData ?? null,
    imgRef,
  })

  const [isExtracting, setIsExtracting] = useState(false)

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

  // 현장/편집 이미지 스와퍼 — 레거시와 동일하게 imgRef.current.src를 직접 교체한다.
  const showOrigin = useCallback(
    () => imageChangeHandler("origin", imgRef, currentCrimeData),
    [currentCrimeData]
  )
  const showEdit = useCallback(
    () => imageChangeHandler("edit", imgRef, currentCrimeData),
    [currentCrimeData]
  )

  // 신발 검색: 레거시 `PatternExtract.jsx` 흐름과 동등 — 현재 문양을 서버에 저장(PUT)하고
  // 편집 여부(imgRef의 src가 data URL인지)를 쿼리로 실어 결과 화면으로 이동한다.
  const handleSearch = useCallback(() => {
    try {
      const edit = imgRef.current?.src.startsWith("data:image") ?? false
      if (currentCrimeData) {
        void fetchPatterns(crimeNumber, currentCrimeData)
      }
      navigate(shoesResultPath(crimeNumber, { edit, page: 0 }))
    } catch (error) {
      console.error("Error updating patterns:", error)
      toast.error("문양 업데이트 중 오류가 발생했습니다.")
    }
  }, [crimeNumber, currentCrimeData, navigate])

  const headerActions = useMemo(
    () => (
      <Button
        type="button"
        size="sm"
        onClick={handleSearch}
        className="border border-[#3B82F6]/50 bg-[#152238] text-[#4A9EFF] shadow-[0_0_18px_rgba(37,99,235,0.35)] hover:bg-[#182b45]"
      >
        <Search className="size-4" aria-hidden="true" />
        신발 검색
      </Button>
    ),
    [handleSearch]
  )

  usePageHeader({ title: HEADER_TITLE, actions: headerActions })

  return (
    <div className="relative h-[calc(100vh-110px)] w-full overflow-hidden bg-background px-6 py-6">
      <DotGrid />
      <GlowOrb className="-top-24 right-1/4 h-72 w-72 bg-[#2563EB]/10" />
      <GlowOrb className="bottom-0 left-1/3 h-64 w-64 bg-[#4A9EFF]/8" />

      {/* 좌: 캔버스 워크벤치 / 우: 문양 정보 + 문양 리스트 */}
      <div className="relative grid h-full min-h-0 grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
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

        <div className="grid min-h-0 grid-rows-[1fr_1fr] gap-6">
          <PatternZones
            selected={selected}
            setSelected={setSelected}
            deletePattern={deletePattern}
            essentialCheck={essentialCheck}
            currentData={currentCrimeData}
          />
          <PatternPalette
            patterns={patterns}
            patternsKindSelect={patternsKindSelect}
            insertPattern={insertPattern}
          />
        </div>
      </div>
    </div>
  )
}
