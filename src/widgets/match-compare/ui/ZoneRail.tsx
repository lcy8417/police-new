import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { PatternIcon } from "@/shared/ui/viewer"

import type { PatternIconItem, ZoneBasis, ZonePatterns } from "../model/types"
import { sharedNames } from "../model/zoom-link"

// 정밀 대조 1:1 「부위별 문양」(11/17 사용자 「각각 상 중 하 위치에 각각 좌 우 매칭 및 선택한 문양 보여주게. 1:1 일때만 가능」).
// 유류 | 발견 두 그림 사이 세로 칸 — 상 · 중 · 하 줄을 두 그림의 그 부위 높이(구역 눈금, 없으면 3등분)에 맞춰 놓고,
// 줄마다 왼쪽 = 현장(유류)에서 고른 문양(필수 표시), 오른쪽 = 신발(발견) 문양. 이름이 같은 문양은 양쪽에 테 + 「일치」 글자,
// 한쪽에만 있는 문양은 흐리게. 윤곽은 판 아래 한 줄(ZoneLine). 1:3 · 1:5 는 예전 띠(ZoneCompareStrip) 그대로.
// 줄 자리는 그림 상자(`[data-match-image]`)를 재서 정한다(보기 전용 — 좌표 계약과 상관없다). 못 재면 칸을 3등분.

type ZoneKey = keyof ZonePatterns
type Verdict = "ok" | "some" | "none" | "empty"

const ROWS: { key: Exclude<ZoneKey, "outline">; label: string }[] = [
  { key: "top", label: "상" },
  { key: "mid", label: "중" },
  { key: "bottom", label: "하" },
]

/** 부위 판정 — 현장 문양 기준(이름): 모두 같음 · 일부 · 하나도 없음 · 현장 문양 없음 */
function zoneVerdict(crime: readonly PatternIconItem[], shoe: readonly PatternIconItem[]): { shared: Set<string>; verdict: Verdict } {
  const shared = sharedNames(crime, shoe)
  const verdict: Verdict = crime.length === 0 ? "empty" : shared.size === crime.length ? "ok" : shared.size > 0 ? "some" : "none"
  return { shared, verdict }
}

/** 색만이 아니라 표식 · 글자로 */
const MARK: Record<Verdict, { sign: string; text: string; tone: string }> = {
  ok: { sign: "✓", text: "일치", tone: "text-ai" },
  some: { sign: "△", text: "일부", tone: "text-warn" },
  none: { sign: "✕", text: "다름", tone: "text-danger-fg" },
  empty: { sign: "—", text: "문양 없음", tone: "text-dim" },
}

function Mark({ verdict }: { verdict: Verdict }) {
  const m = MARK[verdict]
  return (
    <span data-zone-verdict={verdict} className={cn("inline-flex items-center gap-[2px] text-[11px] font-bold whitespace-nowrap", m.tone)}>
      <span aria-hidden="true">{m.sign}</span>
      {m.text}
    </span>
  )
}

function IconList({
  label,
  items,
  shared,
  end = false,
  className,
}: {
  label: string
  items: readonly PatternIconItem[]
  shared: Set<string>
  /** 오른쪽 붙임(현장 쪽 — 가운데 선에 붙게) */
  end?: boolean
  className?: string
}) {
  return (
    // 필수 배지가 모서리 밖(위 · 왼쪽 5px)으로 나오므로 그만큼 띄운다
    <ul aria-label={label} className={cn("m-0 flex min-w-0 list-none flex-wrap content-start gap-[6px] px-[3px] pt-[6px] pb-[3px] pl-[7px]", end && "justify-end", className)}>
      {items.length === 0 ? <li className="text-[11px] text-dim">—</li> : null}
      {items.map((p) => {
        const hit = shared.has(p.name)
        const note = `${p.essential ? " · 필수" : ""} — ${hit ? "양쪽 일치" : "한쪽만"}`
        return (
          <li key={p.name} data-match={hit ? "y" : "n"} data-essential={p.essential ? "true" : undefined} className="inline-flex">
            <PatternIcon
              name={p.name}
              src={p.src}
              size="sm"
              essential={p.essential}
              selected={hit}
              title={`${p.name}${note}`}
              className={cn(!hit && "opacity-45")}
            />
            <span className="sr-only">{note}</span>
          </li>
        )
      })}
    </ul>
  )
}

/** 부위 머리 — 부위 이름 · 판정 · 같은 문양 수 · (있으면) AI 부위 점수 */
function ZoneHead({ label, verdict, shared, total, score }: { label: string; verdict: Verdict; shared: number; total: number; score?: ZoneBasis }) {
  return (
    <span className="flex h-[18px] shrink-0 items-center gap-[5px]">
      <b className="text-[12.5px] text-foreground">{label}</b>
      <Mark verdict={verdict} />
      <span className="ml-auto font-code text-[10px] text-muted-foreground tabular-nums" title="양쪽 같은 문양 / 현장 문양">
        {`${shared}/${total}`}
      </span>
      {score ? <b className={cn("font-code text-[11px] font-semibold", score.ok ? "text-ai" : "text-warn")}>{score.score.toFixed(2)}</b> : null}
    </span>
  )
}

