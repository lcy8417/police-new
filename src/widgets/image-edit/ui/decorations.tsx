import * as React from "react"

import { cn } from "@/shared/lib/utils"

// S03 좌표 캔버스 위 「시안 도구 모양」 고정 장식(spec §6-1, layout.md 「좌표 민감 영역」).
// 공용 부품이 아니고 이 화면 폴더 안의 표시 조각이다. 모두 pointer-events-none 이라 운영 캔버스의
// 누름 · 끌기 판정을 막지 않고, 좌표를 재거나 보내지 않는다. 위치값(%)만 인라인 style 로 받는다.
// 위치는 사진 상자(2:3) 기준 백분율 — 사진 상자 안에 넣는다.

/** 백분율 점 */
export interface PctPoint {
  x: number
  y: number
}

/** 백분율 사각형(상자 가장자리에서 들어온 거리) */
export interface PctInset {
  left: number
  right: number
  top: number
  bottom: number
}

const insetStyle = (r: PctInset): React.CSSProperties => ({
  left: `${r.left}%`,
  right: `${r.right}%`,
  top: `${r.top}%`,
  bottom: `${r.bottom}%`,
})

const TAG = "rounded-[4px] bg-canvas/90 px-[6px] py-px font-code text-[10.5px] whitespace-nowrap"

/** 자르기 틀 — 틀 밖은 어둡게, 안은 3분할선, 모서리 · 변 가운데 손잡이(시안 S03 A) */
export function CropFrame({ rect, sizeLabel, children }: { rect: PctInset; sizeLabel?: string; children?: React.ReactNode }) {
  const corners: [string, string][] = [
    ["left-0 top-0 -ml-[3px] -mt-[3px] border-r-0 border-b-0", "tl"],
    ["right-0 top-0 -mr-[3px] -mt-[3px] border-l-0 border-b-0", "tr"],
    ["left-0 bottom-0 -ml-[3px] -mb-[3px] border-r-0 border-t-0", "bl"],
    ["right-0 bottom-0 -mr-[3px] -mb-[3px] border-l-0 border-t-0", "br"],
  ]
  return (
    <div
      data-deco="crop-frame"
      aria-hidden="true"
      className="pointer-events-none absolute border-[1.5px] border-solid border-brand [box-shadow:0_0_0_2000px_color-mix(in_srgb,var(--t-bg)_62%,transparent)]"
      style={insetStyle(rect)}
    >
      {/* 3분할선: 회색 사진 위에서도 보이게 /55(밝은 팔레트에서 /30 은 거의 안 보였다) */}
      <span className="absolute inset-y-0 left-1/3 w-px bg-foreground/55" />
      <span className="absolute inset-y-0 left-2/3 w-px bg-foreground/55" />
      <span className="absolute inset-x-0 top-1/3 h-px bg-foreground/55" />
      <span className="absolute inset-x-0 top-2/3 h-px bg-foreground/55" />
      {corners.map(([pos, key]) => (
        <span key={key} className={cn("absolute size-[14px] border-[3px] border-solid border-foreground", pos)} />
      ))}
      <span className="absolute top-0 left-1/2 -mt-[2px] -ml-[9px] h-[4px] w-[18px] rounded-[2px] bg-foreground" />
      <span className="absolute bottom-0 left-1/2 -mb-[2px] -ml-[9px] h-[4px] w-[18px] rounded-[2px] bg-foreground" />
      <span className="absolute top-1/2 left-0 -mt-[9px] -ml-[2px] h-[18px] w-[4px] rounded-[2px] bg-foreground" />
      <span className="absolute top-1/2 right-0 -mt-[9px] -mr-[2px] h-[18px] w-[4px] rounded-[2px] bg-foreground" />
      {sizeLabel ? (
        <span className={cn(TAG, "absolute -bottom-[24px] left-1/2 -translate-x-1/2 text-fg-2")}>{sizeLabel}</span>
      ) : null}
      {children}
    </div>
  )
}

/** 회전 손잡이 — 자르기 틀 위 가운데(CropFrame 의 자식으로 넣는다) */
export function RotateHandle({ label }: { label: string }) {
  return (
    <span data-deco="rotate-handle" aria-hidden="true" className="pointer-events-none absolute -top-[50px] left-1/2">
      <span className="absolute top-[16px] left-0 h-[34px] w-px bg-brand" />
      <span className="absolute top-0 -left-[10px] grid size-[20px] place-items-center rounded-[50%] border-2 border-solid border-brand bg-canvas text-[11px] text-brand">
        ↻
      </span>
      <span className={cn(TAG, "absolute top-[2px] left-[16px] text-foreground")}>{label}</span>
    </span>
  )
}

