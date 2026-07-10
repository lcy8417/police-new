import { useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowLeft,
  Crosshair,
  History,
  ImageOff,
  ListTree,
  Pencil,
  ScanLine,
} from "lucide-react"

import { crimeKeys, fetchCrimeDetail, useCrimeStore } from "@/entities/crime"
import { usePageHeader } from "@/widgets/app-shell"
import { Button } from "@/shared/ui/button"
import { DotGrid, GlowOrb } from "@/shared/ui/glow-fx"
import { TechCorners } from "@/shared/ui/tech-corners"
import { cn } from "@/shared/lib/utils"

import { crimeHistoryPath, patternExtractPath } from "../model/search-paths"

/** 현장/편집 이미지 스와퍼의 표시 대상. 레거시 `imageChangeHandler`의 두 분기와 동일. */
type SceneKind = "origin" | "edit"

interface InfoFieldProps {
  label: string
  value: string | number | null | undefined
}

/** 사건정보 한 항목(라벨 + 값). 값이 없으면 표시하지 않는다(ResultDetailPage와 동일 톤). */
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
      사건 상세 정보
    </span>
    <span className="text-[13px] leading-none font-normal text-[#8A93A6]">
      현장 이미지·사건정보와 저장된 검색 이력을 확인합니다.
    </span>
  </div>
)

/** 검색이력 테이블 헤더(레거시 `SearchResults`의 4열과 동일). */
const HISTORY_COLUMNS = ["ID", "등록일시", "순위", "매칭된 신발 정보"] as const

/**
 * 커맨드 센터 `/search/:crimeNumber`. 레거시 `DetailMain`(raw fetch + Context +
 * FormList/SearchResults)을 TanStack `useQuery`(검색이력) + `useCrimeStore`(현장
 * 데이터)로 옮겼다. 이미지 스와퍼(현장/편집)·사건정보·검색이력 테이블을 다크톤으로
 * 재구성하고, 검색이력 행 클릭 시 `crimeHistoryPath`로 새 창을 연다.
 */
