import { useCallback, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowLeft,
  Award,
  ChevronDown,
  ExternalLink,
  Footprints,
  History,
  ListTree,
  Loader2,
  Pencil,
  Search,
} from "lucide-react"
import { toast } from "sonner"

import { crimeKeys, fetchCrimeDetail, useCrimeStore } from "@/entities/crime"
import {
  PatternCanvas,
  PatternPalette,
  PatternZones,
  usePatternManager,
} from "@/features/patterns-extract"
import { usePageHeader } from "@/widgets/app-shell"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { DotGrid, GlowOrb } from "@/shared/ui/glow-fx"
import { fetchPatterns } from "@/services/crud"
import { imageChangeHandler } from "@/utils/get-input-change"
import { cn } from "@/shared/lib/utils"

import { crimeHistoryPath, shoesResultPath } from "../model/search-paths"
import { CaseInfoStrip } from "./CaseInfoStrip"

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
    deletePattern,
    essentialCheck,
  } = usePatternManager({
    index,
    currentData: currentCrimeData ?? null,
    imgRef,
  })

  const [isExtracting, setIsExtracting] = useState(false)
  // 검색이력은 기본 접힘 — 문양 작업이 주 흐름이라 필요할 때만 펼친다.
  const [historyOpen, setHistoryOpen] = useState(false)

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
    ),
    [navigate, crimeNumber, handleSearch]
  )

  usePageHeader({ title: HEADER_TITLE, actions: headerActions })

  return (
    <div className="relative flex h-[calc(100vh-110px)] w-full flex-col gap-4 overflow-y-auto bg-background px-6 py-6">
      <DotGrid />
      <GlowOrb className="-top-24 right-1/4 h-72 w-72 bg-[#2563EB]/10" />
      <GlowOrb className="bottom-0 left-1/3 h-64 w-64 bg-[#4A9EFF]/8" />

      {/* 본문 4열: 캔버스 워크벤치(이미지 폭에 스너그) · 문양 정보 · 문양 리스트 · 사건정보(세로).
          이미지 열 상한 fit-content(36vw)는 PatternCanvas 이미지 래퍼의 max-w-[36vw]와 정합.
          사건정보는 맨 오른쪽 좁은 열(0.55fr)에 세로로 격납한다.
          xl 미만에서는 세로 스택으로 폴백하고 페이지 전체가 스크롤된다. */}
      <div className="relative grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[fit-content(36vw)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.55fr)]">
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
          />
        </div>

        <div className="grid min-h-[420px] grid-rows-[minmax(0,1fr)] xl:h-full xl:min-h-0">
          <PatternPalette
            patterns={patterns}
            patternsKindSelect={patternsKindSelect}
            insertPattern={insertPattern}
          />
        </div>

        {/* 맨 오른쪽 좁은 세로 열 — 사건정보 패널 */}
        <div className="grid min-h-[420px] grid-rows-[minmax(0,1fr)] xl:h-full xl:min-h-0">
          <CaseInfoStrip crimeNumber={crimeNumber} currentData={currentCrimeData} />
        </div>
      </div>

      {/* 접이식 검색이력 — 기본 접힘, 헤더 토글로 펼침. 데이터는 접힘과 무관하게 로드된다. */}
      <section className="relative shrink-0 overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
        <button
          type="button"
          onClick={() => setHistoryOpen((v) => !v)}
          aria-expanded={historyOpen}
          className="flex w-full items-center justify-between border-b border-[#141D2C] bg-[#0D1420]/60 px-6 py-3 text-left transition-colors hover:bg-[#0D1420]"
        >
          <span className="flex items-center gap-2 text-[15px] font-semibold text-[#E5E9F0]">
            <History className="size-4 text-[#4A9EFF]" aria-hidden="true" />
            검색 이력
            <span className="rounded-full border border-[#1E2A3C] bg-[#0F1826] px-2 py-0.5 font-mono text-[11px] tabular-nums text-[#8A93A6]">
              {historyRows.length}
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span className="font-mono text-[11px] tracking-[0.14em] text-[#5B6B85] uppercase">
              Search · History
            </span>
            <ChevronDown
              className={cn(
                "size-4 text-[#5B6B85] transition-transform duration-300",
                historyOpen && "rotate-180 text-[#4A9EFF]"
              )}
              aria-hidden="true"
            />
          </span>
        </button>

        {/* max-h 트랜지션으로 펼침/접힘. 접힘 시 overflow-hidden, 펼침 시 내부 스크롤. */}
        <div
          className={cn(
            "overflow-auto transition-[max-height] duration-300 ease-in-out",
            historyOpen ? "max-h-[360px]" : "max-h-0"
          )}
        >
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
      </section>
    </div>
  )
}