/** 상 · 중 · 하 눈금(그림 높이 비율 — 맨 위 · 상|중 · 중|하 · 맨 아래). 눈금이 없으면 부르는 쪽이 3등분을 넘긴다 */
export type ZoneStops = readonly [number, number, number, number]

export interface ZoneRailProps {
  crime: ZonePatterns
  shoe: ZonePatterns
  /** 유류 그림의 상 · 중 · 하 눈금 */
  crimeStops: ZoneStops
  /** 발견 그림의 상 · 중 · 하 눈금 */
  shoeStops: ZoneStops
  /** AI 부위 점수(있으면 머리 끝에) */
  basis?: readonly ZoneBasis[]
  className?: string
}

/** 두 그림 사이 세로 칸 — 상 · 중 · 하 줄. 같은 판(`[data-zone-stage]`) 안 두 그림 상자를 재서 줄 높이를 맞춘다 */
export function ZoneRail({ crime, shoe, crimeStops, shoeStops, basis, className }: ZoneRailProps) {
  const bodyRef = React.useRef<HTMLDivElement>(null)
  const [rows, setRows] = React.useState<{ top: number; height: number }[] | null>(null)
  const stopsKey = [...crimeStops, ...shoeStops].join(",")

  React.useLayoutEffect(() => {
    const body = bodyRef.current
    const stage = body?.closest("[data-zone-stage]")
    if (!body || !stage) return
    const stops = stopsKey.split(",").map(Number)
    const cs = stops.slice(0, 4)
    const ss = stops.slice(4, 8)
    const measure = () => {
      const b = body.getBoundingClientRect()
      const c = stage.querySelector('[data-compare-pane="crime"] [data-match-image]')?.getBoundingClientRect()
      const s = stage.querySelector('[data-compare-pane="shoe"] [data-match-image]')?.getBoundingClientRect()
      if (!c || !s || b.height <= 0 || c.height <= 0 || s.height <= 0) {
        setRows((prev) => (prev === null ? prev : null))
        return
      }
      // 두 그림의 같은 눈금 높이 가운데 — 칸 안으로 자른다
      const at = (i: number) => Math.max(0, Math.min(b.height, (c.top + c.height * cs[i] + s.top + s.height * ss[i]) / 2 - b.top))
      const next = [0, 1, 2].map((i) => {
        const top = Math.round(at(i))
        return { top, height: Math.max(0, Math.round(at(i + 1)) - top) }
      })
      setRows((prev) => (prev && prev.every((r, i) => r.top === next[i].top && r.height === next[i].height) ? prev : next))
    }
    measure()
    if (typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(measure)
    ro.observe(body)
    stage.querySelectorAll("[data-compare-pane] [data-match-image]").forEach((el) => ro.observe(el))
    return () => ro.disconnect()
  }, [stopsKey])

  return (
    <section aria-label="상 · 중 · 하 부위 문양" data-zone-rail className={cn("flex min-h-0 min-w-0 flex-col bg-panel", className)}>
      <span aria-hidden="true" className="flex shrink-0 items-center justify-between px-[6px] py-[6px] text-[10px] font-semibold text-muted-foreground">
        <span>‹ 현장</span>
        <span>신발 ›</span>
      </span>
      <div ref={bodyRef} className={cn("relative min-h-0 flex-1", !rows && "flex flex-col")}>
        {ROWS.map((z, i) => {
          const a = crime[z.key]
          const b = shoe[z.key]
          const { shared, verdict } = zoneVerdict(a, b)
          const score = basis?.find((r) => r.zone === z.label)
          const pos = rows?.[i]
          return (
            <section
              key={z.key}
              aria-label={`${z.label} 부위 문양`}
              data-zone-row={z.key}
              // 줄 자리 = 두 그림의 그 부위 높이(잰 값 — 좌표 파생 위치)
              style={pos ? { top: pos.top, height: pos.height } : undefined}
              className={cn(
                "flex min-h-0 flex-col gap-[2px] overflow-hidden border-0 border-t border-dashed border-line-3 px-[4px] pt-[3px]",
                pos ? "absolute inset-x-0" : "flex-1",
              )}
            >
              <ZoneHead label={z.label} verdict={verdict} shared={shared.size} total={a.length} score={score} />
              <div className="grid min-h-0 flex-1 grid-cols-2 overflow-y-auto [scrollbar-width:thin]">
                <IconList label={`${z.label} 현장 문양`} items={a} shared={shared} end className="border-0 border-r border-dashed border-line-3" />
                <IconList label={`${z.label} 신발 문양`} items={b} shared={shared} />
              </div>
            </section>
          )
        })}
      </div>
    </section>
  )
}

/** 윤곽 한 줄(판 아래) — 같은 판정 · 같은 문양 표시 */
export function ZoneLine({ crime, shoe }: { crime: ZonePatterns; shoe: ZonePatterns }) {
  const a = crime.outline
  const b = shoe.outline
  const { shared, verdict } = zoneVerdict(a, b)
  return (
    <section aria-label="윤곽 부위 문양" data-zone-row="outline" className="grid grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-[8px] px-[10px] py-[3px]">
      <ZoneHead label="윤곽" verdict={verdict} shared={shared.size} total={a.length} />
      <IconList label="윤곽 현장 문양" items={a} shared={shared} end className="border-0 border-r border-dashed border-line-3" />
      <IconList label="윤곽 신발 문양" items={b} shared={shared} />
    </section>
  )
}
