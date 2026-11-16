import * as React from "react"

import { FEATURES } from "@/entities/session"
import { cn } from "@/shared/lib/utils"
import {
  Button,
  Checkbox,
  Chip,
  DataGrid,
  Field,
  InlineError,
  Pagination,
  RadioRow,
  Segmented,
  type DataGridColumn,
} from "@/shared/ui/kit"
import { ButtonBar, Panel, SearchForm, type SearchFormRow } from "@/shared/ui/panel"
import { SoleThumb } from "@/shared/ui/viewer"

import type { CaseListFilters, CaseListRow, CaseListScreenProps } from "../model/types"

// S01 사건관리 목록(SCAS 「족윤적 > 사건관리」 탭). 값만 받아 그린다 — 서버 호출 · 전역 상태 없음.
// 검색 폼 3열×5행 · 툴바 순서 · 열 순서는 SCAS 그대로(정본 스킬 원칙). 새 열은 넣지 않는다.

type ViewMode = "basic" | "full"

const dash = (v: string) => (v === "" ? "—" : v)

function Num({ v, tone }: { v: number; tone?: string }) {
  return <span className={cn("font-code tabular-nums", v ? (tone ?? "text-foreground") : "text-faint")}>{v}</span>
}

/** 장마다 한 칸짜리 막대(회색 등록 · 주황 검색 · 파랑 확인) */
function ProgressCell({ row }: { row: CaseListRow }) {
  const { registered, searched, confirmed } = row.progress
  const cells = [
    ...Array<string>(confirmed).fill("bg-brand-2"),
    ...Array<string>(searched).fill("bg-warn"),
    ...Array<string>(registered).fill("bg-line-3"),
  ]
  return (
    <div className="grid gap-[3px]">
      <div className="grid grid-cols-3 gap-[2px] text-center text-[11.5px]">
        <Num v={registered} />
        <Num v={searched} />
        <Num v={confirmed} />
      </div>
      <div
        className="flex gap-[2px]"
        title={`${cells.length}장 중 등록 ${registered} · 검색 ${searched} · 확인 ${confirmed}`}
      >
        {cells.map((c, i) => (
          <i key={i} className={cn("h-[4px] flex-1 rounded-[2px]", c)} />
        ))}
      </div>
    </div>
  )
}

function ResultCell({ row }: { row: CaseListRow }) {
  const { found, missed, unable } = row.results
  return (
    <div className="grid grid-cols-3 gap-[2px] text-center text-[11.5px]">
      <Num v={found} tone="text-ok-fg" />
      <Num v={missed} tone="text-fg-2" />
      <Num v={unable} tone="text-warn" />
    </div>
  )
}

function Clip({ text, max }: { text: string; max: string }) {
  return (
    <span title={text} className={cn("block truncate", max)}>
      {dash(text)}
    </span>
  )
}

const FIELD_ARIA = (label: string) => ({ "aria-label": label })

