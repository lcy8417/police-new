import * as React from "react"

import type { Shoe } from "@/entities/shoe"
import { cn } from "@/shared/lib/utils"
import { FEATURES } from "@/entities/session"
import { Button, Chip, Combobox, DataGrid, Field, InlineError, Pagination, RadioRow, Segmented, type DataGridColumn } from "@/shared/ui/kit"
import { ButtonBar, Crumb, PageHead, Panel, SearchForm, type SearchFormRow } from "@/shared/ui/panel"
import { SoleThumb } from "@/shared/ui/viewer"

import type { ShoeDbFilters, ShoeDbScreenProps } from "../model/types"
import { ShoeCard } from "./ShoeCard"
import { ShoeInfoDialog } from "./ShoeInfoDialog"
import { StageStrip } from "./StageStrip"

// S10 신발문양 관리: 검색 폼 3열 → 목록 머리 + 툴바 → (신규) 작업 단계 줄 → 목록(표 / 카드) → 쪽 넘김. 행을 누르면 같은 자리 레이어 창 1겹.
const AI_RECOMMEND_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "check", label: "확인 필요" },
]

const SEX_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "M", label: "남" },
  { value: "F", label: "여" },
  { value: "mix", label: "혼용" },
]
const APPROVAL_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "yes", label: "승인" },
  { value: "no", label: "미승인" },
]
const PATTERN_INPUT_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "in", label: "입력" },
  { value: "out", label: "미입력" },
]

const hasPattern = (s: Shoe) => s.top.length + s.mid.length + s.bottom.length + s.outline.length > 0

