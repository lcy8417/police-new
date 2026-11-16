import type { ReactNode } from "react"

import { cn } from "@/shared/lib/utils"
import { Chip } from "@/shared/ui/kit"
import { HeatOverlay, PatternIcon } from "@/shared/ui/viewer"

import {
  answerHighlight,
  appear,
  binaryReveal,
  draw,
  gaugeFill,
  glow,
  grow,
  heatShow,
  hideAfter,
  rerankMark,
  rowMove,
  scanLine,
  showAfter,
  stampDrop,
} from "../lib/demo-motion"
import { useDemoAnim } from "../model/demo-clock"
import { DEMO_METRICS, DEMO_POINTS, DEMO_RANK_ROWS, DEMO_REPORT_ITEMS, DEMO_ZONES, RANK_ROW_H } from "../model/demo-script"
import type { LoginDemoArt } from "../model/types"

// S00 시연 카드 4장(시안 cardA~cardD). 크기 · 글자 · 위치는 시안 값 그대로(카드 폭 214 · 226 · 246 · 170).
// 움직임은 useDemoAnim 이 시안 키프레임으로 걸고, 클래스에 적힌 모양은 「다 끝난 상태」다.

/** 카드 4장 + 사이 간격(14 × 3)의 원래 폭 — 좁은 화면에서 이 폭을 기준으로 줄인다 */
export const DEMO_CARDS_WIDTH = 214 + 226 + 246 + 170 + 14 * 3

const IMG = "block size-full object-contain"

function DemoCard({
  widthClass,
  start,
  end,
  step,
  title,
  arrow = true,
  children,
}: {
  widthClass: string
  start: number
  end: number
  step: string
  title: string
  arrow?: boolean
  children: ReactNode
}) {
  const glowRef = useDemoAnim<HTMLSpanElement>(glow(start, end))
  return (
    <section
      aria-label={title}
      className={cn("relative grid shrink-0 grid-rows-[auto_1fr] gap-[10px] rounded-[12px] border border-solid border-border bg-panel-2 p-[12px]", widthClass)}
    >
      {/* 단계 구간에만 켜지는 청록 테두리(시안 glow) — 움직임이 없으면 꺼진 모양 */}
      <span
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-[12px] border border-solid border-ai/45 opacity-0 [box-shadow:0_0_0_1px_var(--t-ai-line),0_0_34px_0_var(--t-stat-glow-ai)]"
      />
      <div className="relative flex items-center gap-[7px]">
        <span className="font-code text-[10.5px] text-dim">{step}</span>
        <b className="text-[13px]">{title}</b>
      </div>
      {children}
      {arrow && (
        <span
          aria-hidden="true"
          className="absolute top-1/2 -right-[19px] z-[2] -mt-[12px] grid size-[24px] place-items-center rounded-full border border-solid border-line-3 bg-canvas font-code text-[12px] font-semibold text-ai"
        >
          ›
        </span>
      )}
    </section>
  )
}

/* ① 현장 족적 → 이진화 → 문양 추출 */

function ZoneBox({ zone, top, h, at }: { zone: string; top: number; h: number; at: number }) {
  const ref = useDemoAnim<HTMLSpanElement>(appear(at - 1))
  return (
    <span
      ref={ref}
      aria-hidden="true"
      className="absolute right-[6%] left-[6%] rounded-[6px] border-[1.5px] border-dashed border-ai"
      style={{ top: `calc(${top}% + 3px)`, height: `calc(${h}% - 6px)` }}
    >
      <b className="absolute top-px left-[3px] font-code text-[9.5px] text-ai [text-shadow:0_0_3px_var(--t-bg)]">{zone}</b>
    </span>
  )
}

function ZoneChip({ zone, name, at, src }: { zone: string; name: string; at: number; src: string }) {
  const ref = useDemoAnim<HTMLDivElement>(appear(at))
  return (
    <div ref={ref} className="grid content-center gap-[4px]">
      <span className="flex items-center gap-[6px]">
        <PatternIcon size="sm" name={name} src={src} />
        <b className="text-[12px] text-ai">{zone}</b>
      </span>
      <span className="text-[11.5px] leading-[1.3] text-fg-2">{name}</span>
      <span className="font-code text-[10px] text-dim">AI 제안</span>
    </div>
  )
}

