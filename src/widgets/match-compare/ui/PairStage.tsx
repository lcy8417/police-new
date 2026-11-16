import type * as React from "react"

import { cn } from "@/shared/lib/utils"
import { AiTag, ScanOverlay } from "@/shared/ui/ai"
import { PointPairs, type PointPairBox } from "@/shared/ui/viewer"

import { containScale, crimeToStage, shoeToStage, STAGE, STAGE_W } from "../model/stage"
import type { MatchImage, MatchInsight } from "../model/types"

// 유류 | 발견 두 칸(시안 S06 고정 배치 245 · 10 · 205 × 340). 칸마다 그림(object-contain) + Top-10 대응 박스(PointPairs, 지금 기능 F26).
// +α(insight)면 두 칸에 걸친 AI 대응점 39개 선 · 상중하 구역 선 · 「AI 정합 보정」 표 · 훑기 선을 얹는다(모두 pointer-events-none 장식).

type Look = "rgb" | "sketch"

const CAPTION = "pointer-events-none absolute bottom-[6px] left-[8px] font-code text-[10.5px] font-semibold [text-shadow:0_1px_2px_var(--t-bg)]"

function Pane({
  label,
  side,
  image,
  look,
  boxes,
  activeIndex,
  onActive,
  left,
  width,
  children,
}: {
  label: string
  side: "crime" | "shoe"
  image: MatchImage
  look: Look
  boxes: PointPairBox[]
  activeIndex: number | null
  onActive: (index: number | null) => void
  left: number
  width: number
  children?: React.ReactNode
}) {
  return (
    <div
      data-match-image={side}
      data-look={look}
      // 칸 자리는 고정 배치에서 나온 값(좌표 파생 위치)
      style={{ left: `${(left / STAGE_W) * 100}%`, width: `${(width / STAGE_W) * 100}%` }}
      className="absolute inset-y-0 overflow-hidden rounded-[10px] border border-solid border-border bg-canvas"
    >
      {/* object-contain 과 PointPairs(viewBox meet)가 같은 비율로 맞춰진다 */}
      <img src={look === "rgb" ? image.rgb : image.sketch} alt={label} className="block size-full object-contain" />
      <PointPairs
        boxes={boxes}
        side={side}
        activeIndex={activeIndex}
        onHover={onActive}
        onSelect={onActive}
        width={image.width}
        height={image.height}
        aria-label={`${label} 대응 박스`}
      />
      {children}
    </div>
  )
}