export function ShoeDbScreen(props: ShoeDbScreenProps) {
  const { status, errorAt, onRetry, isAdmin, features, filters, onFiltersChange, officeItems, onSearch, onReset } = props
  const { view, onViewChange, shoes, total, page, pageSize, onPageChange, selectedId, onOpenShoe, onRegister, dialog } = props

  const { showPlus = true, onPlusAction, stageSummary, cardInfo, aiDetails } = props
  // 신발정보관리 창이 뒤 목록 위에 깔릴 칸(시안: 화면 칸 안의 절대 위치)
  const [layerHost, setLayerHost] = React.useState<HTMLDivElement | null>(null)

  const canEdit = isAdmin || features.includes(FEATURES.SHOE_EDIT)
  const canAiReview = isAdmin || features.includes(FEATURES.SHOE_COLLECT_REVIEW)
  // 「AI 추천」 칸은 눌림만 화면에 둔다(거르기 자체는 준비 중 알림)
  const [aiRecommend, setAiRecommend] = React.useState("all")
  const plan = (what: string) => () => onPlusAction(what)
  const set = (patch: Partial<ShoeDbFilters>) => onFiltersChange({ ...filters, ...patch })
  const text = (key: keyof ShoeDbFilters, label: string) => (
    <Field aria-label={label} value={(filters[key] as string | null) ?? ""} onChange={(e) => set({ [key]: e.target.value })} />
  )

  // SCAS 순서: 3열 × 4행 (마지막 줄은 두 쌍)
  const rows: SearchFormRow[] = [
    { label: "화류번호", field: <Field variant="mono" aria-label="화류번호" placeholder="(신발 번호)" value={filters.ftwrId} onChange={(e) => set({ ftwrId: e.target.value })} /> },
    { label: "제조사", field: text("makrCode", "제조사") },
    { label: "성별", field: <RadioRow name="성별" options={SEX_OPTIONS} value={filters.sex} onValueChange={(sex) => set({ sex })} /> },
    {
      label: "등록일자",
      field: (
        <span className="flex items-center gap-[6px]">
          <Field variant="mono" aria-label="등록일자 시작일" value={filters.regFrom} onChange={(e) => set({ regFrom: e.target.value })} />
          <span aria-hidden="true">~</span>
          <Field variant="mono" aria-label="등록일자 종료일" value={filters.regTo} onChange={(e) => set({ regTo: e.target.value })} />
        </span>
      ),
    },
    { label: "상표", field: text("brandCode", "상표") },
    { label: "승인", field: <RadioRow name="승인" options={APPROVAL_OPTIONS} value={filters.approval} onValueChange={(approval) => set({ approval })} /> },
    { label: "등록관서", field: <Combobox items={officeItems} value={filters.office} onValueChange={(office) => set({ office })} placeholder="전체" /> },
    { label: "그룹명", field: text("groupNm", "그룹명") },
    {
      label: "문양 입력",
      field: <RadioRow name="문양 입력" options={PATTERN_INPUT_OPTIONS} value={filters.patternInput} onValueChange={(patternInput) => set({ patternInput })} />,
    },
    { label: "화종", field: text("shoeKind", "화종") },
    { label: "비고", field: text("remark", "비고") },
    ...(showPlus
      ? [
          {
            label: "AI 추천",
            field: (
              <span data-plus="" className="inline-flex">
                <RadioRow
                  name="AI 추천"
                  options={AI_RECOMMEND_OPTIONS}
                  value={aiRecommend}
                  onValueChange={(v) => {
                    setAiRecommend(v)
                    onPlusAction("AI 추천 거르기")
                  }}
                />
              </span>
            ),
          },
        ]
      : []),
  ]

  const columns: DataGridColumn<Shoe>[] = [
    {
      key: "image",
      header: "바닥",
      render: (s) => (s.image ? <SoleThumb src={s.image} alt={`${s.ftwrId} 바닥`} size="sm" onClick={() => onOpenShoe(s.ftwrId)} /> : <span className="text-dim">—</span>),
    },
    { key: "ftwrId", header: "화류번호", render: (s) => <span className="font-code tabular-nums">{s.ftwrId}</span> },
    { key: "group", header: "그룹명", wrap: true, render: (s) => s.ftwrGroupNm ?? "" },
    { key: "modl", header: "모델명", wrap: true, render: (s) => s.modlNm ?? "" },
    { key: "brand", header: "상표코드", render: (s) => s.brandCode ?? "" },
    { key: "makr", header: "제조사코드", render: (s) => s.makrCode ?? "" },
    { key: "place", header: "수집처", wrap: true, render: (s) => s.colctPlace ?? "" },
    { key: "year", header: "수집연도", render: (s) => s.colctYear ?? "" },
    { key: "pattern", header: "문양", render: (s) => <Chip>{hasPattern(s) ? "입력" : "미입력"}</Chip> },
  ]

  const toolbar = (
    <ButtonBar>
      <Segmented
        scas
        aria-label="보기 방식"
        value={view}
        onValueChange={(v) => onViewChange(v === "pattern" ? "pattern" : "list")}
        items={[
          { value: "list", label: "목록보기" },
          { value: "pattern", label: "문양보기" },
        ]}
      />
      <Button size="sm" variant="pri" onClick={onSearch}>
        조회
      </Button>
      <Button size="sm" onClick={plan("엑셀")}>
        엑셀
      </Button>
      {canEdit && (
        <>
          {/* 시안 data-lock=admin: 관리자만 누르고 그 밖은 잠긴 모양 */}
          <Button size="sm" variant="danger" locked={!isAdmin} onClick={plan("삭제")}>
            삭제
          </Button>
          <Button size="sm" variant="ok" locked={!isAdmin} title="승인 담당만" onClick={plan("승인")}>
            승인
          </Button>
          <Button size="sm" onClick={onRegister}>
            등록
          </Button>
        </>
      )}
      <Button size="sm" onClick={onReset}>
        초기화
      </Button>
      {canEdit && (
        <>
          <span aria-hidden="true" className="h-[20px] w-px bg-line-3" />
          <Button size="sm" onClick={plan("엑셀 일괄 등록")}>
            엑셀 일괄 등록
          </Button>
        </>
      )}
    </ButtonBar>
  )

  let body: React.ReactNode
  if (status === "loading") {
    body = <p className="m-0 px-[14px] py-[24px] text-center text-[12.5px] text-muted-foreground">불러오는 중</p>
  } else if (status === "error") {
    body = (
      <div className="px-[14px] py-[24px] text-center">
        <InlineError message="신발 목록을 불러오지 못했습니다" at={errorAt} onRetry={onRetry} />
      </div>
    )
  } else if (view === "pattern" && status === "ready") {
    body = (
      <div className="grid grid-cols-[repeat(9,minmax(0,1fr))] gap-[8px] px-[14px] py-[10px]">
        {shoes.map((s) => (
          <ShoeCard
            key={s.ftwrId}
            shoe={s}
            selected={s.ftwrId === selectedId}
            hasPattern={hasPattern(s)}
            info={showPlus ? cardInfo?.[s.ftwrId] : undefined}
            onOpen={onOpenShoe}
          />
        ))}
      </div>
    )
  } else {
    // empty 는 행 0건 그대로 DataGrid 의 「결과 없음」 — 오류와 구분된다
    body = <DataGrid columns={columns} rows={status === "empty" ? [] : shoes} rowKey={(s) => s.ftwrId} selectedKey={selectedId} onRowClick={(s) => onOpenShoe(s.ftwrId)} />
  }

  return (
    <div ref={setLayerHost} aria-busy={status === "loading"} className={cn("relative grid content-start gap-[10px]", dialog && "min-h-[1240px]")}>
      <PageHead title="신발문양 관리" />
      <Crumb items={["족윤적", "문양관리", "신발문양 관리"]} />
      <Panel variant="tc">
        <SearchForm columns={3} rows={rows} />
      </Panel>
      <Panel variant="tc" title="신발문양 관리 목록" actions={toolbar}>
        {showPlus && stageSummary && (
          <div data-plus="">
            <StageStrip summary={stageSummary} />
          </div>
        )}
        <div className="max-w-full overflow-x-auto">{body}</div>
        {(status === "ready" || status === "empty") && (
          <Pagination total={status === "empty" ? 0 : total} page={page} pageSize={pageSize} hasNext={page * pageSize < total} onPageChange={onPageChange} />
        )}
      </Panel>
      {dialog && (
        <ShoeInfoDialog
          dialog={dialog}
          container={layerHost}
          canEdit={canEdit}
          isAdmin={isAdmin}
          canAiReview={canAiReview}
          showPlus={showPlus}
          onPlusAction={onPlusAction}
          detail={aiDetails?.[dialog.form.ftwrId]}
          workStatus={cardInfo?.[dialog.form.ftwrId]?.status}
          onFormChange={props.onFormChange}
          onSave={props.onSave}
          onClose={props.onCloseDialog}
          onReplaceImage={props.onReplaceImage}
          onRotateImage={props.onRotateImage}
        />
      )}
    </div>
  )
}