export function ExtractCard({ art }: { art: LoginDemoArt }) {
  const binRef = useDemoAnim<HTMLDivElement>(binaryReveal)
  const scanRef = useDemoAnim<HTMLSpanElement>(scanLine)
  return (
    <DemoCard widthClass="w-[214px]" start={0} end={34} step="01–03" title="이진화 · 문양 추출">
      <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-[10px]">
        <div className="relative h-[242px] overflow-hidden rounded-[8px] border border-solid border-border bg-canvas">
          <img src={art.scene} alt="현장 족적(예시)" className={IMG} />
          <div ref={binRef} className="absolute inset-0">
            <img src={art.binary} alt="이진화(예시)" className={IMG} />
          </div>
          <span
            ref={scanRef}
            aria-hidden="true"
            className="absolute top-full -right-[4px] -left-[4px] h-[2px] bg-ai opacity-0 [box-shadow:0_0_12px_3px_var(--t-ai-scan-glow)]"
          />
          {DEMO_ZONES.map((z) => (
            <ZoneBox key={z.key} zone={z.zone} top={z.top} h={z.h} at={z.at} />
          ))}
          <span className="absolute bottom-[4px] left-[5px] rounded-[4px] bg-canvas/80 px-[5px] py-px font-code text-[9.5px] text-fg-2">
            0649_2.jpg
          </span>
        </div>
        <div className="grid grid-rows-3 gap-[4px]">
          {DEMO_ZONES.map((z) => (
            <ZoneChip key={z.key} zone={z.zone} name={z.name} at={z.at} src={art.patterns[z.key]} />
          ))}
        </div>
      </div>
    </DemoCard>
  )
}

/* ② 신발 DB 검색 → 리랭킹 */

function RankRow({ row, src }: { row: (typeof DEMO_RANK_ROWS)[number]; src: string }) {
  const enter = 36 + row.from * 2
  const width = Math.round((row.sim - 50) * 8 * 10) / 10
  const moveRef = useDemoAnim<HTMLDivElement>(rowMove(row.from, row.to, RANK_ROW_H))
  const appearRef = useDemoAnim<HTMLDivElement>(appear(enter))
  const hlRef = useDemoAnim<HTMLSpanElement>(answerHighlight)
  const beforeRef = useDemoAnim<HTMLSpanElement>(hideAfter(48))
  const afterRef = useDemoAnim<HTMLSpanElement>(showAfter(48))
  const barRef = useDemoAnim<HTMLSpanElement>(grow(enter, width))
  const badgeRef = useDemoAnim<HTMLSpanElement>(appear(52))
  const ans = row.answer
  return (
    <div ref={moveRef} data-rank-row={row.no} className="absolute inset-x-0 h-[40px]" style={{ top: row.to * RANK_ROW_H }}>
      <div
        ref={appearRef}
        className="relative grid h-full grid-cols-[22px_36px_minmax(0,1fr)_auto] items-center gap-[7px] rounded-[8px] border border-solid border-line-2 px-[6px]"
      >
        {ans && (
          <span
            ref={hlRef}
            aria-hidden="true"
            className="pointer-events-none absolute -inset-px rounded-[8px] border border-solid border-ai/45 bg-ai-bg"
          />
        )}
        <span className="relative h-[34px] overflow-hidden rounded-[4px]">
          <img src={src} alt={`${row.no} 밑창(예시)`} className={IMG} />
        </span>
        <span className={cn("relative grid font-code text-[11px] font-semibold", ans ? "text-ai" : "text-fg-2")}>
          <span ref={beforeRef} aria-hidden="true" className={cn("[grid-area:1/1] opacity-0", ans && "text-warn")}>
            {row.before}
          </span>
          <span ref={afterRef} className="[grid-area:1/1]">
            {row.after}
          </span>
        </span>
        <span className="relative grid min-w-0 gap-[4px]">
          <span className="font-code text-[11px] text-foreground">{row.no}</span>
          <span className="h-[3px] rounded-[2px] bg-border">
            <span ref={barRef} className={cn("block h-full rounded-[2px]", ans ? "bg-ai" : "bg-dim")} style={{ width: `${width}%` }} />
          </span>
        </span>
        <span className={cn("relative font-code text-[10.5px]", ans ? "text-ai" : "text-muted-foreground")}>{row.sim.toFixed(1)}</span>
      </div>
      {ans && (
        <span ref={badgeRef} className="absolute -top-[9px] -right-[4px]">
          <Chip className="h-[17px] border-ai-line bg-ai-bg px-[5px] font-code text-[9.5px] tabular-nums text-ai">▲136</Chip>
        </span>
      )}
    </div>
  )
}

