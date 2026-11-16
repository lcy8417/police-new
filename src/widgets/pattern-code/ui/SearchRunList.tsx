import * as React from "react"
import { ChevronDown, ExternalLink, History } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { WorkbenchButton } from "@/shared/ui/kit"

import { ZONE_ROWS } from "../model/constants"
import type { SearchRun, SearchRunPattern } from "../model/types"
import { WEIGHT_LABEL, WEIGHT_VALUE } from "../model/weight-rules"

export interface SearchRunListProps {
  runs: readonly SearchRun[]
  /** 지금 화면 조건과 같은 줄(있으면 「지금」 표시) */
  currentNo?: number
  onRestore?: (searchNo: number) => void
  onOpen?: (searchNo: number) => void
  canEdit: boolean
}

const SOURCE_LABEL = { original: "원본", edited: "편집본" } as const

/** 문양 한 칸 꼬리표 — 이름 · 필수 점 · ×가중치(직접이면 brand) */
function PatternTag({ p }: { p: SearchRunPattern }) {
  return (
    <span
      title={`${p.name}${p.essential ? " · 필수" : ""} · 가중치 ${WEIGHT_LABEL[p.weight]} ×${WEIGHT_VALUE[p.weight]}${p.manual ? "(직접)" : "(규칙)"}`}
      className="inline-flex items-center gap-[3px] rounded-[4px] bg-strip px-[4px] font-code text-[10.5px] leading-[17px] text-fg-2"
    >
      {p.essential ? <span aria-label="필수" className="text-danger-fg">●</span> : null}
      {p.name}
      <span className={cn("tabular-nums", p.manual ? "font-semibold text-brand" : "text-muted-foreground")}>×{WEIGHT_VALUE[p.weight]}</span>
    </span>
  )
}

/** 매칭 조건 요약 한 줄 */
function conditionLine(run: SearchRun): string {
  const c = run.conditions
  return [c.searchKind, `${c.periodFrom.slice(2)}~${c.periodTo.slice(2)}`, c.gender === "전체" ? null : c.gender, c.heel === "전체" ? null : `굽 ${c.heel}`]
    .filter(Boolean)
    .join(" · ")
}

/**
 * 사건 창 「검색 이력」(11/17 사용자 「각각 조건으로 어떤 검색이 나온지도 이력 당연히 있어야하고」) — 검색 한 번 = 한 줄:
 * 시각 · 원본/편집본 · 결과 수 · 상위 1~3 위(신발 ID + 점수) · 부위별 문양(필수 · 가중치) · 「이 조건 다시 불러오기」 · 「결과 보기」.
 * 줄을 펼치면 매칭 조건 전체.
 */