/** 4점 각도보정 표식 + 안내 다각형 */
export function FourPoints({ points }: { points: [PctPoint, PctPoint, PctPoint, PctPoint] }) {
  return (
    <div data-deco="four-points" aria-hidden="true" className="pointer-events-none absolute inset-0">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
        <polygon
          points={points.map((p) => `${p.x},${p.y}`).join(" ")}
          vectorEffect="non-scaling-stroke"
          className="fill-brand/10 stroke-brand [stroke-dasharray:4_3] [stroke-width:1.5]"
        />
      </svg>
      {points.map((p, i) => (
        <span
          key={i}
          className="absolute -mt-[9px] -ml-[9px] grid size-[18px] place-items-center rounded-[50%] border-2 border-solid border-brand bg-canvas font-code text-[10px] font-bold text-brand"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          {i + 1}
        </span>
      ))}
    </div>
  )
}

/** 길이측정 — 기준선 P1 · P2(파랑, 1 cm) · 측정선 P3 · P4(빨강) */
export function MeasureLines({ reference, measure }: { reference: [PctPoint, PctPoint]; measure: [PctPoint, PctPoint] }) {
  const line = (pair: [PctPoint, PctPoint], cls: string) => (
    <line
      x1={pair[0].x}
      y1={pair[0].y}
      x2={pair[1].x}
      y2={pair[1].y}
      vectorEffect="non-scaling-stroke"
      className={cn("[stroke-width:2]", cls)}
    />
  )
  const dots: [PctPoint, string, string][] = [
    [reference[0], "P1", "text-brand"],
    [reference[1], "P2", "text-brand"],
    [measure[0], "P3", "text-danger-fg"],
    [measure[1], "P4", "text-danger-fg"],
  ]
  return (
    <div data-deco="measure-lines" aria-hidden="true" className="pointer-events-none absolute inset-0">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
        {line(reference, "stroke-brand")}
        {line(measure, "stroke-danger")}
      </svg>
      {dots.map(([p, name, tone]) => (
        <span key={name} className={cn(TAG, "absolute -mt-[20px] ml-[4px]", tone)} style={{ left: `${p.x}%`, top: `${p.y}%` }}>
          {name}
        </span>
      ))}
    </div>
  )
}

/** 십자선 — 지금 찍는 자리 */
export function Crosshair({ at }: { at: PctPoint }) {
  return (
    <div data-deco="crosshair" aria-hidden="true" className="pointer-events-none absolute inset-0">
      <span className="absolute inset-y-0 w-px bg-ai/75" style={{ left: `${at.x}%` }} />
      <span className="absolute inset-x-0 h-px bg-ai/75" style={{ top: `${at.y}%` }} />
      <span
        className="absolute -mt-[9px] -ml-[9px] size-[18px] rounded-[50%] border-[1.5px] border-solid border-ai"
        style={{ left: `${at.x}%`, top: `${at.y}%` }}
      />
    </div>
  )
}

/** 확대경 — 같은 사진을 zoom 배로 키워 그 자리를 동그라미 안에 보인다 */
export function Loupe({ src, at, zoom = 4 }: { src: string; at: PctPoint; zoom?: number }) {
  return (
    <span
      data-deco="loupe"
      aria-hidden="true"
      className="pointer-events-none absolute size-[84px] overflow-hidden rounded-[50%] border-2 border-solid border-ai bg-canvas"
      style={{ left: `calc(${at.x}% + 14px)`, top: `calc(${at.y}% + 14px)` }}
    >
      <img
        src={src}
        alt=""
        className="absolute max-w-none"
        style={{
          width: `${zoom * 100}%`,
          height: `${zoom * 100}%`,
          left: `${50 - at.x * zoom}%`,
          top: `${50 - at.y * zoom}%`,
        }}
      />
      <span className="absolute inset-x-0 bottom-[4px] text-center font-code text-[9.5px] text-ai">×{zoom}</span>
    </span>
  )
}

/** 축소판 지도 — 지금 보는 범위(캔버스 상자 오른쪽 아래) */
export function Minimap({ src, view }: { src: string; view: PctInset }) {
  return (
    <span
      data-deco="minimap"
      aria-hidden="true"
      className="pointer-events-none absolute right-[10px] bottom-[10px] h-[88px] w-[62px] overflow-hidden rounded-[5px] border border-solid border-line-3 bg-canvas"
    >
      <img src={src} alt="" className="size-full object-cover" />
      <span className="absolute border-[1.5px] border-solid border-brand" style={insetStyle(view)} />
    </span>
  )
}

/** 다각형 — 배경제거(파랑, 남길 영역) · 접합장애물제거(청록, 지울 영역) */
export function PolygonMask({ points, tone }: { points: PctPoint[]; tone: "keep" | "remove" }) {
  return (
    <div data-deco="polygon" aria-hidden="true" className="pointer-events-none absolute inset-0">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
        <polygon
          points={points.map((p) => `${p.x},${p.y}`).join(" ")}
          vectorEffect="non-scaling-stroke"
          className={cn("[stroke-width:1.5]", tone === "keep" ? "fill-brand/15 stroke-brand" : "fill-ai/20 stroke-ai")}
        />
      </svg>
      {points.map((p, i) => (
        <span
          key={i}
          className={cn(
            "absolute -mt-[4px] -ml-[4px] size-[8px] rounded-[2px] border border-solid border-canvas",
            tone === "keep" ? "bg-brand" : "bg-ai",
          )}
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        />
      ))}
    </div>
  )
}