export function CrimeDetailPage() {
  const { crimeNumber = "" } = useParams()
  const navigate = useNavigate()

  // 현장/편집 스와퍼 상태. 레거시는 imgRef.src를 직접 갈아끼웠지만, 여기서는
  // 표시 대상만 상태로 관리한다(동작 동일, 사이드이펙트 없음).
  const [sceneKind, setSceneKind] = useState<SceneKind>("origin")

  // Context 브리지 대신 store 셀렉터로 현장 데이터에 접근한다.
  const crimeData = useCrimeStore((s) => s.crimeData)
  const currentCrimeData = crimeData.find(
    (item) => String(item.crimeNumber) === String(crimeNumber)
  )

  // 검색이력: 레거시의 ad hoc `fetch(/crime/:crimeNumber)`를 entities
  // `fetchCrimeDetail`(같은 엔드포인트, camelCase) + useQuery로 승격했다.
  const historyQuery = useQuery({
    queryKey: crimeKeys.detail(crimeNumber),
    queryFn: () => fetchCrimeDetail(crimeNumber),
    enabled: Boolean(crimeNumber),
  })
  const historyRows = historyQuery.data ?? []

  const displayImage =
    sceneKind === "origin"
      ? currentCrimeData?.image
      : currentCrimeData?.editImage

  const openHistory = (row: { id?: number; ranking?: number }) => {
    if (row.id === undefined) return
    const path = crimeHistoryPath(crimeNumber, row.id, { ranking: row.ranking })
    window.open(
      `${window.location.origin}${path}`,
      "_blank",
      "noopener,noreferrer"
    )
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
          onClick={() => navigate(patternExtractPath(crimeNumber))}
          className="border border-[#3B82F6]/50 bg-[#152238] text-[#4A9EFF] hover:bg-[#182b45]"
        >
          <ScanLine className="size-4" aria-hidden="true" />
          문양추출
        </Button>
      </>
    ),
    [navigate, crimeNumber]
  )

  usePageHeader({ title: HEADER_TITLE, actions: headerActions })

  return (
    <div className="relative h-[calc(100vh-110px)] w-full overflow-hidden bg-background px-6 py-6">
      <DotGrid />
      <GlowOrb className="-top-24 right-1/4 h-72 w-72 bg-[#2563EB]/10" />
      <GlowOrb className="bottom-0 left-1/3 h-64 w-64 bg-[#4A9EFF]/8" />

      <div className="relative grid h-full min-h-0 grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* 현장 이미지 + 현장/편집 스와퍼 */}
        <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
          <TechCorners size={22} />

          <div className="flex items-center justify-between px-6 pt-5">
            <span className="text-[15px] font-semibold text-[#E5E9F0]">
              현장 이미지
            </span>
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4A9EFF] opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-[#4A9EFF] shadow-[0_0_8px_2px_rgba(74,158,255,0.8)]" />
            </span>
          </div>

          {/* 현장/편집 스와퍼 툴바 — 레거시 image-swapper-buttons 대체. */}
          <div className="mt-4 flex items-center gap-2 border-y border-[#141D2C] bg-[#0D1420]/60 px-6 py-2.5">
            {(
              [
                ["origin", "현장이미지"],
                ["edit", "편집이미지"],
              ] as const
            ).map(([kind, label]) => (
              <button
                key={kind}
                type="button"
                onClick={() => setSceneKind(kind)}
                className={cn(
                  "rounded-md border px-3 py-1 font-mono text-[11px] tracking-wide uppercase transition-colors",
                  sceneKind === kind
                    ? "border-[#3B82F6]/50 bg-[#152238] text-[#4A9EFF]"
                    : "border-[#1E2A3C] bg-[#0F1826] text-[#8A93A6] hover:border-[#3B82F6]/40 hover:text-[#C7CEDB]"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 뷰포트 — CrimeScenePanel과 같은 언어(십자선). */}
          <div className="relative m-6 mt-4 flex min-h-[240px] flex-1 items-center justify-center overflow-hidden rounded-xl border border-[#141D2C] bg-[#05080D]">
            <Crosshair
              className="absolute top-4 left-4 size-5 text-[#4A9EFF]/70 drop-shadow-[0_0_4px_rgba(74,158,255,0.6)]"
              aria-hidden="true"
            />
            <Crosshair
              className="absolute top-4 right-4 size-5 text-[#4A9EFF]/70 drop-shadow-[0_0_4px_rgba(74,158,255,0.6)]"
              aria-hidden="true"
            />
            <Crosshair
              className="absolute bottom-4 left-4 size-5 text-[#4A9EFF]/70 drop-shadow-[0_0_4px_rgba(74,158,255,0.6)]"
              aria-hidden="true"
            />
            <Crosshair
              className="absolute right-4 bottom-4 size-5 text-[#4A9EFF]/70 drop-shadow-[0_0_4px_rgba(74,158,255,0.6)]"
              aria-hidden="true"
            />

            {displayImage ? (
              <img
                src={displayImage}
                alt={sceneKind === "origin" ? "현장 이미지" : "편집 이미지"}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-[#5B6B85]">
                <ImageOff className="size-9" aria-hidden="true" />
                <span className="text-sm font-medium">
                  {sceneKind === "origin"
                    ? "현장 이미지가 없습니다."
                    : "편집 이미지가 없습니다."}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* 사건정보 + 검색이력 */}
        <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-6">
          {/* 사건정보 */}
          <section className="relative flex flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
            <TechCorners size={20} />
            <div className="flex items-center justify-between border-b border-[#141D2C] bg-[#0D1420]/60 px-6 py-3.5">
              <span className="text-[15px] font-semibold text-[#E5E9F0]">
                사건 정보
              </span>
              <span className="font-mono text-[11px] tracking-[0.14em] text-[#5B6B85] uppercase">
                Case · Detail
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 px-6 py-5 sm:grid-cols-3 lg:grid-cols-4">
              <InfoField label="사건등록번호" value={currentCrimeData?.crimeNumber ?? crimeNumber} />
              <InfoField label="이미지 번호" value={currentCrimeData?.imageNumber} />
              <InfoField label="사건 이름" value={currentCrimeData?.crimeName} />
              <InfoField label="채취 일시" value={currentCrimeData?.findTime} />
              <InfoField label="의뢰관서" value={currentCrimeData?.requestOffice} />
              <InfoField label="발견 방법" value={currentCrimeData?.findMethod} />
              <InfoField label="진행상태" value={currentCrimeData?.state} />
            </div>
          </section>

          {/* 검색이력 테이블 */}
          <section className="relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
            <TechCorners size={20} />
            <div className="flex items-center justify-between border-b border-[#141D2C] bg-[#0D1420]/60 px-6 py-3.5">
              <span className="flex items-center gap-2 text-[15px] font-semibold text-[#E5E9F0]">
                <History className="size-4 text-[#4A9EFF]" aria-hidden="true" />
                검색 이력
              </span>
              <span className="font-mono text-[11px] tracking-[0.14em] text-[#5B6B85] uppercase">
                Search · History
              </span>
            </div>

            <div className="min-h-0 flex-1 overflow-auto">
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
                  </tr>
                </thead>
                <tbody>
                  {historyRows.length > 0 ? (
                    historyRows.map((row, rowIndex) => (
                      <tr
                        key={row.id ?? rowIndex}
                        onClick={() => openHistory(row)}
                        className="cursor-pointer border-b border-[#141D2C] transition-colors hover:bg-[#141F30]"
                      >
                        <td className="px-6 py-3 font-mono text-[13px] tabular-nums text-[#8A93A6]">
                          {row.id}
                        </td>
                        <td className="px-6 py-3 text-[13px] text-[#C7CEDB]">
                          {row.registerTime ?? "-"}
                        </td>
                        <td className="px-6 py-3 font-mono text-[13px] tabular-nums text-[#4A9EFF]">
                          {row.ranking ?? "-"}
                        </td>
                        <td className="px-6 py-3 text-[13px] text-[#C7CEDB]">
                          {row.matchingShoes ?? "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={HISTORY_COLUMNS.length}
                        className="px-6 py-16 text-center"
                      >
                        <div className="flex flex-col items-center gap-2 text-[#5B6B85]">
                          <ListTree className="size-7" aria-hidden="true" />
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
      </div>
    </div>
  )
}