export function CaseListScreen({
  status,
  errorAt,
  onRetry,
  isAdmin,
  features,
  rows,
  total,
  page,
  pageSize,
  onPageChange,
  filters,
  onFiltersChange,
  onSearch,
  onReset,
  onExport,
  listMode,
  onListModeChange,
  onOpenCase,
  onRegister,
  onSearchCase,
  onConfirmCase,
}: CaseListScreenProps) {
  // 보기 방식은 저장하지 않는 화면 안 모양이라 위젯 안 상태(spec §6-1)
  const [viewMode, setViewMode] = React.useState<ViewMode>("basic")

  const canRegister = isAdmin || features.includes(FEATURES.CRIME_REGISTER)
  const canSearch = isAdmin || features.includes(FEATURES.CRIME_SEARCH)

  const set = <K extends keyof CaseListFilters>(key: K, value: CaseListFilters[K]) =>
    onFiltersChange({ ...filters, [key]: value })
  const text = (key: keyof CaseListFilters, label: string, variant: "text" | "mono" = "text") => (
    <Field
      variant={variant}
      value={String(filters[key])}
      onChange={(e) => set(key, e.target.value as never)}
      {...FIELD_ARIA(label)}
    />
  )
  const select = (key: keyof CaseListFilters, label: string) => (
    <Field
      variant="select"
      value={String(filters[key])}
      placeholder="전체"
      onChange={(e) => set(key, e.target.value as never)}
      {...FIELD_ARIA(label)}
    />
  )
  const office = (key: keyof CaseListFilters, label: string) => (
    <span className="flex gap-[4px]">
      {text(key, label)}
      <Button size="sm-h26" disabled title="준비 중" aria-label={`${label} 찾기`}>
        검색
      </Button>
    </span>
  )

  // 시안 3열×5행 순서 그대로(줄 단위로 읽는다). 마지막 줄 빈 칸 두 쌍은 그리지 않는다.
  const formRows: SearchFormRow[] = [
    { label: "감정번호", field: text("aprthngNo", "감정번호", "mono") },
    { label: "문서번호", field: text("docNo", "문서번호") },
    { label: "사건명", field: select("caseName", "사건명") },
    {
      label: "등록일자",
      field: (
        <span className="flex items-center gap-[4px]">
          <Field
            variant="mono-sm"
            value={filters.registeredFrom}
            onChange={(e) => set("registeredFrom", e.target.value)}
            aria-label="등록일자 시작"
          />
          <span aria-hidden="true">~</span>
          <Field
            variant="mono-sm"
            value={filters.registeredTo}
            onChange={(e) => set("registeredTo", e.target.value)}
            aria-label="등록일자 끝"
          />
        </span>
      ),
    },
    { label: "피해자", field: text("victim", "피해자") },
    {
      label: "구분",
      field: (
        <RadioRow
          name="구분"
          value={filters.kind}
          onValueChange={(v) => set("kind", v as CaseListFilters["kind"])}
          options={[
            { value: "all", label: "전체" },
            { value: "shoe", label: "신발" },
            { value: "tire", label: "타이어" },
          ]}
        />
      ),
    },
    { label: "사건장소", field: text("place", "사건장소") },
    { label: "검거여부", field: select("arrested", "검거여부") },
    { label: "작성자", field: text("author", "작성자") },
    { label: "처리관서", field: office("processOffice", "처리관서") },
    { label: "의뢰관서", field: office("requestOffice", "의뢰관서") },
    { label: "발생관서", field: office("occurOffice", "발생관서") },
    {
      label: "사건결과",
      field: (
        <span className="flex items-center gap-[8px]">
          {select("caseResult", "사건결과")}
          <label className="flex items-center gap-[4px] whitespace-nowrap text-[12px] text-muted-foreground">
            <Checkbox
              checked={filters.awaitingResult}
              onCheckedChange={(c) => set("awaitingResult", c === true)}
              aria-label="결과 확인 전"
            />
            결과 확인 전
          </label>
        </span>
      ),
    },
    { label: "타기관여부", field: select("otherOrg", "타기관여부") },
  ]

  const actionCol: DataGridColumn<CaseListRow> = {
    key: "act",
    header: "검색 · 확인 · 검증",
    render: (r) => (
      <span className="inline-flex items-center gap-[4px]">
        {canSearch && r.progress.registered > 0 ? (
          <Button size="sm" variant="ok" row onClick={() => onSearchCase(r.aprthngNo)}>
            검색
          </Button>
        ) : null}
        {canSearch && (r.progress.searched > 0 || r.progress.confirmed > 0) ? (
          <Button size="sm" variant="ok" row onClick={() => onConfirmCase(r.aprthngNo)}>
            확인
          </Button>
        ) : null}
        {r.progress.registered === 0 && r.progress.searched === 0 ? (
          <Button size="sm" row disabled title="준비 중">
            검증요청
          </Button>
        ) : null}
      </span>
    ),
  }

  const col = (
    key: string,
    header: string,
    render: (r: CaseListRow) => React.ReactNode,
    extra: Partial<DataGridColumn<CaseListRow>> = {}
  ): DataGridColumn<CaseListRow> => ({ key, header, render, ...extra })

  const indexOf = (r: CaseListRow) => rows.indexOf(r) + 1 + (page - 1) * pageSize
  const idx = col("no", "순번", (r) => <span className="font-code tabular-nums text-dim">{indexOf(r)}</span>)
  const img = col("img", "이미지", (r) => (
    <SoleThumb
      src={r.thumbSrc}
      alt={`${r.aprthngNo} 이미지`}
      size="sm"
      tabIndex={-1}
      onClick={() => onOpenCase(r.aprthngNo)}
    />
  ))
  const no = col("aprthngNo", "감정번호", (r) => <span className="font-code text-[12px] text-foreground">{r.aprthngNo}</span>)
  const doc = col("docNo", "문서번호", (r) => <span className="font-code text-[11.5px]">{dash(r.docNo)}</span>)
  const name = col("caseName", "사건명", (r) => <Clip text={r.caseName} max="max-w-[16rem]" />)
  const req = col("req", "의뢰관서 (SCAS번호)", (r) => (
    <span className="grid leading-[1.3]">
      <Clip text={r.requestOffice} max="max-w-[10rem]" />
      <span className="font-code text-[10.5px] text-dim">{dash(r.scasNo)}</span>
    </span>
  ))
  const proc = col("proc", "처리관서", (r) => <Clip text={r.processOffice} max="max-w-[10rem]" />)
  const occ = col("occ", "발생관서", (r) => <Clip text={r.occurOffice} max="max-w-[10rem]" />)
  const kind = col("kind", "처리 구분", (r) =>
    r.kind === "대조" ? <Chip variant="violet-h20">대조</Chip> : <span>현장</span>
  )
  const count = col("count", "개수 (신발, 타이어)", (r) => (
    <span className="font-code tabular-nums">
      <b className="text-foreground">{r.shoeCount + r.tireCount}</b>{" "}
      <span className="text-dim">
        ({r.shoeCount}, {r.tireCount})
      </span>
    </span>
  ))
  const sus = col("sus", "용의자", (r) => <span className={r.suspect === "유" ? "text-danger" : undefined}>{r.suspect}</span>)
  const reg = col("reg", "등록일자", (r) => <span className="font-code tabular-nums text-[12px]">{r.registeredAt}</span>)
  const confirmedAt = col("confirmedAt", "결과확인 완료일자", (r) => (
    <span className="font-code tabular-nums text-[12px]">{dash(r.confirmedAt)}</span>
  ))
  const result = col("caseResult", "사건 결과", (r) => dash(r.caseResult))
  const receiver = col("receiver", "접수자", (r) => dash(r.receiver))
  const author = col("author", "작성자", (r) => dash(r.author))

  const columns: DataGridColumn<CaseListRow>[] =
    viewMode === "basic"
      ? [
          idx, img, no, doc, name, req, occ, kind, count, sus, reg,
          col("result", "결과 · 장 (발견 불발 불능)", (r) => <ResultCell row={r} />),
          col("progress", "진행상태 · 장 (등록 검색 확인)", (r) => <ProgressCell row={r} />),
          actionCol,
        ]
      : [
          idx, img, no, doc, name, req, proc, occ, kind, count, sus, reg, confirmedAt, result, receiver, author,
          col("found", "발견", (r) => <Num v={r.results.found} tone="text-ok-fg" />, { align: "right" }),
          col("missed", "불발", (r) => <Num v={r.results.missed} tone="text-fg-2" />, { align: "right" }),
          col("unable", "불능", (r) => <Num v={r.results.unable} tone="text-warn" />, { align: "right" }),
          col("p0", "등록", (r) => <Num v={r.progress.registered} />, { align: "right" }),
          col("p1", "검색", (r) => <Num v={r.progress.searched} tone="text-warn" />, { align: "right" }),
          col("p2", "확인", (r) => <Num v={r.progress.confirmed} tone="text-brand" />, { align: "right" }),
          col("a1", "검색", (r) =>
            canSearch && r.progress.registered > 0 ? (
              <Button size="sm" variant="ok" row onClick={() => onSearchCase(r.aprthngNo)}>
                검색
              </Button>
            ) : null
          ),
          col("a2", "확인", (r) =>
            canSearch && (r.progress.searched > 0 || r.progress.confirmed > 0) ? (
              <Button size="sm" variant="ok" row onClick={() => onConfirmCase(r.aprthngNo)}>
                확인
              </Button>
            ) : null
          ),
          col("a3", "검증", (r) =>
            r.progress.registered === 0 && r.progress.searched === 0 ? (
              <Button size="sm" row disabled title="준비 중">
                검증요청
              </Button>
            ) : null
          ),
        ]

  const showTotal = (status === "ready" || status === "empty") && total !== undefined

  return (
    <div className="grid gap-[12px]" aria-busy={status === "loading" ? "true" : undefined}>
      <Panel partId="S01-14">
        <SearchForm columns={3} rows={formRows} />
      </Panel>

      <Panel
        corners
        title="사건관리 목록"
        actions={
          <>
            {showTotal ? <span className="text-[12px] text-dim">전체 {total}건</span> : null}
            <ButtonBar aria-label="사건관리 목록 도구">
              <RadioRow
                name="보기"
                value={listMode}
                onValueChange={(v) => onListModeChange(v as "list" | "pattern")}
                options={[
                  { value: "list", label: "목록보기" },
                  { value: "pattern", label: "문양보기" },
                ]}
                className="mr-[6px] text-[12px]"
              />
              <Button size="sm" onClick={onReset}>
                초기화
              </Button>
              <Button size="sm" onClick={onExport}>
                엑셀
              </Button>
              <Button size="sm" onClick={onSearch}>
                조회
              </Button>
              {canRegister ? (
                <Button size="sm" variant="pri" onClick={onRegister}>
                  등록
                </Button>
              ) : null}
              <span aria-hidden="true" className="h-[20px] w-px bg-line-3" />
              <Segmented
                aria-label="열 보기"
                value={viewMode}
                onValueChange={(v) => setViewMode(v as ViewMode)}
                items={[
                  { value: "basic", label: "기본 보기 14열" },
                  { value: "full", label: "SCAS 열 전체 보기 25열" },
                ]}
              />
            </ButtonBar>
          </>
        }
      >
        {status === "loading" ? (
          <p role="status" className="px-[14px] py-[24px] text-center text-[12.5px] text-muted-foreground">
            사건 목록을 불러오는 중…
          </p>
        ) : status === "error" ? (
          <div className="px-[14px] py-[24px] text-center">
            <InlineError message="사건 목록을 확인하지 못했습니다" at={errorAt} onRetry={onRetry} />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <DataGrid
                columns={columns}
                rows={status === "empty" ? [] : [...rows]}
                rowKey={(r) => r.aprthngNo}
                onRowClick={(r) => onOpenCase(r.aprthngNo)}
                emptyText="결과 없음"
              />
            </div>
            <Pagination
              total={status === "empty" ? 0 : total}
              page={page}
              pageSize={pageSize}
              hasNext={status === "ready" && total !== undefined && page * pageSize < total}
              onPageChange={onPageChange}
            />
          </>
        )}
      </Panel>
    </div>
  )
}