function DenseOverlay({ insight, crimeImage, shoeImage }: { insight: MatchInsight; crimeImage: MatchImage; shoeImage: MatchImage }) {
  const f = (n: number) => Number(n.toFixed(1))
  const cHalf = (96 * containScale({ w: STAGE.crimeW, h: STAGE.h }, crimeImage)) / 2
  const sHalf = (96 * containScale({ w: STAGE.shoeW, h: STAGE.h }, shoeImage)) / 2
  const zc = insight.zoneLines.crime
  const zs = insight.zoneLines.shoe
  const labels: [string, number, number][] = [
    ["상", (zc.top + zc.bounds[0]) / 2, (zs.top + zs.bounds[0]) / 2],
    ["중", (zc.bounds[0] + zc.bounds[1]) / 2, (zs.bounds[0] + zs.bounds[1]) / 2],
    ["하", (zc.bounds[1] + zc.bottom) / 2, (zs.bounds[1] + zs.bottom) / 2],
  ]
  return (
    <svg
      data-plus
      data-dense-pairs={insight.pairs.length}
      viewBox={`0 0 ${STAGE_W} ${STAGE.h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[2] size-full"
    >
      {zc.bounds.map((y, i) => {
        const a = crimeToStage(crimeImage, zc.x[0], y)
        const b = crimeToStage(crimeImage, zc.x[1], y)
        const c = shoeToStage(shoeImage, zs.x[0], zs.bounds[i])
        const d = shoeToStage(shoeImage, zs.x[1], zs.bounds[i])
        return (
          <g key={i} data-zone-line={i}>
            <line x1={f(a[0])} y1={f(a[1])} x2={f(b[0])} y2={f(b[1])} className="stroke-[var(--t-heat-yellow)]" strokeWidth={1} strokeDasharray="5 4" opacity={0.55} />
            <line x1={f(c[0])} y1={f(c[1])} x2={f(d[0])} y2={f(d[1])} className="stroke-warn" strokeWidth={1} strokeDasharray="5 4" opacity={0.7} />
          </g>
        )
      })}
      {labels.map(([t, yc, ys]) => {
        const a = crimeToStage(crimeImage, zc.x[1], yc)
        const c = shoeToStage(shoeImage, zs.x[1], ys)
        return (
          <g key={t} className="font-sans text-[11px] font-bold">
            <text x={f(a[0] + 2)} y={f(a[1] + 4)} className="fill-[var(--t-heat-yellow)]" opacity={0.85}>
              {t}
            </text>
            <text x={f(c[0] + 4)} y={f(c[1] + 4)} className="fill-warn">
              {t}
            </text>
          </g>
        )
      })}
      {insight.pairs.map((p, i) => {
        const a = crimeToStage(crimeImage, p.fx, p.fy)
        const b = shoeToStage(shoeImage, p.sx, p.sy)
        const stroke = p.ok ? "stroke-ai" : "stroke-danger-fg"
        const fill = p.ok ? "fill-ai" : "fill-danger-fg"
        if (i < insight.representative) {
          return (
            <line
              key={i}
              data-pair-line="rep"
              data-ok={p.ok ? "true" : "false"}
              x1={f(a[0] + cHalf)}
              y1={f(a[1])}
              x2={f(b[0] - sHalf)}
              y2={f(b[1])}
              className={cn(p.ok ? "stroke-ai drop-shadow-[0_0_3px_var(--t-ai-scan-glow)]" : "stroke-danger-fg")}
              strokeWidth={1.5}
              strokeDasharray={p.ok ? undefined : "4 3"}
              opacity={0.95}
            />
          )
        }
        return (
          <g key={i} data-pair-line="more" data-ok={p.ok ? "true" : "false"}>
            <line
              x1={f(a[0])}
              y1={f(a[1])}
              x2={f(b[0])}
              y2={f(b[1])}
              className={stroke}
              strokeWidth={0.8}
              strokeDasharray={p.ok ? undefined : "2 2"}
              opacity={p.ok ? 0.26 : 0.34}
            />
            <circle cx={f(a[0])} cy={f(a[1])} r={2} className={fill} opacity={0.85} />
            <circle cx={f(b[0])} cy={f(b[1])} r={2} className={fill} opacity={0.85} />
          </g>
        )
      })}
    </svg>
  )
}

export function PairStage({
  crimeImage,
  shoeImage,
  look,
  crimeBoxes,
  shoeBoxes,
  activeIndex,
  onActive,
  crimeCaption,
  shoeCaption,
  insight,
}: {
  crimeImage: MatchImage
  shoeImage: MatchImage
  look: Look
  crimeBoxes: PointPairBox[]
  shoeBoxes: PointPairBox[]
  activeIndex: number | null
  onActive: (index: number | null) => void
  crimeCaption: string
  shoeCaption: string
  insight: MatchInsight | null
}) {
  return (
    <div className="grid w-[460px] max-w-full gap-[4px]">
      <div className="grid grid-cols-[245fr_205fr] gap-[10px] text-[11.5px] text-muted-foreground">
        <span className="rounded-[4px] bg-strip px-[6px] py-[3px]">유류 이미지</span>
        <span className="rounded-[4px] bg-strip px-[6px] py-[3px]">발견 이미지</span>
      </div>
      <div data-pair-stage className="relative aspect-[460/340] w-full">
        <Pane
          label="유류 이미지"
          side="crime"
          image={crimeImage}
          look={look}
          boxes={crimeBoxes}
          activeIndex={activeIndex}
          onActive={onActive}
          left={0}
          width={STAGE.crimeW}
        >
          {insight ? (
            <span data-plus>
              <ScanOverlay active className="motion-safe:[animation-duration:3.6s]" />
              <span className={cn(CAPTION, "text-fg-2")}>{crimeCaption}</span>
              <AiTag className="pointer-events-none absolute top-[7px] left-[56px]">{`AI 정합 ${insight.alignAngle} 보정`}</AiTag>
            </span>
          ) : null}
        </Pane>
        <Pane
          label="발견 이미지"
          side="shoe"
          image={shoeImage}
          look={look}
          boxes={shoeBoxes}
          activeIndex={activeIndex}
          onActive={onActive}
          left={STAGE.crimeW + STAGE.gap}
          width={STAGE.shoeW}
        >
          {insight ? (
            <span data-plus className={cn(CAPTION, "text-fg-2")}>
              {shoeCaption}
            </span>
          ) : null}
        </Pane>
        {insight ? <DenseOverlay insight={insight} crimeImage={crimeImage} shoeImage={shoeImage} /> : null}
      </div>
    </div>
  )
}
