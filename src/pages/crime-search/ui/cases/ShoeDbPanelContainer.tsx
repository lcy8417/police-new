import { useCallback, useMemo, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query"

import { insertPatternPath } from "@/entities/pattern"
import { FEATURES } from "@/entities/session"
import {
  fetchShoeDetail,
  fetchShoesCount,
  fetchShoesList,
  shoeKeys,
  SHOES_PAGE_SIZE,
  type Shoe,
  type ShoePattern,
} from "@/entities/shoe"
import { hasFeature, isAdmin, useSessionStore } from "@/features/auth"
import { ShoeList } from "@/features/shoe-repository/ui/ShoeList"
import type { ScreenStatus } from "@/shared/lib/screen-status"
import { WorkbenchButton } from "@/shared/ui/kit"
import { ShoeDbPanel, type ShoeCardSize, type ShoeDbFilters, type ShoeDbView } from "@/widgets/shoe-db"
import { ShoeWorkbench } from "@/widgets/shoe-workbench"

// 신발 DB 슬라이드 패널 본문(새 사건관리 위 막대 「신발 DB」 · `/cases?shoe=1`, 결정 기록 §4).
// 목록 = 시안 `ShoeDbPanel` 에 실제 `fetchShoesList`(서버 50개씩) · `fetchShoesCount`.
// 신발을 열거나 「등록」 = 기존 편집 · 등록 동작 그대로(`ShoeWorkbench` — 문양 추출 `PatternCanvas` · `registerShoe` · `updateShoe`, 권한 `SHOE_EDIT`).
// 시안 편집 판(`ShoeEditor`) · 승인 흐름 · 등록관서/등록일자 거르기는 서버 신발 검수 묶음(J1~J8) 뒤에 — 지금은 숨김(showPlus=false).
// 거르기 칩 · 상세 조건은 서버 거르기 매개변수가 없어 **이 쪽(50개) 안에서만** 거른다.

const EMPTY_FILTERS: ShoeDbFilters = {
  ftwrId: "",
  makrCode: "",
  sex: "all",
  regFrom: "",
  regTo: "",
  brandCode: "",
  approval: "all",
  office: null,
  groupNm: "",
  patternInput: "all",
  shoeKind: "",
  remark: "",
}

const noop = () => {}

const hasPattern = (s: Shoe) => s.top.length + s.mid.length + s.bottom.length + s.outline.length > 0
const has = (value: string | null | undefined, needle: string) => (value ?? "").toLowerCase().includes(needle)

/** 이 쪽 안 거르기 — 빠른 찾기(화류번호 · 모델명 · 상표) + 걸린 상세 조건(화류번호 · 상표 · 제조사 · 문양 입력) */
function filterShoes(shoes: readonly Shoe[], query: string, filters: ShoeDbFilters | null): Shoe[] {
  const q = query.trim().toLowerCase()
  return shoes.filter((s) => {
    if (q !== "" && !(has(s.ftwrId, q) || has(s.modlNm, q) || has(s.brandCode, q))) return false
    if (!filters) return true
    if (filters.ftwrId.trim() !== "" && !has(s.ftwrId, filters.ftwrId.trim().toLowerCase())) return false
    if (filters.brandCode.trim() !== "" && !has(s.brandCode, filters.brandCode.trim().toLowerCase())) return false
    if (filters.makrCode.trim() !== "" && !has(s.makrCode, filters.makrCode.trim().toLowerCase())) return false
    if (filters.patternInput === "in" && !hasPattern(s)) return false
    if (filters.patternInput === "out" && hasPattern(s)) return false
    return true
  })
}

/** 서버는 문양 이름만 준다 — 편집 시드로 넘기기 전에 경로를 붙인다(신발 문양 = 문자열, docs/pattern-data-model.md §3) */
function hydrateShoe(shoe: Shoe): Shoe {
  const zone = (list: ShoePattern[] = []) => list.map((entry) => insertPatternPath(entry) as ShoePattern)
  return { ...shoe, top: zone(shoe.top), mid: zone(shoe.mid), bottom: zone(shoe.bottom), outline: zone(shoe.outline) }
}

export interface ShoeDbPanelContainerProps {
  /** 편집(보기)로 연 신발 ID(주소 `ftwr`, 앞자리 0 보존). 없으면 목록 */
  ftwrId: string | null
  /** 새 신발 등록 중(주소 `shoeNew=1`) */
  isNew: boolean
  onOpenShoe: (ftwrId: string) => void
  onNewShoe: () => void
  /** 편집 판 → 목록 */
  onBackToList: () => void
}

export function ShoeDbPanelContainer({ ftwrId, isNew, onOpenShoe, onNewShoe, onBackToList }: ShoeDbPanelContainerProps) {
  const user = useSessionStore((s) => s.user)
  const canEdit = hasFeature(user, FEATURES.SHOE_EDIT)
  const queryClient = useQueryClient()

  // 목록 쪽(1부터) — 서버 쪽은 0부터
  const [page, setPage] = useState(1)
  const [view, setView] = useState<ShoeDbView>("pattern")
  const [cardSize, setCardSize] = useState<ShoeCardSize>("보통")
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState<ShoeDbFilters>(EMPTY_FILTERS)
  // 「조회」로 건 상세 조건(펴 놓고 고치는 값과 따로)
  const [applied, setApplied] = useState<ShoeDbFilters | null>(null)
  const [infoSheetOpen, setInfoSheetOpen] = useState(false)

  const countQuery = useQuery({ queryKey: shoeKeys.count(), queryFn: fetchShoesCount })
  const total = countQuery.data ?? 0
  const shoesQuery = useQuery({
    queryKey: shoeKeys.list(page - 1),
    queryFn: () => fetchShoesList(page - 1),
    placeholderData: keepPreviousData,
  })
  const pageShoes = useMemo(() => shoesQuery.data ?? [], [shoesQuery.data])
  const shown = useMemo(() => filterShoes(pageShoes, query, applied), [pageShoes, query, applied])

  const editing = isNew || ftwrId !== null
  const detailQuery = useQuery({
    queryKey: shoeKeys.detail(ftwrId ?? ""),
    queryFn: () => fetchShoeDetail(ftwrId ?? ""),
    enabled: !isNew && ftwrId !== null,
  })
  const currentShoe = useMemo(() => (detailQuery.data ? hydrateShoe(detailQuery.data) : undefined), [detailQuery.data])

  // 저장(등록 · 수정) 성공 → 목록 캐시 무효화 후 그 신발 편집으로(옛 신발 화면과 같은 동작)
  const handleSaved = useCallback(
    (saved: string) => {
      setInfoSheetOpen(false)
      void queryClient.invalidateQueries({ queryKey: ["shoes"] })
      if (saved) onOpenShoe(saved)
      else onBackToList()
    },
    [queryClient, onOpenShoe, onBackToList]
  )

  if (editing) {
    const totalPages = Math.max(1, Math.ceil(total / SHOES_PAGE_SIZE))
    // 모드 · 신발 전환이나 상세 도착 때 다시 그려 편집 시드를 새로(옛 신발 화면과 같은 key 규칙)
    const workbenchKey = isNew ? "new" : currentShoe ? `${ftwrId}-edit` : `${ftwrId ?? "none"}-loading`
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex shrink-0 items-center gap-2 border-0 border-b border-solid border-border px-[14px] py-[6px]">
          <WorkbenchButton size="sm" variant="ghost" icon={ArrowLeft} onClick={onBackToList}>
            목록
          </WorkbenchButton>
          <b className="font-code text-[12.5px] text-foreground">{isNew ? "새 신발 등록" : ftwrId}</b>
          {!canEdit ? <span className="text-[11.5px] text-muted-foreground">보기 전용</span> : null}
        </div>
        <div data-theme="dark" className="relative min-h-0 flex-1 overflow-hidden bg-canvas p-3">
          <ShoeWorkbench
            key={workbenchKey}
            mode={isNew ? "new" : "edit"}
            canEdit={canEdit}
            initialShoe={isNew ? undefined : currentShoe}
            onSaved={handleSaved}
            onNewRegister={onNewShoe}
            onBrowseList={onBackToList}
            listPanel={
              <ShoeList
                shoes={pageShoes}
                total={total}
                page={page - 1}
                totalPages={totalPages}
                selectedFtwrId={ftwrId ?? ""}
                isLoading={shoesQuery.isFetching}
                onSelect={(id) => {
                  // 고른 줄을 한 번 더 누르면 기본정보 시트(옛 신발 화면과 같음)
                  if (canEdit && id === ftwrId) setInfoSheetOpen(true)
                  else {
                    setInfoSheetOpen(false)
                    onOpenShoe(id)
                  }
                }}
                onPageChange={(p) => setPage(p + 1)}
              />
            }
            infoSheetOpen={infoSheetOpen}
            onInfoSheetOpenChange={setInfoSheetOpen}
          />
        </div>
      </div>
    )
  }

  const status: ScreenStatus = shoesQuery.isPending
    ? "loading"
    : shoesQuery.isError
      ? "error"
      : pageShoes.length === 0
        ? "empty"
        : "ready"
  const clearQuick = () => setQuery("")

  return (
    <ShoeDbPanel
      showPlus={false}
      status={status}
      onRetry={() => void shoesQuery.refetch()}
      isAdmin={user ? isAdmin(user) : false}
      features={user?.features ?? []}
      filters={filters}
      onFiltersChange={setFilters}
      filtersApplied={applied !== null}
      officeItems={[]}
      onSearch={() => setApplied(filters)}
      onReset={() => {
        setFilters(EMPTY_FILTERS)
        setApplied(null)
      }}
      view={view}
      onViewChange={setView}
      shoes={shown}
      total={total}
      page={page}
      pageSize={SHOES_PAGE_SIZE}
      onPageChange={setPage}
      onOpenShoe={onOpenShoe}
      onRegister={onNewShoe}
      dialog={null}
      onFormChange={noop}
      onSave={noop}
      onCloseDialog={noop}
      onReplaceImage={noop}
      onRotateImage={noop}
      quick={{
        query,
        onQueryChange: setQuery,
        groups: [],
        onGroupChange: noop,
        onClear: clearQuick,
        resultCount: shown.length,
        total: pageShoes.length,
      }}
      cardSize={cardSize}
      onCardSizeChange={setCardSize}
      library={{}}
      extractState="idle"
      onExtract={noop}
      onConfirmAi={noop}
      onApprove={noop}
    />
  )
}
