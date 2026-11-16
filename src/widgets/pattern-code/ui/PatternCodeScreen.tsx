import * as React from "react"

import type { CrimeHistoryRow } from "@/entities/crime"
import { FEATURES } from "@/entities/session"
import { AiProgress, ScanOverlay } from "@/shared/ui/ai"
import { Button, Chip, DataGrid, InlineError, Segmented, type DataGridColumn } from "@/shared/ui/kit"
import { ButtonBar, Panel } from "@/shared/ui/panel"

import { patternName, ZONE_ROWS } from "../model/constants"
import type { PatternCodeScreenProps, ResearchState, SearchImageSource } from "../model/types"
import { Band } from "./Band"
import { ExtractResults } from "./ExtractResults"
import { MatchConditions } from "./MatchConditions"
import { PalettePanel } from "./PalettePanel"
import { ZoneRows } from "./ZoneRows"

const SOURCES = [
  { value: "original", label: "원본" },
  { value: "edited", label: "편집본" },
]

/** 검색 이력 열 — 지금 앱 F22 열 그대로(ID · 등록일시 · 순위 · 매칭된 신발 정보) */
const HISTORY_COLUMNS: DataGridColumn<CrimeHistoryRow>[] = [
  { key: "searchNo", header: "ID", render: (r) => <span className="font-code">{r.searchNo}</span> },
  { key: "frstRegistDt", header: "등록일시", wrap: true, render: (r) => <span className="font-code text-[11.5px]">{r.frstRegistDt}</span> },
  { key: "ranking", header: "순위", align: "right", render: (r) => <span className="font-code">{r.ranking}</span> },
  {
    key: "mtchgId",
    header: "매칭된 신발 정보",
    // 신발 ID는 문자열 그대로(앞자리 0 보존)
    render: (r) => (r.mtchgId == null ? <span className="text-dim">매칭 없음</span> : <span className="font-code">{r.mtchgId}</span>),
  },
]

const IMAGE_COLUMNS: DataGridColumn<string>[] = [
  { key: "no", header: "이미지 번호", render: (no) => <span className="font-code text-[11.5px]">{no}</span> },
]

/** 필수 문양을 바꾼 뒤 실시간 재검색 줄(F20). idle 이면 안내만 */
function ResearchLine({ state, essentialCount }: { state: ResearchState; essentialCount: number }) {
  return (
    <div role="status" className="flex min-h-[24px] items-center gap-[8px] px-[10px] text-[11.5px] text-muted-foreground">
      {state === "running" ? (
        <>
          <span className="whitespace-nowrap">검색 결과 갱신 중…</span>
          <AiProgress state="running" label="검색 결과 갱신" className="flex-1" />
        </>
      ) : state === "done" ? (
        <span>필수 문양 {essentialCount}개로 검색 결과를 갱신했습니다.</span>
      ) : (
        <span>필수 문양({essentialCount}개)만 검색에 쓰입니다 — 바꾸면 결과를 다시 찾습니다.</span>
      )}
    </div>
  )
}

/**
 * S04 문양 코딩 · 검색 조건 —SCAS 「문양 상세보기」 3열(왼쪽 현장 이미지 · 이미지 목록 · 코드 설명 / 가운데 문양 행 ·
 * 팔레트 / 오른쪽 매칭 조건 · 검색이력)과 버튼 줄 그대로. 따로 뜨던 AI 창은 왼쪽 그림 안으로(시안 핀 9).
 * 서버 호출 · 전역 상태 없음, 값은 모두 props(제어형). 경계선 캔버스는 슬롯.
 */