export function SearchCard({ art }: { art: LoginDemoArt }) {
  const dbRef = useDemoAnim<HTMLSpanElement>(grow(34, 100, 4))
  const markRef = useDemoAnim<HTMLSpanElement>(rerankMark)
  const shoeOf = (i: number) => (i === 0 ? art.answer : art.candidates[i - 1])
  return (
    <DemoCard widthClass="w-[226px]" start={34} end={56} step="04" title="신발 DB 검색">
      <div className="grid content-start gap-[9px]">
        <div className="grid gap-[5px] rounded-[8px] bg-panel-3 px-[9px] py-[8px] text-[11px]">
          <span className="flex justify-between text-muted-foreground">
            <span>신발 DB</span>
            <b className="font-code text-fg-2">128,406켤레</b>
          </span>
          <span className="h-[3px] rounded-[2px] bg-border">
            <span ref={dbRef} className="block h-full w-full rounded-[2px] bg-brand-2" />
          </span>
          <span className="flex justify-between text-muted-foreground">
            <span>문양 일치 후보</span>
            <b className="font-code text-fg-2">857건</b>
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">AI 리랭킹 순위</span>
          <span ref={markRef} className="inline-flex items-center gap-[4px] font-code text-[10px] font-semibold tracking-[0.12em] text-ai">
            ● RERANK
          </span>
        </div>
        <div className="relative" style={{ height: RANK_ROW_H * DEMO_RANK_ROWS.length }}>
          {DEMO_RANK_ROWS.map((r, i) => (
            <RankRow key={r.no} row={r} src={shoeOf(i)} />
          ))}
        </div>
      </div>
    </DemoCard>
  )
}

/* ③ 1:1 정밀 대조 — 이진화 족적 ↔ 1위 신발(대응점 · 히트맵 · 지표 · 신뢰도) */

// 밑창 좌표(100×264)를 100×170 칸 안(높이에 맞춤, 가운데)으로 옮긴다: 폭 64.4 · 왼쪽 여백 18
const SCALE = 0.644
const lx = (x: number) => 18 + x * SCALE

function PairLine({ x, y, index }: { x: number; y: number; index: number }) {
  const ok = index !== 3
  const at = 57 + index * 2
  const groupRef = useDemoAnim<SVGGElement>(appear(at))
  const lineRef = useDemoAnim<SVGLineElement>(draw(at))
  const yy = Number((y * SCALE).toFixed(1))
  const x1 = Number(lx(x).toFixed(1))
  const x2 = Number((122 + lx(x)).toFixed(1))
  const tone = ok ? "stroke-ai" : "stroke-warn"
  return (
    <g ref={groupRef}>
      <line
        ref={ok ? lineRef : undefined}
        x1={x1}
        y1={yy}
        x2={x2}
        y2={yy}
        pathLength={1}
        className={tone}
        strokeWidth={1.2}
        strokeDasharray={ok ? "1" : "0.04 0.03"}
        opacity={0.9}
      />
      <circle cx={x1} cy={yy} r={2.6} fill="none" className={tone} strokeWidth={1.2} />
      <circle cx={x2} cy={yy} r={2.6} fill="none" className={tone} strokeWidth={1.2} />
    </g>
  )
}

const ARC = "M12 62A48 48 0 0 1 108 62"

