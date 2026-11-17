import * as React from "react"
import { Plus } from "lucide-react"

import { FEATURES } from "@/entities/session"
import { cn } from "@/shared/lib/utils"
import {
  BoardFrame,
  BoardLid,
  Button,
  InlineError,
  LidChip,
  LidChipGroup,
  LidFilterLabel,
  LidResetLink,
  LidSeparator,
  ListFoot,
  ListNote,
  Pagination,
  StatePill,
  ViewCountSwitch,
  WorkbenchButton,
  type FilterGroup,
} from "@/shared/ui/kit"
import { SoleThumb } from "@/shared/ui/viewer"

import type { CaseListRow, CaseListScreenProps } from "../model/types"
import { CaseTable, type CaseTableColumn } from "./CaseTable"

// S01 사건관리 목록(SCAS 「족윤적 > 사건관리」 탭). 값만 받아 그린다 — 서버 호출 · 전역 상태 없음.
// 11/17 사용자(「컴팩트하게 해봐. 엑셀 이런 거 다 버리고」 · 「AI 이런 거 다 빼. 여기는 리스트만 … 전문적으로」 ·
// 「테이블 컴포넌트 로망꺼 가져오면 안되나」 · 「검색 확인 검증 버튼이랑 사건진행 겹치잖아」):
//  - 찾기 칸은 앱 틀 위 막대 하나(쓰는 쪽이 quick.query 로 넘김). 목록보기/문양보기 · 상세 검색(SCAS 양식) · 엑셀 · 열 선택 ·
//    15열/25열 전환 · 실시간 줄 · AI 표식 · 훑기 · 새 행 띠 · 행 펼침 요약 · 공문 자동/임의 등록 줄은 뺐다.
//  - 거르기 줄(뚜껑) = 빠른 보기 · 진행 상태 · 내 담당만 … 오른쪽 끝 「+ 등록」.
//  - 표 = 로망 목록 표 부품(CaseTable → kit ListHeadRow · ListRow), 머리 · 행이 같은 격자 열을 써서 칸 정렬을 맞춘다.
//  - 사건 진행 = 단계 알약 + 그 단계에서 할 단추 하나(검색 · 확인 · 검증요청 · 검증). 「결재」 글자는 쓰지 않는다(「결재는 없어」).

/** 뚜껑에서 뺀 묶음(사건결과 · 처리 구분) — 걸러진 값은 그대로 유지된다 */
const LID_HIDDEN_GROUPS: readonly string[] = ["result", "kind"]

// 격자 열(머리 · 행 공용) — 이미지 · 감정번호/사건명 · 의뢰관서/SCAS번호 · 개수 · 등록일자 · 결과 · 진행 · 사건 진행(또는 할 일)
const GRID_PLUS =
  "grid-cols-[44px_minmax(150px,1.3fr)_minmax(130px,1fr)_64px_84px_96px_120px_minmax(210px,270px)]"
const GRID_BASE = "grid-cols-[44px_minmax(150px,1.3fr)_minmax(130px,1.1fr)_64px_84px_96px_120px_72px]"

// 사건 진행 단계 이름(11/16 · 11/17 사용자 「결재는 없어」 — 결재 → 감정서, 결재완료 → 완료)
const STAGE_PILL = ["검증요청 전", "교차 검증", "감정서", "감정서", "완료"]

const dash = (v: string) => (v === "" ? "—" : v)

/** 머리 · 칸 공용 3칸 격자(발견 불발 불능 / 등록 검색 확인) — 숫자가 머리 글자 바로 아래에 온다 */
const TRIO = "grid grid-cols-3 text-center"

function Trio({ labels }: { labels: readonly string[] }) {
  return (
    <span className={TRIO}>
      {labels.map((l) => (
        <span key={l}>{l}</span>
      ))}
    </span>
  )
}

function Num({ v, tone = "text-foreground" }: { v: number; tone?: string }) {
  return <span className={cn("font-code tabular-nums", v ? tone : "text-faint")}>{v}</span>
}

