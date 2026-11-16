import * as React from "react"
import { ArrowRight, History } from "lucide-react"

import { insertPatternPath } from "@/entities/pattern"
import { cn } from "@/shared/lib/utils"
import { WorkbenchButton } from "@/shared/ui/kit"

import { ZONE_ROWS } from "../model/constants"
import type { SearchRun, SearchRunPattern, WeightLevel } from "../model/types"
import { WEIGHT_LABEL, WEIGHT_LEVELS } from "../model/weight-rules"

export interface SearchRunListProps {
  runs: readonly SearchRun[]
  /** 지금 화면 조건과 같은 줄(있으면 「지금」 표시) */
  currentNo?: number
  onRestore?: (searchNo: number) => void
  /** 「자세히 →」 — 그 검색 번호로 검색 결과 탭 */
  onOpen?: (searchNo: number) => void
  canEdit: boolean
  /** 처음 보이는 줄 수(나머지는 「더 보기」) */
  limit?: number
}

const SOURCE_LABEL = { original: "원본", edited: "편집본" } as const
/** 부위 짧은 이름(줄 안 좁은 자리) */
const SHORT: Record<string, string> = { 상: "상", 중: "중", 하: "하", 윤곽: "윤" }

/** 가중치 작은 막대(보기 전용 — 배수 글자 없음) */
function MiniBars({ level, manual }: { level: WeightLevel; manual: boolean }) {
  const at = WEIGHT_LEVELS.indexOf(level)
  return (
    <span aria-hidden="true" className="inline-flex h-[7px] items-end gap-[1px]">
      {WEIGHT_LEVELS.map((lv, i) => (
        <span key={lv} className={cn("block w-[3px] rounded-[1px]", i === 0 ? "h-[3px]" : i === 1 ? "h-[5px]" : "h-[7px]", i <= at ? (manual ? "bg-brand" : "bg-fg-2") : "bg-line-3")} />
      ))}
    </span>
  )
}

/** 넣은 문양 한 칸 — 실제 그림 · 필수는 진한 테 · 가중치 막대 */
function RunPattern({ zoneLabel, p }: { zoneLabel: string; p: SearchRunPattern }) {
  const label = `${zoneLabel} ${p.name}${p.essential ? " 필수" : ""} · 가중치 ${WEIGHT_LABEL[p.weight]}${p.manual ? "(직접)" : "(규칙)"}`
  return (
    <span role="img" aria-label={label} title={label} className="inline-flex flex-col items-center gap-[2px]">
      <span
        className={cn(
          "grid size-[26px] place-items-center overflow-hidden rounded-[5px] bg-panel",
          p.essential ? "border-2 border-solid border-danger" : "border border-solid border-line-3"
        )}
      >
        <img src={insertPatternPath(p.name) as string} alt="" className="size-full object-contain" />
      </span>
      <MiniBars level={p.weight} manual={p.manual} />
    </span>
  )
}

/** 매칭 조건 요약 한 줄(마우스 설명) */
function conditionLine(run: SearchRun): string {
  const c = run.conditions
  return [c.searchKind, `${c.periodFrom} ~ ${c.periodTo}`, `성별 ${c.gender}`, `굽 ${c.heel}`].join(" · ")
}

/**
 * 사건 창 「검색 이력」(11/17 사용자 「실제 어떤 문양 모양으로 어떤 가중치 어떻게 넣었을때 어떤 결과 나온지 볼 수 있고, 몇개 리스트 보여주고,
 * 자세히 누르면 검색결과 가던가」) — 검색 한 번 = 한 줄: 번호 · 시각 · 원본/편집본 · 결과 수 /
 * 부위별 넣은 문양 실제 그림(필수 = 진한 테, 가중치 = 작은 막대) / 결과 상위 신발 그림 + 점수 / 「다시 불러오기」 · 「자세히 →」.
 * 최근 몇 줄만, 나머지는 「더 보기」. 매칭 조건은 줄 마우스 설명.
 */
