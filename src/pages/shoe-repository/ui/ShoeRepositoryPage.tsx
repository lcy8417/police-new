import { useCallback, useMemo, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Footprints, Loader2, Pencil, Plus } from "lucide-react"

import {
  fetchShoeDetail,
  fetchShoesList,
  shoeKeys,
  type Shoe,
  type ShoePattern,
} from "@/entities/shoe"
import { insertPatternPath } from "@/entities/pattern"
import { ShoeWorkbench } from "@/widgets/shoe-workbench"
import { usePageHeader } from "@/widgets/app-shell"
import { Button } from "@/shared/ui/button"
import { DotGrid, GlowOrb } from "@/shared/ui/glow-fx"
import { TechCorners } from "@/shared/ui/tech-corners"
import { ShoeList } from "@/features/shoe-repository/ui/ShoeList"

import {
  shoeEditModePath,
  shoeRegisterNewPath,
  shoeRepositoryPath,
} from "../model/shoe-paths"

/**
 * 신발 밑창 문양 zone 하나를 전체 경로로 hydrate한다. 서버(`fetchShoesList`/
 * `fetchShoeDetail`)는 패턴 이름만 보내므로, `insertPatternPath`로 여기서 경로를
 * 붙인다. 신발 패턴은 순수 문자열이라 문자열 분기가 그대로 반환한다.
 */
function hydrateZone(zone: ShoePattern[] = []): ShoePattern[] {
  return zone.map((entry) => insertPatternPath(entry) as ShoePattern)
}

/** 신발의 4부위 문양을 모두 hydrate한 사본을 만든다(read-only 표시·편집 시드 공용). */
function hydrateShoe(shoe: Shoe): Shoe {
  return {
    ...shoe,
    top: hydrateZone(shoe.top),
    mid: hydrateZone(shoe.mid),
    bottom: hydrateZone(shoe.bottom),
    outline: hydrateZone(shoe.outline),
  }
}

/** 워크벤치 자리에 로딩/미발견 상태를 채우는 다크 패널(read-only 폴백과 톤 통일). */
function StatusPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-full min-h-0 flex-col items-center justify-center overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
      <TechCorners size={22} />
      <div className="flex flex-col items-center gap-3 text-[#5B6B85]">{children}</div>
    </div>
  )
}

/**
 * 통합 커맨드센터 `/shoesRepository`. 신발 **조회·등록·편집**을 한 라우트로 묶은
 * 화면으로, 범죄 `/search/:crimeNumber` 커맨드센터와 동형이다. 좌측 상시 목록 레일 +
 * 우측 작업 영역으로 구성되고, 우측은 URL 국면에 따라 바뀐다:
 *  - `?mode=new`            → 신규 등록 워크벤치(`ShoeWorkbench` mode="new", POST)
 *  - `:modelNumber?mode=edit` → 편집 워크벤치(`ShoeWorkbench` mode="edit", PUT)
 *  - `:modelNumber`(모드 없음) → read-only 조회(워크벤치 view 모드, 구조 동일)
 *  - (무선택)               → 안내 플레이스홀더
 *
 * "보기 → [편집] → 저장" 2단계 진입이라, 목록을 둘러보다 실수로 문양을 지우는 사고를
 * 막는다(편집은 명시적 [편집] 클릭으로만 활성화). 밑창 문양은 서버가 이름만 주므로
 * 이 페이지에서 경로를 hydrate해 표시/편집 컴포넌트에 넘긴다(내부 재변환 금지).
 */