/** 결과 장수 — 발견 · 불발 · 불능을 한 칸에(0 은 흐리게, 불능만 위험색) */
function ResultCell({ row }: { row: CaseListRow }) {
  const { found, missed, unable } = row.results
  return (
    <span className={cn(TRIO, "text-[12px]")} title={`발견 ${found} · 불발 ${missed} · 불능 ${unable}`}>
      <Num v={found} tone="font-bold text-foreground" />
      <Num v={missed} tone="text-fg-2" />
      <Num v={unable} tone="font-bold text-danger-fg" />
    </span>
  )
}

/** 진행 장수 + 장마다 한 칸짜리 막대(회색 등록 · 주황 검색 · 파랑 확인) */
function ProgressCell({ row }: { row: CaseListRow }) {
  const { registered, searched, confirmed } = row.progress
  const cells = [
    ...Array<string>(confirmed).fill("bg-brand-2"),
    ...Array<string>(searched).fill("bg-warn"),
    ...Array<string>(registered).fill("bg-line-3"),
  ]
  return (
    <span className="grid gap-[3px]" title={`${cells.length}장 중 등록 ${registered} · 검색 ${searched} · 확인 ${confirmed}`}>
      <span className={cn(TRIO, "text-[12px] leading-[1.2]")}>
        <Num v={registered} />
        <Num v={searched} />
        <Num v={confirmed} />
      </span>
      <span className="flex gap-[2px] px-1">
        {cells.map((c, i) => (
          <i key={i} className={cn("h-[4px] flex-1 rounded-[2px]", c)} />
        ))}
      </span>
    </span>
  )
}

/** 뚜껑 칩 묶음 하나 — 여러 개 고르기(묶음 안은 「또는」). 묶음 이름은 aria-label 로 */
function LidGroup({ group, onChange }: { group: FilterGroup; onChange: (key: string, values: string[]) => void }) {
  const toggle = (v: string) =>
    onChange(group.key, group.value.includes(v) ? group.value.filter((x) => x !== v) : [...group.value, v])
  return (
    <LidChipGroup aria-label={group.label}>
      {group.options.map((o) => (
        <LidChip
          key={o.value}
          active={group.value.includes(o.value)}
          count={o.count}
          zero={o.count === 0}
          onClick={() => toggle(o.value)}
        >
          {o.label}
        </LidChip>
      ))}
    </LidChipGroup>
  )
}

