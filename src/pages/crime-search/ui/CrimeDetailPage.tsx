import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowLeft,
  Award,
  Crosshair,
  ExternalLink,
  Fingerprint,
  Footprints,
  History,
  ImageOff,
  ListTree,
  Loader2,
  Pencil,
  ScanLine,
} from "lucide-react"

import { crimeKeys, fetchCrimeDetail, useCrimeStore } from "@/entities/crime"
import { usePageHeader } from "@/widgets/app-shell"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { DotGrid, GlowOrb } from "@/shared/ui/glow-fx"
import { TechCorners } from "@/shared/ui/tech-corners"
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group"
import { cn } from "@/shared/lib/utils"

import { crimeHistoryPath, patternExtractPath } from "../model/search-paths"

/** 현장/편집 이미지 스와퍼의 표시 대상. 레거시 `imageChangeHandler`의 두 분기와 동일. */
type SceneKind = "origin" | "edit"

interface InfoFieldProps {
  label: string
  value: string | number | null | undefined
  /** 진행상태처럼 살아있는 값임을 강조할 때(발견/판정 뱃지와 같은 톤의 필). */
  emphasis?: boolean
}

/** 사건정보 한 항목(라벨 + 값). 값이 없으면 표시하지 않는다(ResultDetailPage와 동일 톤). */
function InfoField({ label, value, emphasis = false }: InfoFieldProps) {
  if (value === null || value === undefined || value === "") return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[10px] tracking-wide text-[#5B6B85] uppercase">
        {label}
      </span>
      {emphasis ? (
        <span className="inline-flex w-fit items-center rounded-full border border-[#3B82F6]/40 bg-[#152238]/60 px-2 py-0.5 text-[12px] font-semibold text-[#4A9EFF]">
          {value}
        </span>
      ) : (
        <span className="text-[13px] font-semibold text-[#C7CEDB]">{value}</span>
      )}
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

  // 뷰포트 하단 상태표시줄용 픽셀 치수 — EvidenceImagePanel/CrimeScenePanel과 같은
  // 언어. 표시 대상 전환으로 이미지가 사라지면 0으로 되돌린다.
  const [dimensions, setDimensions] = useState<[number, number]>([0, 0])

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

  useEffect(() => {
    if (!displayImage) setDimensions([0, 0])
  }, [displayImage])

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
          className="border border-[#3B82F6]/50 bg-[#152238] text-[#4A9EFF] shadow-[0_0_18px_rgba(37,99,235,0.35)] hover:bg-[#182b45]"
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

      <div className="relative grid h-full min-h-0 grid-cols-1 gap-6 lg:grid-cols-[1fr_1.5fr]">
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

          {/* 현장/편집 스와퍼 툴바 — 형제 화면의 뷰포트 툴바(라벨 + 컨트롤)와 같은 짜임. */}
          <div className="mt-4 flex items-center justify-between border-y border-[#141D2C] bg-[#0D1420]/60 px-6 py-2.5">
            <span className="font-mono text-[11px] tracking-[0.14em] text-[#5B6B85] uppercase">
              표시 대상
            </span>
            <ToggleGroup
              type="single"
              value={sceneKind}
              onValueChange={(v) => v && setSceneKind(v as SceneKind)}
              className="gap-0.5 rounded-md border border-[#1E2A3C] bg-[#0F1826] p-0.5"
            >
              <ToggleGroupItem
                value="origin"
                className="h-6 rounded-[5px] px-2.5 text-[11px] font-medium text-[#6B7688] hover:text-[#C7CEDB] data-[state=on]:border data-[state=on]:border-[#3B82F6]/50 data-[state=on]:bg-[#152238] data-[state=on]:text-[#4A9EFF]"
              >
                현장이미지
              </ToggleGroupItem>
              <ToggleGroupItem
                value="edit"
                className="h-6 rounded-[5px] px-2.5 text-[11px] font-medium text-[#6B7688] hover:text-[#C7CEDB] data-[state=on]:border data-[state=on]:border-[#3B82F6]/50 data-[state=on]:bg-[#152238] data-[state=on]:text-[#4A9EFF]"
              >
                편집이미지
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* 뷰포트 — EvidenceImagePanel/CrimeScenePanel과 같은 언어(체커보드 눈금·십자선·워터마크). */}
          <div className="relative m-6 mt-4 mb-3 flex min-h-[240px] flex-1 items-center justify-center overflow-hidden rounded-xl border border-[#141D2C] bg-[#05080D]">
            {/* 체커보드 눈금 바 */}
            <div
              className="absolute inset-x-2 top-2 h-[8px] rounded-sm opacity-70"
              style={{
                backgroundImage: "repeating-linear-gradient(90deg, #E5E9F0 0 8px, #0B121D 8px 16px)",
              }}
            />
            <div
              className="absolute inset-y-2 left-2 w-[8px] rounded-sm opacity-70"
              style={{
                backgroundImage: "repeating-linear-gradient(180deg, #E5E9F0 0 8px, #0B121D 8px 16px)",
              }}
            />

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
                onLoad={(e) => {
                  const el = e.currentTarget
                  setDimensions([el.naturalWidth, el.naturalHeight])
                }}
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

            <span className="absolute bottom-3 left-12 font-mono text-[10px] tracking-wider text-[#5B6B85]">
              KCSI / Forensic Imaging
            </span>
          </div>

          {/* 상태 표시줄 — EvidenceImagePanel/CrimeScenePanel과 같은 언어. */}
          <div className="flex items-center gap-3 border-t border-[#141D2C] px-6 py-3">
            <span className="rounded-md border border-[#1E2A3C] bg-[#0F1826] px-2.5 py-1 font-mono text-[11px] tabular-nums text-[#8A93A6]">
              {dimensions[0]} x {dimensions[1]} px
            </span>
            <span className="rounded-md border border-[#1E2A3C] bg-[#0F1826] px-2 py-0.5 font-mono text-[10px] tracking-wide text-[#8A93A6] uppercase">
              Read-Only
            </span>
            <span className="ml-auto font-mono text-[11px] tracking-wide text-[#6B7688] uppercase">
              {sceneKind === "origin" ? "Scene Capture" : "Edited Frame"}
            </span>
          </div>
        </section>

        {/* 사건정보 + 검색이력 */}
        <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-6">
          {/* 사건정보 */}
          <section className="relative flex flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
            <TechCorners size={20} />
            <div className="flex items-center justify-between border-b border-[#141D2C] bg-[#0D1420]/60 px-6 py-3.5">
              <span className="flex items-center gap-2 text-[15px] font-semibold text-[#E5E9F0]">
                <Fingerprint className="size-4 text-[#4A9EFF]" aria-hidden="true" />
                사건 정보
              </span>
              <div className="flex items-center gap-2">
                {/* 사건등록번호는 이 사건의 기본 식별자라 필드 그리드가 아닌
                    헤더에 스탬프처럼 고정해 항상 눈에 띄게 한다. */}
                <span className="rounded-md border border-[#3B82F6]/40 bg-[#152238]/60 px-2.5 py-1 font-mono text-[12px] font-semibold tracking-wide text-[#4A9EFF]">
                  {currentCrimeData?.crimeNumber ?? crimeNumber}
                </span>
                <span className="font-mono text-[11px] tracking-[0.14em] text-[#5B6B85] uppercase">
                  Case · Detail
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 px-6 py-5 sm:grid-cols-3 lg:grid-cols-4">
              <InfoField label="이미지 번호" value={currentCrimeData?.imageNumber} />
              <InfoField label="사건 이름" value={currentCrimeData?.crimeName} />
              <InfoField label="채취 일시" value={currentCrimeData?.findTime} />
              <InfoField label="의뢰관서" value={currentCrimeData?.requestOffice} />
              <InfoField label="발견 방법" value={currentCrimeData?.findMethod} />
              <InfoField label="진행상태" value={currentCrimeData?.state} emphasis />
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
                        row.ranking !== undefined && row.ranking !== null && row.ranking <= 3
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
                        className="px-6 py-16 text-center"
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
      </div>
    </div>
  )
}