export function ShoeRepositoryPage() {
  const { modelNumber = "" } = useParams()
  const [searchParams] = useSearchParams()
  const mode = searchParams.get("mode") // "edit" | "new" | null
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)

  const isNew = mode === "new"
  const isEdit = mode === "edit" && modelNumber !== ""

  const shoesQuery = useQuery({
    queryKey: shoeKeys.list(page),
    queryFn: () => fetchShoesList(page),
  })
  const shoes = useMemo(() => shoesQuery.data ?? [], [shoesQuery.data])

  // 선택 신발을 현재 페이지 목록에서 찾는다(가장 흔한 경로: 행 클릭 진입).
  const listMatch = useMemo(
    () =>
      shoes.find((item) => String(item.modelNumber) === String(modelNumber)),
    [shoes, modelNumber]
  )

  // 딥링크(목록에 없는 신발을 상세/편집 URL로 직접 진입) 폴백 — 상세를 직접 조회한다.
  const detailQuery = useQuery({
    queryKey: shoeKeys.detail(modelNumber),
    queryFn: () => fetchShoeDetail(modelNumber),
    enabled: modelNumber !== "" && !isNew && !listMatch,
  })

  // 선택 신발(문양 hydrate). 목록 우선, 없으면 상세 조회 결과.
  const currentShoe = useMemo<Shoe | undefined>(() => {
    const found = listMatch ?? detailQuery.data
    return found ? hydrateShoe(found) : undefined
  }, [listMatch, detailQuery.data])

  // 저장(등록/수정) 성공 → 목록·상세 캐시 무효화 후 해당 신발 read-only로 복귀.
  const handleSaved = useCallback(
    (savedModelNumber: string) => {
      queryClient.invalidateQueries({ queryKey: ["shoes", "list"] })
      if (savedModelNumber) {
        queryClient.invalidateQueries({
          queryKey: shoeKeys.detail(savedModelNumber),
        })
        navigate(shoeRepositoryPath(savedModelNumber))
      } else {
        navigate(shoeRepositoryPath())
      }
    },
    [queryClient, navigate]
  )

  // 헤더 제목 — 국면별로 바뀐다. 매 렌더 새 엘리먼트가 생기면 헤더 effect가 계속
  // 재실행되므로 [mode, modelNumber]로 메모해 참조를 안정화한다.
  const headerTitle = useMemo(() => {
    const [title, subtitle] = isNew
      ? ["신규 신발 등록", "신발 이미지를 등록하고 밑창 문양을 추출·입력하세요."]
      : isEdit
        ? [`신발 편집 · ${modelNumber}`, "밑창 문양을 추출·수정하고 저장하세요."]
        : [
            "신발 조회",
            "등록된 신발 DB에서 대상을 선택해 측면 이미지와 밑창 문양을 확인합니다.",
          ]
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
  }, [isNew, isEdit, modelNumber])

  // 헤더 액션 — 국면별로 바뀐다.
  const headerActions = useMemo(() => {
    // 등록/편집 워크벤치: [← 목록]으로 이탈(등록→idle, 편집→해당 신발 read-only).
    if (isNew || isEdit) {
      const back = isEdit ? shoeRepositoryPath(modelNumber) : shoeRepositoryPath()
      return (
        <Button
          type="button"
          size="sm"
          onClick={() => navigate(back)}
          className="border border-[#1E2A3C] bg-[#0F1826] text-[#C7CEDB] hover:border-[#3B82F6]/50 hover:bg-[#141F30] hover:text-white"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          목록
        </Button>
      )
    }
    // 조회(read-only/idle): [+ 새 신발] 상시 + 선택 시 [편집].
    return (
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => navigate(shoeRegisterNewPath())}
          className="border border-[#1E2A3C] bg-[#0F1826] text-[#C7CEDB] hover:border-[#2DD4BF]/50 hover:bg-[#141F30] hover:text-white"
        >
          <Plus className="size-4" aria-hidden="true" />새 신발
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!modelNumber}
          onClick={() => navigate(shoeEditModePath(modelNumber))}
          className="border border-[#3B82F6]/50 bg-[#152238] text-[#4A9EFF] shadow-[0_0_18px_rgba(37,99,235,0.35)] hover:bg-[#182b45] disabled:border-[#1E2A3C] disabled:bg-[#0F1826] disabled:text-[#5B6B85] disabled:shadow-none"
        >
          <Pencil className="size-4" aria-hidden="true" />
          편집
        </Button>
      </div>
    )
  }, [isNew, isEdit, modelNumber, navigate])

  usePageHeader({ title: headerTitle, actions: headerActions })

  // 작업 영역 — 국면에 따라 같은 워크벤치 구조를 view/edit/new로 렌더한다.
  // 신발을 클릭하면 컴포넌트를 바꾸지 않고 워크벤치에 그 신발의 이미지·문양·정보만
  // 채워 read-only로 보여준다(구조 유지). [편집]을 눌러야 편집이 활성화된다.
  let workArea: React.ReactNode
  if (isNew) {
    workArea = <ShoeWorkbench key="new" mode="new" onSaved={handleSaved} />
  } else if (!modelNumber) {
    workArea = (
      <StatusPanel>
        <Footprints className="size-9" aria-hidden="true" />
        <span className="text-sm font-medium">
          신발을 선택하거나 새 신발을 등록하세요
        </span>
      </StatusPanel>
    )
  } else if (currentShoe) {
    // view/edit는 같은 데이터로 시드되므로, 모드를 key에 넣어 전환 시 리마운트한다
    // (편집 시작 = 저장본에서 새로, lineState/uploadedRef 잔상 방지).
    workArea = (
      <ShoeWorkbench
        key={`${modelNumber}-${isEdit ? "edit" : "view"}`}
        mode={isEdit ? "edit" : "view"}
        initialShoe={currentShoe}
        onSaved={handleSaved}
        onEdit={() => navigate(shoeEditModePath(modelNumber))}
      />
    )
  } else {
    workArea = (
      <StatusPanel>
        {detailQuery.isLoading ? (
          <>
            <Loader2 className="size-8 animate-spin text-[#4A9EFF]" aria-hidden="true" />
            <span className="text-sm font-medium">신발 정보를 불러오는 중...</span>
          </>
        ) : (
          <span className="text-sm font-medium">신발을 찾을 수 없습니다.</span>
        )}
      </StatusPanel>
    )
  }

  return (
    <div className="relative h-[calc(100vh-110px)] w-full overflow-hidden bg-background px-6 py-6">
      <DotGrid />
      <GlowOrb className="-top-24 right-1/4 h-72 w-72 bg-[#2563EB]/10" />
      <GlowOrb className="bottom-0 left-1/3 h-64 w-64 bg-[#4A9EFF]/8" />

      {/* 좌: 국면별 작업 영역(조회·편집·등록) / 우: 신발 목록 레일(상시, 맨 오른쪽) */}
      <div className="relative grid h-full min-h-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
        <div className="min-h-0">{workArea}</div>
        <div className="min-h-0">
          <ShoeList
            shoes={shoes}
            selectedModelNumber={modelNumber}
            page={page}
            isLoading={shoesQuery.isFetching}
            onSelect={(value) => navigate(shoeRepositoryPath(value))}
            onEdit={(value) => navigate(shoeEditModePath(value))}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  )
}