export function CompareCard({ art }: { art: LoginDemoArt }) {
  const heatRef = useDemoAnim<HTMLSpanElement>(heatShow)
  const gaugeRef = useDemoAnim<SVGPathElement>(gaugeFill)
  const scoreRef = useDemoAnim<HTMLElement>(appear(70))
  const metricRef = useDemoAnim<HTMLDivElement>(appear(68))
  const chipRef = useDemoAnim<HTMLDivElement>(appear(72))
  return (
    <DemoCard widthClass="w-[246px]" start={56} end={76} step="05" title="1:1 정밀 대조">
      <div className="grid content-start gap-[10px]">
        <div className="relative grid h-[170px] grid-cols-[100px_100px] gap-[22px]">
          <span className="overflow-hidden rounded-[8px] border border-solid border-border bg-picon">
            <img src={art.binary} alt="현장 이진화(예시)" className={IMG} />
          </span>
          <span className="relative overflow-hidden rounded-[8px] border border-solid border-ai-line bg-paper">
            <img src={art.answer} alt="1위 신발 305657 밑창(예시)" className={IMG} />
            <span ref={heatRef} aria-hidden="true" className="absolute inset-0">
              <span className="absolute inset-y-0 left-1/2 aspect-[100/264] h-full -translate-x-1/2">
                <HeatOverlay variant="spots" />
              </span>
            </span>
          </span>
          <svg viewBox="0 0 222 170" width={222} height={170} aria-hidden="true" className="absolute inset-0 overflow-visible">
            {DEMO_POINTS.map(([x, y], i) => (
              <PairLine key={i} x={x} y={y} index={i} />
            ))}
          </svg>
          <span className="absolute top-[4px] left-[4px] rounded-[3px] bg-canvas/75 px-[4px] font-code text-[9px] text-fg-2">현장</span>
          <span className="absolute top-[4px] left-[126px] rounded-[3px] bg-canvas/75 px-[4px] font-code text-[9px] text-ai">305657</span>
        </div>
        <div className="grid grid-cols-[92px_minmax(0,1fr)] items-center gap-[10px]">
          <div className="relative h-[56px] w-[92px]">
            <svg viewBox="0 0 120 68" width={92} height={52} aria-hidden="true">
              <path d={ARC} fill="none" className="stroke-line-3" strokeWidth={9} strokeLinecap="round" />
              <path
                ref={gaugeRef}
                d={ARC}
                fill="none"
                className="stroke-ai"
                strokeWidth={9}
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray="100"
                strokeDashoffset={13}
              />
            </svg>
            <b ref={scoreRef} title="종합 신뢰도" className="absolute inset-x-0 bottom-0 text-center font-code text-[17px]">
              87%
            </b>
          </div>
          <div ref={metricRef} className="grid gap-[3px] text-[10.5px]">
            {DEMO_METRICS.map(([k, v]) => (
              <span key={k} className="flex justify-between gap-[6px]">
                <span className="text-muted-foreground">{k}</span>
                <b className="font-code text-ai">{v}</b>
              </span>
            ))}
          </div>
        </div>
        <div ref={chipRef} className="flex flex-wrap gap-[5px]">
          <Chip variant="green-h18" className="h-[19px]">
            대응점 5 / 6
          </Chip>
          <Chip variant="amber-h19">중 1곳 마모 차이</Chip>
        </div>
      </div>
    </DemoCard>
  )
}

/* ④ 감정서 초안 — 1–6항이 한 줄씩 채워지고 발견 이미지가 붙은 뒤 「초안」 도장 */

function PaperLine({ label, width, index }: { label: string; width: number; index: number }) {
  const at = 77 + index * 2
  const rowRef = useDemoAnim<HTMLDivElement>(appear(at))
  const barRef = useDemoAnim<HTMLSpanElement>(grow(at, width, 3))
  return (
    <div ref={rowRef} className="grid gap-[2px]">
      <span className="text-[8.5px] leading-[1.2] font-bold text-panel-3">{label}</span>
      <span ref={barRef} className="block h-[3px] rounded-[2px] bg-fg-2" style={{ width: `${width}%` }} />
    </div>
  )
}

export function ReportCard({ art }: { art: LoginDemoArt }) {
  const attachRef = useDemoAnim<HTMLDivElement>(appear(89))
  const stampRef = useDemoAnim<HTMLSpanElement>(stampDrop)
  return (
    <DemoCard widthClass="w-[170px]" start={76} end={92} step="06" title="감정서 초안" arrow={false}>
      <div className="grid content-start gap-[8px]">
        <div className="relative grid h-[272px] content-start gap-[6px] rounded-[4px] bg-picon px-[10px] pt-[10px] pb-[8px] [box-shadow:0_10px_26px_0_var(--t-panel-drop)]">
          <b className="text-center text-[12px] tracking-[0.5em] text-canvas">감정서</b>
          <span className="text-center font-code text-[8px] text-dim">00001-25-0649 · 주거침입</span>
          {DEMO_REPORT_ITEMS.map(([label, width], i) => (
            <PaperLine key={label} label={label} width={width} index={i} />
          ))}
          <div ref={attachRef} className="flex gap-[4px]">
            <span className="h-[44px] w-[26px] border border-solid border-fg-2 bg-picon">
              <img src={art.binary} alt="" className={IMG} />
            </span>
            <span className="h-[44px] w-[26px] border border-solid border-fg-2 bg-paper">
              <img src={art.answer} alt="" className={IMG} />
            </span>
            <span className="self-end text-[8px] text-dim">발견 이미지 첨부</span>
          </div>
          <span
            ref={stampRef}
            data-demo-stamp=""
            className="absolute right-[8px] bottom-[10px] rounded-[4px] border-[1.5px] border-solid border-danger px-[6px] py-[2px] font-ui text-[9px] font-bold text-danger [transform:rotate(-8deg)]"
          >
            초안
          </span>
        </div>
        <span className="text-[10.5px] leading-[1.45] text-muted-foreground">
          감정관이 고치고
          <br />
          교차 검증 → 결재
        </span>
      </div>
    </DemoCard>
  )
}