interface RowAction {
  label: string
  run: () => void
  title?: string
}

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
  onOpenCase,
  onRegister,
  onSearchCase,
  onConfirmCase,
  showPlus = true,
  onMockAction,
  quick,
  selectedCase,
  onPageSizeChange,
  rowHeight = "보통",
  onRowHeightChange,
}: CaseListScreenProps) {
  const canRegister = isAdmin || features.includes(FEATURES.CRIME_REGISTER)
  const canSearch = isAdmin || features.includes(FEATURES.CRIME_SEARCH)
  // 시안 data-role「analyst admin」: 기술책임자(감정서만 보는 사람)에게는 행 끝 단추를 숨긴다
  // 기술책임자 = 보기 전용 EXAM_VIEW(결재 권한은 서버 0013에서 삭제)
  const verifierOnly = !isAdmin && features.includes(FEATURES.EXAM_VIEW) && !features.includes(FEATURES.EXAM_DECIDE)
  const canAct = canSearch && !(showPlus && verifierOnly)

  // 그 단계에서 할 단추 하나 — 검색 안 한 장 → 검색, 확인 대기 → 확인, (+α) 교차 검증 → 검증, 검증요청 전 → 검증요청
  const actionOf = (r: CaseListRow): RowAction | null => {
    if (!canAct) return null
    const { registered, searched, confirmed } = r.progress
    if (registered > 0) return { label: "검색", run: () => onSearchCase(r.aprthngNo) }
    if (searched > 0) return { label: "확인", run: () => onConfirmCase(r.aprthngNo) }
    const stage = r.stage ?? -1
    if (!showPlus) return confirmed > 0 ? { label: "확인", run: () => onConfirmCase(r.aprthngNo) } : null
    if (stage === 1) return { label: "검증", run: () => onMockAction?.("검증"), title: "다른 감정관(교차 검증자)에게만 보임" }
    if (stage === 0 || (stage < 0 && confirmed > 0)) return { label: "검증요청", run: () => onMockAction?.("검증요청") }
    return null
  }
  const actionButton = (r: CaseListRow) => {
    const a = actionOf(r)
    return a ? (
      <WorkbenchButton size="sm" title={a.title} onClick={a.run}>
        {a.label}
      </WorkbenchButton>
    ) : null
  }

  const tall = rowHeight !== "촘촘"
  const columns: CaseTableColumn<CaseListRow>[] = [
    {
      key: "img",
      header: "이미지",
      render: (r) => (
        <SoleThumb
          src={r.thumbSrc}
          alt={`${r.aprthngNo} 이미지`}
          size="sm"
          tabIndex={-1}
          onClick={() => onOpenCase(r.aprthngNo)}
          className={tall ? "h-[52px] w-[36px]" : "h-[30px] w-[21px]"}
        />
      ),
    },
    {
      key: "aprthngNo",
      header: "감정번호 · 사건명",
      render: (r) => (
        <span className="grid leading-[1.3]">
          <span className="font-code text-[12.5px] font-semibold text-foreground">{r.aprthngNo}</span>
          <span className="truncate text-[12px] text-fg-2" title={r.caseName}>
            {r.caseName}
          </span>
        </span>
      ),
    },
    {
      key: "req",
      header: "의뢰관서 · SCAS번호",
      render: (r) => (
        <span className="grid leading-[1.3]">
          <span className="truncate" title={r.requestOffice}>
            {dash(r.requestOffice)}
          </span>
          <span className="font-code text-[11px] text-dim">{dash(r.scasNo)}</span>
        </span>
      ),
    },
    {
      key: "count",
      header: "개수",
      title: "개수 (신발, 타이어)",
      align: "right",
      render: (r) => (
        <span className="font-code tabular-nums" title={`신발 ${r.shoeCount} · 타이어 ${r.tireCount}`}>
          <b className="text-foreground">{r.shoeCount + r.tireCount}</b>
          {r.tireCount > 0 ? <span className="text-dim"> ({r.shoeCount},{r.tireCount})</span> : null}
        </span>
      ),
    },
    {
      key: "reg",
      header: "등록일자",
      render: (r) => <span className="font-code text-[12px] tabular-nums">{r.registeredAt}</span>,
    },
    {
      key: "result",
      header: <Trio labels={["발견", "불발", "불능"]} />,
      title: "결과 · 장 (발견 불발 불능)",
      render: (r) => <ResultCell row={r} />,
    },
    {
      key: "progress",
      header: <Trio labels={["등록", "검색", "확인"]} />,
      title: "진행 · 장 (등록 검색 확인)",
      render: (r) => <ProgressCell row={r} />,
    },
    showPlus
      ? {
          key: "stage",
          header: "사건 진행",
          title: "이미지 확인 → 검증요청 → 교차 검증 → 감정서 → 완료",
          render: (r) => {
            const stage = r.stage ?? -1
            return (
              <span className="flex min-w-0 items-center gap-1.5">
                <StatePill tone={stage === 4 ? "done" : "fact"}>
                  {stage < 0 ? "이미지 확인 중" : STAGE_PILL[Math.min(stage, 4)]}
                </StatePill>
                {stage === 1 && r.crossReviewer ? (
                  <span className="truncate text-[11.5px] text-fg-2">{r.crossReviewer.split(" ")[0]}</span>
                ) : null}
                <span className="ml-auto shrink-0">{actionButton(r)}</span>
              </span>
            )
          },
        }
      : { key: "act", header: "할 일", align: "right", render: (r) => actionButton(r) },
  ]

  const views = showPlus ? quick?.views : undefined
  const quickActive =
    quick !== undefined &&
    (quick.query.trim() !== "" || quick.groups.some((g) => g.value.length > 0) || (views?.value.length ?? 0) > 0)
  const quickEmpty = status === "ready" && quickActive && quick.resultCount === 0
  const listed = status === "ready" || status === "empty"
  const lidGroups = quick ? quick.groups.filter((g) => !LID_HIDDEN_GROUPS.includes(g.key)) : []

  return (
    <div className="grid grid-cols-[minmax(0,1fr)]" aria-busy={status === "loading" ? "true" : undefined}>
      <BoardFrame className="mt-0">
        {/* 거르기 한 줄: 빠른 보기(+α) │ 진행 상태 │ 담당 │ 조건 지우기 ……… + 등록 */}
        <BoardLid role="search" aria-label="사건 목록 거르기">
          {quick && views ? (
            <>
              <span data-plus className="inline-flex items-center gap-1.5">
                <LidFilterLabel>빠른 보기</LidFilterLabel>
                <LidGroup group={views} onChange={quick.onGroupChange} />
              </span>
              <LidSeparator data-plus />
            </>
          ) : null}
          {quick
            ? lidGroups.map((g, i) => (
                <React.Fragment key={g.key}>
                  {i > 0 ? <LidSeparator /> : null}
                  <LidGroup group={g} onChange={quick.onGroupChange} />
                </React.Fragment>
              ))
            : null}
          {quickActive ? (
            <LidResetLink onClick={quick.onClear}>
              <span aria-hidden="true">✕ </span>조건 지우기
            </LidResetLink>
          ) : null}
          {canRegister ? (
            <span className="ml-auto">
              {/* 진한 뚜껑(brand-3) 위라 primary(같은 brand-3 채움)는 묻힌다 — 밝은 soft 로 */}
              <WorkbenchButton icon={Plus} onClick={onRegister}>
                등록
              </WorkbenchButton>
            </span>
          ) : null}
        </BoardLid>

        {status === "loading" ? (
          <ListNote role="status" className="text-center">
            사건 목록을 불러오는 중…
          </ListNote>
        ) : status === "error" ? (
          <div className="flex justify-center px-4 py-6">
            <InlineError message="사건 목록을 확인하지 못했습니다" at={errorAt} onRetry={onRetry} />
          </div>
        ) : quickEmpty ? (
          <ListNote
            role="status"
            className="justify-center"
            action={
              <Button size="sm" variant="ghost" className="h-auto px-0 text-[12px] text-brand underline" onClick={quick.onClear}>
                조건 지우기
              </Button>
            }
          >
            조건에 맞는 항목 없음
          </ListNote>
        ) : status === "empty" || rows.length === 0 ? (
          <ListNote className="text-center">결과 없음</ListNote>
        ) : (
          <div className="overflow-x-auto">
            <CaseTable
              label="사건 목록"
              gridClass={showPlus ? GRID_PLUS : GRID_BASE}
              compact={!tall}
              columns={columns}
              rows={[...rows]}
              rowKey={(r) => r.aprthngNo}
              selectedKey={selectedCase ?? null}
              onRowClick={(r) => onOpenCase(r.aprthngNo)}
            />
          </div>
        )}

        {/* 아래 한 줄: 개수 · 쪽당 행 · 행 높이 ……… 쪽수 */}
        {listed ? (
          <ListFoot className="h-auto min-h-11 flex-wrap gap-x-4 gap-y-1.5 py-1.5">
            {quick ? (
              <span aria-live="polite" className="font-code tabular-nums text-fg-2">
                {quick.resultCount} / 전체 {quick.total}
              </span>
            ) : null}
            {onPageSizeChange ? (
              <ViewCountSwitch label="쪽당" options={[10, 20, 50]} value={pageSize} onChange={onPageSizeChange} />
            ) : null}
            {onRowHeightChange ? (
              <ViewCountSwitch label="행" options={["보통", "촘촘"] as const} value={rowHeight} onChange={onRowHeightChange} />
            ) : null}
            <Pagination
              className="ml-auto p-0"
              total={status === "empty" ? 0 : total}
              page={page}
              pageSize={pageSize}
              hasNext={status === "ready" && total !== undefined && page * pageSize < total}
              onPageChange={onPageChange}
            />
          </ListFoot>
        ) : null}
      </BoardFrame>
    </div>
  )
}
