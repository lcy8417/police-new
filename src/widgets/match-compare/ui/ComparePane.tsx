import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { LensBox, PointPairs, ViewControls, viewTuneClass, viewTuneLabels, type LensSettings, type LensZoom, type PointPairBox, type ViewTune } from "@/shared/ui/viewer"

import type { MatchImage, ZoneLines } from "../model/types"
import { viewToRatio, type RatioPoint } from "../model/zoom-link"

// 사건 창 정밀 대조의 한 칸(유류 · 발견). 먹색 작업판 안: 칸 막대(이름 · 번호 · 보기 조정) + 그림 상자.
// 그림 상자는 그림 비율 그대로(좌표 파생 크기) — 그 안에 보기 조정 겹 · 함께 확대(핀) 겹 · 구역 선 · Top-10 대응 박스 · 짝 표시.
// 장식(구역 선 · 핀 · 짝 고리 · 꼬리표 · 확대경)은 모두 pointer-events-none, 움직임 · 누름은 바깥 상자 pointer 이벤트로만 읽는다.

type Look = "rgb" | "sketch"

const BAR = "flex shrink-0 flex-wrap items-center gap-x-[8px] gap-y-[4px] bg-panel px-[10px] py-[5px]"
const TAG = "pointer-events-none absolute z-[2] rounded-[5px] bg-canvas/90 px-[7px] py-[2px] font-code text-[10px] text-fg-2"
/** 함께 확대 배율 → 고정 클래스(Tailwind 가 읽게 글자 그대로) */
const PIN_SCALE: Record<LensZoom, string> = { 2: "scale-200", 3: "scale-300", 4: "scale-400" }
const ZONE_NAMES = ["상", "중", "하"] as const

const pct = (v: number) => `${(v * 100).toFixed(2)}%`

/** 확대 중 보이는 자리: q = o + (r − o)·z — 상자 밖이면 null */
function shownAt(r: RatioPoint, pin: RatioPoint | null, scale: number): RatioPoint | null {
  const q = pin ? { x: pin.x + (r.x - pin.x) * scale, y: pin.y + (r.y - pin.y) * scale } : r
  return q.x < 0 || q.x > 1 || q.y < 0 || q.y > 1 ? null : q
}

export interface ComparePaneProps {
  side: "crime" | "shoe"
  /** 칸 이름(유류 · 발견) */
  title: string
  /** 그림 번호(감정물 번호 · 화류번호) */
  code: string
  image: MatchImage
  look: Look
  tune: ViewTune
  onTuneChange: (next: ViewTune) => void
  lens: LensSettings
  onLensSizeStep: (by: 1 | -1) => void
  /** 상 · 중 · 하 구역 선(그 그림 좌표계) — 있으면 그린다 */
  zones?: ZoneLines
  boxes: PointPairBox[]
  showBoxes: boolean
  activeIndex: number | null
  onActive: (index: number | null) => void
  /** 확대 찍기 모드 */
  pinMode: boolean
  /** 이 칸의 확대 기준점(핀) — 있으면 그 자리를 배율만큼 키워 멈춘다 */
  pin: RatioPoint | null
  /** 반대쪽 마우스 자리의 짝(같은 상 · 중 · 하 위치 비율) */
  partner: RatioPoint | null
  /** 마우스 자리(그림 비율) — 떠나면 null */
  onHover: (at: RatioPoint | null) => void
  /** 확대 찍기 모드에서 누름 */
  onPick: (at: RatioPoint) => void
  /** 칸 막대 끝 자리(상세 보기 등) */
  headEnd?: React.ReactNode
  /** 칸 안 겹 자리(상세 팝 등) */
  children?: React.ReactNode
}