export function SearchRunList({ runs, currentNo, onRestore, onOpen, canEdit }: SearchRunListProps) {
  const [open, setOpen] = React.useState<number | null>(null)
  if (runs.length === 0) {
    return <p className="m-0 py-[16px] text-center text-[11.5px] text-muted-foreground">아직 검색하지 않았습니다 — 「검색」을 누르면 한 줄씩 쌓입니다.</p>
  }
  return (
    <ol aria-label="검색 이력" className="m-0 flex list-none flex-col gap-[6px] p-0">
      {runs.map((run) => {
        const expanded = open === run.searchNo
        const now = run.searchNo === currentNo
        const used = ZONE_ROWS.filter(({ zone }) => run.zones[zone].length > 0)
        return (
          <li
            key={run.searchNo}
            aria-label={`검색 ${run.searchNo}`}
            className={cn("rounded-[10px] border border-solid px-[9px] py-[7px]", now ? "border-brand-line bg-brand-bg/40" : "border-border bg-panel")}
          >
            <div className="flex min-w-0 items-center gap-[6px]">
              <b className="font-code text-[11.5px] font-semibold text-foreground">#{run.searchNo}</b>
              <span className="font-code text-[10.5px] text-muted-foreground">{run.at.slice(11, 16)}</span>
              <span className="rounded-[4px] border border-solid border-line-3 px-[4px] text-[10px] leading-[15px] text-fg-2">{SOURCE_LABEL[run.source]}</span>
              {now ? <span className="text-[10px] font-semibold text-brand">지금 조건</span> : null}
              <span className="ml-auto font-code text-[11px] text-fg-2 tabular-nums">{run.resultCount.toLocaleString("ko-KR")}건</span>
            </div>
            <ol aria-label="상위 결과" className="m-0 mt-[4px] flex list-none flex-wrap gap-x-[8px] p-0 font-code text-[10.5px] tabular-nums">
              {run.top.length === 0 ? (
                <li className="text-muted-foreground">결과 없음(필수 문양을 모두 가진 신발이 없음)</li>
              ) : (
                run.top.map((h, i) => (
                  <li key={h.ftwrId} className="text-fg-2">
                    <span className="text-muted-foreground">{i + 1}</span> {h.ftwrId} <span className="text-brand">{h.score.toFixed(2)}</span>
                  </li>
                ))
              )}
            </ol>
            <div className="mt-[5px] flex flex-col gap-[3px]">
              {used.map(({ zone, label }) => (
                <div key={zone} className="flex min-w-0 flex-wrap items-center gap-[3px]">
                  <span className="w-[22px] shrink-0 text-[10.5px] font-semibold text-muted-foreground">{label}</span>
                  {run.zones[zone].map((p) => (
                    <PatternTag key={p.name} p={p} />
                  ))}
                </div>
              ))}
              {used.length === 0 ? <span className="text-[10.5px] text-muted-foreground">문양 없이(이미지만)</span> : null}
            </div>
            {expanded ? (
              <dl className="m-0 mt-[6px] grid grid-cols-[56px_minmax(0,1fr)] gap-x-[6px] gap-y-[2px] border-0 border-t border-solid border-line-2 pt-[6px] text-[10.5px]">
                <dt className="text-muted-foreground">검색 시각</dt>
                <dd className="m-0 font-code text-fg-2">{run.at}</dd>
                <dt className="text-muted-foreground">검색구분</dt>
                <dd className="m-0 text-fg-2">{run.conditions.searchKind}</dd>
                <dt className="text-muted-foreground">등록기간</dt>
                <dd className="m-0 font-code text-fg-2">
                  {run.conditions.periodFrom} ~ {run.conditions.periodTo}
                </dd>
                <dt className="text-muted-foreground">성별 · 굽</dt>
                <dd className="m-0 text-fg-2">
                  {run.conditions.gender} · {run.conditions.heel}
                </dd>
                <dt className="text-muted-foreground">가중치</dt>
                <dd className="m-0 text-fg-2">
                  직접 {ZONE_ROWS.reduce((n, { zone }) => n + run.zones[zone].filter((p) => p.manual).length, 0)}개 · 나머지 규칙 값
                </dd>
              </dl>
            ) : (
              <p className="m-0 mt-[4px] truncate text-[10.5px] text-muted-foreground">{conditionLine(run)}</p>
            )}
            <div className="mt-[6px] flex items-center gap-[4px]">
              <WorkbenchButton
                size="sm"
                variant="ghost"
                icon={ChevronDown}
                iconOnly
                aria-expanded={expanded}
                aria-label={expanded ? "조건 접기" : "조건 전체 보기"}
                className={cn(expanded && "[&_svg]:rotate-180")}
                onClick={() => setOpen(expanded ? null : run.searchNo)}
              />
              <WorkbenchButton
                size="sm"
                variant="soft"
                icon={History}
                aria-label={`검색 ${run.searchNo} — 이 조건 다시 불러오기`}
                title="이 검색의 문양 · 필수 · 가중치 · 매칭 조건 · 이미지를 지금 화면으로 되살립니다"
                disabled={!canEdit || !onRestore}
                onClick={() => onRestore?.(run.searchNo)}
                className="ml-auto"
              >
                다시 불러오기
              </WorkbenchButton>
              <WorkbenchButton
                size="sm"
                variant="ghost"
                icon={ExternalLink}
                aria-label={`검색 ${run.searchNo} — 결과 보기`}
                disabled={!onOpen}
                onClick={() => onOpen?.(run.searchNo)}
              >
                결과 보기
              </WorkbenchButton>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