export function PatternCodeScreen(props: PatternCodeScreenProps) {
  const { status, errorAt, onRetry, isAdmin, features, aprthngNo, zones, selectedZone } = props
  const canEdit = isAdmin || features.includes(FEATURES.CRIME_SEARCH)
  const inserted = React.useMemo(
    () => new Set(zones[selectedZone].map(([path]) => patternName(path))),
    [zones, selectedZone],
  )
  const essentialCount = ZONE_ROWS.reduce((n, { zone }) => n + zones[zone].filter(([, flag]) => Boolean(flag)).length, 0)
  const extractLabel =props.searchImage === "edited" ? "✦ 편집한 이미지로 다시 추출" : "✦ 원본 이미지로 추출"

  const buttons = (
    <ButtonBar variant="modal-head" aria-label="문양 상세보기 버튼">
      <span title="준비 중" className="inline-flex">
        <Button size="sm" disabled>
          인공지능문양관리
        </Button>
      </span>
      <Button size="sm" onClick={props.onOpenResults}>
        검색결과
      </Button>
      <Button size="sm" variant="pri" title="신발 검색" disabled={!canEdit} onClick={props.onSearch}>
        검색
      </Button>
      <Button size="sm" disabled={!canEdit} onClick={props.onReset}>
        다시입력
      </Button>
      <Button size="sm" onClick={props.onClose}>
        닫기
      </Button>
      <span aria-hidden="true" className="h-[20px] w-px bg-line-3" />
      <Segmented
        aria-label="검색 이미지"
        items={SOURCES}
        value={props.searchImage}
        onValueChange={(v) => props.onSearchImageChange(v as SearchImageSource)}
        className="p-[2px] [&_button]:px-[8px] [&_button]:py-[2px] [&_button]:text-[11.5px]"
      />
      <Button size="sm" variant="ai" disabled={!canEdit || props.extractState === "running"} onClick={props.onExtract}>
        {extractLabel}
      </Button>
    </ButtonBar>
  )

  let body: React.ReactNode
  if (status === "loading") {
    body = <p className="px-[14px] py-[40px] text-center text-[12.5px] text-muted-foreground">문양 정보를 불러오는 중…</p>
  } else if (status === "error") {
    body = (
      <div className="flex flex-col items-center gap-[6px] px-[14px] py-[40px]">
        <span className="text-[12.5px] text-fg-2">문양 · 검색 이력을 불러오지 못했습니다.</span>
        <InlineError message="확인 못 함" at={errorAt} onRetry={onRetry} />
      </div>
    )
  } else {
    body = (
      <div className="grid gap-[12px] p-[12px] lg:grid-cols-[220px_minmax(0,1fr)_250px] xl:grid-cols-[240px_minmax(0,1fr)_270px]">
        {/* 왼쪽: 현장 이미지 · AI 추출 결과 · 이미지 목록 · 코드 설명 */}
        <div className="flex min-w-0 flex-col gap-[8px]">
          <Band title="현장 이미지">
            <Chip variant="h19">{props.searchImage === "edited" ? "편집본" : "원본"}</Chip>
          </Band>
          <div className="relative h-[330px] min-w-0 overflow-hidden rounded-[10px] border border-solid border-border bg-canvas">
            {props.canvasSlot}
            <ScanOverlay active={props.extractState === "running"} />
            <span className="pointer-events-none absolute bottom-[6px] left-[8px] font-code text-[10.5px] font-semibold text-fg-2">
              ROI · 경계선 끌어서 조정
            </span>
          </div>
          <ExtractResults
            state={props.extractState}
            items={props.extracted}
            inserted={inserted}
            onInsert={props.onInsertPattern}
            canEdit={canEdit}
          />
          <Band title="이미지 목록">
            <span className="font-code text-[11px] text-dim">{props.images.length}장</span>
          </Band>
          <DataGrid
            columns={IMAGE_COLUMNS}
            rows={[...props.images]}
            rowKey={(no) => no}
            selectedKey={aprthngNo}
            onRowClick={props.onSelectImage}
            className="[&_td]:h-[30px] [&_th]:h-[28px]"
          />
          <Band title="코드 설명" />
          <p className="m-0 rounded-[8px] border border-solid border-border bg-panel-2 px-[10px] py-[8px] text-[12px] leading-[1.5] break-keep text-fg-2">
            {props.codeNote ? (
              <>
                <span className="font-code text-[11px] text-brand">{props.codeNote.code}</span>
                <br />
                {props.codeNote.text}
              </>
            ) : (
              <span className="text-dim">문양을 고르면 설명이 나옵니다.</span>
            )}
          </p>
        </div>

        {/* 가운데: 현장 이미지 문양 4부위 · 팔레트 */}
        <div className="flex min-w-0 flex-col gap-[8px]">
          <Band title="현장 이미지 문양">
            <span className="text-[11px] text-dim">끌어 놓기 · 누르면 빼기 · 우클릭 필수</span>
          </Band>
          <ResearchLine state={props.researchState} essentialCount={essentialCount} />
          <ZoneRows
            zones={zones}
            selectedZone={selectedZone}
            onSelectZone={props.onSelectZone}
            onDropToZone={props.onInsertPatternToZone}
            onRemovePattern={props.onRemovePattern}
            onToggleEssential={props.onToggleEssential}
            canEdit={canEdit}
          />
          <PalettePanel
            kind={props.paletteKind}
            onKindChange={props.onPaletteKindChange}
            palette={props.palette}
            inserted={inserted}
            onInsert={props.onInsertPattern}
            canEdit={canEdit}
          />
        </div>

        {/* 오른쪽: 매칭 조건 · 검색이력 */}
        <div className="flex min-w-0 flex-col gap-[8px]">
          <MatchConditions value={props.matchConditions} onChange={props.onMatchConditionsChange} />
          <section aria-label="검색이력" className="flex flex-col gap-[6px]">
            <Band title="검색이력" />
            <div className="min-w-0 overflow-x-auto">
              <DataGrid
                columns={HISTORY_COLUMNS}
                rows={[...props.history]}
                rowKey={(r) => String(r.searchNo)}
                onRowClick={(r) => props.onOpenHistory(r.searchNo)}
                className="text-[11.5px] [&_td]:h-[30px] [&_td]:px-[6px] [&_th]:h-[28px] [&_th]:px-[6px]"
              />
            </div>
          </section>
        </div>
      </div>
    )
  }

  return (
    <section aria-label="문양 코딩" aria-busy={status === "loading"} data-screen="S04" className="min-w-0">
      <Panel
        title={
          <>
            문양 상세보기 <span className="font-code font-normal text-muted-foreground">{aprthngNo}</span>
          </>
        }
        actions={buttons}
      >
        {!canEdit && (status === "ready" || status === "empty") ? (
          <p className="px-[14px] pt-[8px] text-[11.5px] text-muted-foreground">
            보기 전용 — 문양 편집 · 추출 · 검색은 사건 조회 권한이 있어야 합니다.
          </p>
        ) : null}
        {body}
      </Panel>
    </section>
  )
}