export function ComparePane(props: ComparePaneProps) {
  const { side, title, code, image, look, tune, lens, zones, pin, partner, pinMode } = props
  const cls = viewTuneClass(tune)
  const labels = viewTuneLabels(tune)
  const scale = lens.zoom
  const src = look === "rgb" ? image.rgb : image.sketch

  const ratioOf = (e: React.PointerEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    return viewToRatio(e.clientX - r.left, e.clientY - r.top, { width: r.width, height: r.height }, tune.rotate ?? 0, pin ? { origin: pin, scale } : null)
  }

  // 확대 겹: 핀 자리를 기준으로 키운다(기준점은 움직이지 않는다 — 핀 표시는 그 자리 그대로)
  const zoomClass = cn("absolute inset-0 motion-safe:transition-transform motion-safe:duration-200", pin && PIN_SCALE[scale])
  const zoomStyle = pin ? { transformOrigin: `${pct(pin.x)} ${pct(pin.y)}` } : undefined
  const picture = <img src={src} alt="" draggable={false} className="block size-full object-contain select-none" />
  const partnerShown = partner ? shownAt(partner, pin, scale) : null
  const zoneMarks = zones
    ? ZONE_NAMES.map((name, i) => {
        const stops = [zones.top, zones.bounds[0], zones.bounds[1], zones.bottom]
        return { name, y: (stops[i] + stops[i + 1]) / 2 / image.height }
      })
    : []

  return (
    <section aria-label={title} data-compare-pane={side} className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className={cn(BAR, "border-0 border-b border-solid border-border py-[4px]")}>
        <h3 aria-label={title} className="m-0 mr-[4px] text-[12.5px] font-bold whitespace-nowrap text-foreground">
          {title.split(" ")[0]}
        </h3>
        <ViewControls tune={tune} onTuneChange={props.onTuneChange} noBrightness rotatable />
        {props.headEnd ? <span className="ml-auto inline-flex items-center gap-[4px]">{props.headEnd}</span> : null}
      </div>
      <div className="relative grid min-h-0 flex-1 place-items-center bg-canvas p-[10px] [container-type:size]">
        <div
          data-match-image={side}
          data-look={look}
          data-pinned={pin ? "true" : undefined}
          onPointerMove={(e) => props.onHover(ratioOf(e))}
          onPointerLeave={() => props.onHover(null)}
          onClick={(e) => {
            if (pinMode) props.onPick(ratioOf(e))
          }}
          // 그림 비율 그대로 칸에 꽉(좌표 파생 크기 — 대응 박스 · 구역 선이 같은 비율로 맞는다)
          style={{
            width: `min(100cqw, calc(100cqh * ${image.width} / ${image.height}))`,
            aspectRatio: `${image.width} / ${image.height}`,
          }}
          className={cn(
            "relative max-h-full overflow-hidden rounded-[6px] border border-solid border-line-3 bg-canvas [box-shadow:0_8px_24px_var(--t-panel-drop)]",
            pinMode && (pin ? "cursor-zoom-out" : "cursor-zoom-in"),
          )}
        >
          <LensBox
            enabled={lens.on}
            size={lens.size}
            zoom={lens.zoom}
            tune={cls}
            onSizeStep={props.onLensSizeStep}
            source={
              <div className={zoomClass} style={zoomStyle}>
                {picture}
              </div>
            }
            lensSlot="compare-lens"
            className="size-full"
          >
            <div className={cn("absolute inset-0", cls.outer)}>
              <div className={zoomClass} style={zoomStyle}>
                <div className={cn("absolute inset-0", cls.inner)}>
                  <img src={src} alt={`${title} ${code}`} draggable={false} className="block size-full object-contain select-none" />
                </div>
                {zones ? (
                  <svg
                    aria-hidden="true"
                    data-zone-lines
                    viewBox={`0 0 ${image.width} ${image.height}`}
                    preserveAspectRatio="none"
                    className="pointer-events-none absolute inset-0 size-full"
                  >
                    {zones.bounds.map((y, i) => (
                      <line
                        key={i}
                        x1={zones.x[0]}
                        x2={zones.x[1]}
                        y1={y}
                        y2={y}
                        className="stroke-warn"
                        strokeWidth={1.2}
                        strokeDasharray="6 5"
                        vectorEffect="non-scaling-stroke"
                        opacity={0.75}
                      />
                    ))}
                  </svg>
                ) : null}
                {zoneMarks.map((m) => (
                  <span
                    key={m.name}
                    aria-hidden="true"
                    style={{ top: pct(m.y) }}
                    className="pointer-events-none absolute left-[4px] -translate-y-1/2 text-[10px] font-bold text-warn [text-shadow:0_1px_2px_var(--t-bg)]"
                  >
                    {m.name}
                  </span>
                ))}
                {props.showBoxes ? (
                  <PointPairs
                    boxes={props.boxes}
                    side={side}
                    activeIndex={props.activeIndex}
                    onHover={props.onActive}
                    onSelect={props.onActive}
                    width={image.width}
                    height={image.height}
                    aria-label={`${title} 대응 박스`}
                  />
                ) : null}
              </div>
              {pin ? (
                <span
                  aria-hidden="true"
                  data-pin-mark
                  style={{ left: pct(pin.x), top: pct(pin.y) }}
                  className="pointer-events-none absolute z-[2] size-[18px] -translate-1/2 rounded-full border-2 border-solid border-brand [box-shadow:0_0_0_2px_var(--t-canvas)]"
                >
                  <i className="absolute top-1/2 left-1/2 size-[4px] -translate-1/2 rounded-full bg-brand" />
                </span>
              ) : null}
              {partnerShown ? (
                <span
                  aria-hidden="true"
                  data-partner-mark
                  style={{ left: pct(partnerShown.x), top: pct(partnerShown.y) }}
                  className="pointer-events-none absolute z-[2] size-[26px] -translate-1/2 rounded-full border-[1.5px] border-dashed border-ai"
                />
              ) : null}
            </div>
          </LensBox>
          <span className={cn(TAG, "bottom-[6px] left-[6px]")}>{code}</span>
          {labels.length ? <span className={cn(TAG, "top-[6px] right-[6px] text-brand")}>{labels.join(" · ")}</span> : null}
          {pin ? <span className={cn(TAG, "top-[6px] left-[6px] text-brand")}>{`고정 ×${scale}`}</span> : null}
        </div>
        {props.children}
      </div>
    </section>
  )
}