export function SearchRunList({ runs, currentNo, onRestore, onOpen, canEdit, limit = 5 }: SearchRunListProps) {
  const [all, setAll] = React.useState(false)
  if (runs.length === 0) {
    return <p className="m-0 py-[16px] text-center text-[11.5px] text-muted-foreground">아직 검색하지 않았습니다.</p>
  }
  const shown = all ? runs : runs.slice(0, limit)
  return (
    <>
      <ol aria-label="검색 이력" className="m-0 flex list-none flex-col gap-[6px] p-0">
        {shown.map((run) => {
          const now = run.searchNo === currentNo
          const used = ZONE_ROWS.filter(({ zone }) => run.zones[zone].length > 0)
          return (
            <li
              key={run.searchNo}
              aria-label={`검색 ${run.searchNo}`}
              title={conditionLine(run)}
              className={cn("flex flex-col gap-[6px] rounded-[9px] border border-solid px-[8px] py-[7px]", now ? "border-brand-line bg-brand-bg/40" : "border-border bg-panel")}
            >
              <div className="flex min-w-0 items-center gap-[6px]">
                <b className="font-code text-[11.5px] font-semibold text-foreground">#{run.searchNo}</b>
                <span className="font-code text-[10.5px] text-muted-foreground">{run.at.slice(5, 16).replace("-", "/")}</span>
                <span className="text-[10.5px] text-fg-2">{SOURCE_LABEL[run.source]}</span>
                {now ? <span className="text-[10px] font-semibold text-brand">지금</span> : null}
                <span className="ml-auto font-code text-[11px] text-fg-2 tabular-nums">{run.resultCount.toLocaleString("ko-KR")}건</span>
              </div>
              <div aria-label="검색 문양" role="group" className="flex min-w-0 flex-wrap items-start gap-x-[8px] gap-y-[4px]">
                {used.map(({ zone, label }) => (
                  <span key={zone} className="inline-flex items-start gap-[3px]">
                    <span className="pt-[6px] text-[10px] font-semibold text-muted-foreground">{SHORT[label] ?? label}</span>
                    {run.zones[zone].map((p) => (
                      <RunPattern key={p.name} zoneLabel={label} p={p} />
                    ))}
                  </span>
                ))}
                {used.length === 0 ? <span className="text-[10.5px] text-muted-foreground">문양 없이(이미지만)</span> : null}
              </div>
              <ol aria-label="상위 결과" className="m-0 flex list-none gap-[4px] p-0">
                {run.top.length === 0 ? (
                  <li className="text-[10.5px] text-muted-foreground">결과 없음</li>
                ) : (
                  run.top.map((h, i) => (
                    <li
                      key={h.ftwrId}
                      title={`${i + 1}위 ${h.ftwrId} · ${h.score === null ? "문양 점수 없음(이미지 유사도만)" : `점수 ${h.score.toFixed(2)}`}`}
                      className="flex w-[38px] flex-col items-center gap-[1px]"
                    >
                      <span className="grid h-[44px] w-[30px] place-items-center overflow-hidden rounded-[4px] border border-solid border-line-3 bg-canvas">
                        {h.src ? <img src={h.src} alt={`${h.ftwrId} 밑창`} className="size-full object-contain" /> : <span className="font-code text-[10px] text-muted-foreground">{h.ftwrId}</span>}
                      </span>
                      {/* 검색 문양이 없으면 문양 점수가 없다(0점과 다름) — 숫자 대신 대시 */}
                      <span className={cn("font-code text-[10px] leading-none font-semibold tabular-nums", h.score === null ? "text-muted-foreground" : "text-brand-3")}>
                        {h.score === null ? "—" : h.score.toFixed(2)}
                      </span>
                    </li>
                  ))
                )}
              </ol>
              <div className="flex items-center gap-[4px]">
                <WorkbenchButton
                  size="sm"
                  variant="ghost"
                  icon={History}
                  aria-label={`검색 ${run.searchNo} — 이 조건 다시 불러오기`}
                  title="이 검색의 문양 · 필수 · 가중치 · 매칭 조건 · 이미지를 지금 화면으로 되살립니다"
                  disabled={!canEdit || !onRestore}
                  onClick={() => onRestore?.(run.searchNo)}
                >
                  다시 불러오기
                </WorkbenchButton>
                <WorkbenchButton
                  size="sm"
                  variant="soft"
                  aria-label={`검색 ${run.searchNo} — 자세히`}
                  title="이 검색의 결과를 검색 결과 탭에서 봅니다"
                  disabled={!onOpen}
                  onClick={() => onOpen?.(run.searchNo)}
                  className="ml-auto"
                >
                  자세히
                  <ArrowRight aria-hidden="true" className="size-[12px]" strokeWidth={2} />
                </WorkbenchButton>
              </div>
            </li>
          )
        })}
      </ol>
      {runs.length > limit ? (
        <WorkbenchButton size="sm" variant="ghost" onClick={() => setAll(!all)} className="self-center">
          {all ? "접기" : `더 보기 (${runs.length - limit})`}
        </WorkbenchButton>
      ) : null}
    </>
  )
}
