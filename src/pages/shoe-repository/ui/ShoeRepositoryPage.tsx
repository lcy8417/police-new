import { useCallback, useMemo, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Plus } from "lucide-react"

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
    // 조회(read-only/idle): [+ 새 신발]. 편집 진입은 목록 클릭 또는 정보 Sheet의 [편집].
    return (
      <Button
        type="button"
        size="sm"
        onClick={() => navigate(shoeRegisterNewPath())}
        className="border border-[#2DD4BF]/40 bg-[#0F2624] text-[#5FE0D0] hover:border-[#2DD4BF]/60 hover:bg-[#123330] hover:text-[#2DD4BF]"
      >
        <Plus className="size-4" aria-hidden="true" />새 신발
      </Button>
    )
  }, [isNew, isEdit, modelNumber, navigate])

  usePageHeader({ title: headerTitle, actions: headerActions })

  // 목록 패널 — 워크벤치 4번째 열 하단에 신발 정보와 한 열로 합쳐 렌더한다(항상 표시).
  // 행 클릭·더블클릭 모두 곧바로 편집 모드로 진입한다(read-only 2단계 생략).
  const shoeListPanel = (
    <ShoeList
      shoes={shoes}
      selectedModelNumber={modelNumber}
      page={page}
      isLoading={shoesQuery.isFetching}
      onSelect={(value) => navigate(shoeEditModePath(value))}
      onEdit={(value) => navigate(shoeEditModePath(value))}
      onPageChange={setPage}
    />
  )

  // 국면 → 워크벤치 모드/초기값. 신규=빈 등록, 선택 신발=편집(mode=edit) 또는 저장
  // 후 조회(view), 미선택·딥링크 로딩=빈 조회 상태(목록에서 고르게 한다).
  let workbenchMode: "view" | "edit" | "new"
  let initialShoe: Shoe | undefined
  if (isNew) {
    workbenchMode = "new"
    initialShoe = undefined
  } else if (currentShoe) {
    workbenchMode = isEdit ? "edit" : "view"
    initialShoe = currentShoe
  } else {
    workbenchMode = "view"
    initialShoe = undefined
  }
  // 모드/신발 전환 시 리마운트해 formData·lineState·uploadedRef 잔상을 없앤다.
  const workbenchKey = isNew ? "new" : `${modelNumber || "none"}-${workbenchMode}`

  return (
    <div className="relative h-[calc(100vh-110px)] w-full overflow-hidden bg-background px-6 py-6">
      <DotGrid />
      <GlowOrb className="-top-24 right-1/4 h-72 w-72 bg-[#2563EB]/10" />
      <GlowOrb className="bottom-0 left-1/3 h-64 w-64 bg-[#4A9EFF]/8" />

      {/* 4열 커맨드센터: 캔버스 · 문양정보 · 문양리스트 + [신발정보 위 / 신발목록 아래] */}
      <ShoeWorkbench
        key={workbenchKey}
        mode={workbenchMode}
        initialShoe={initialShoe}
        onSaved={handleSaved}
        onEdit={
          modelNumber
            ? () => navigate(shoeEditModePath(modelNumber))
            : undefined
        }
        onNewRegister={() => navigate(shoeRegisterNewPath())}
        listPanel={shoeListPanel}
      />
    </div>
  )
}
