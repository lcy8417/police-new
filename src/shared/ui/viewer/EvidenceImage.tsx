import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"

// 시안 `.imgbox`(2:3 틀 · 증거 꼬리표 · cm 자)의 부품판. 보기 방식은 `<img>` 에 CSS 필터로 건다.
// 주의: 표시 크기를 재서 좌표를 서버로 보내는 캔버스 화면(PatternCanvas · useCalibration · Canvas.jsx 등)에는
// 쓰지 않는다(layout.md 「좌표 민감 영역」). 이 틀은 사진 일부를 자른다(`object-cover`).
export type EvidenceLook = "raw" | "binary" | "invert" | "contrast"

const LOOK_CLASS: Record<EvidenceLook, string> = {
  raw: "",
  binary: "grayscale contrast-[3] brightness-[1.1]",
  invert: "invert",
  contrast: "grayscale contrast-[1.55] brightness-[1.08]",
}

export interface EvidenceImageProps extends Omit<React.ComponentProps<"div">, "children"> {
  src: string
  alt: string
  /** 보기 방식(기본 raw = 원본) */
  look?: EvidenceLook
  /** 왼쪽 아래 글자(시안 `.cap`) */
  caption?: string
  /** 오른쪽 위 노란 증거 번호표 글자 */
  tag?: string
  /** cm 자(왼쪽 · 아래 눈금) */
  ruler?: boolean
  /** 사진 위에 얹는 장식(클릭을 막지 않는 겹 안에 들어간다) */
  children?: React.ReactNode
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
}

function Ruler() {
  const ticks = Array.from({ length: 31 }, (_, i) => i)
  return (
    <svg
      data-part-slot="ruler"
      viewBox="0 0 200 300"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full text-fg-2"
    >
      {ticks.map((i) => (
        <line key={`v${i}`} x1="0" x2={i % 5 ? 4 : 8} y1={i * 10} y2={i * 10} stroke="currentColor" strokeWidth={i % 5 ? 0.6 : 1} />
      ))}
      {ticks.slice(0, 21).map((i) => (
        <line key={`h${i}`} y1="300" y2={i % 5 ? 296 : 292} x1={i * 10} x2={i * 10} stroke="currentColor" strokeWidth={i % 5 ? 0.6 : 1} />
      ))}
      <text x="196" y="288" fontSize="7" textAnchor="end" fill="currentColor" className="font-code">
        cm
      </text>
    </svg>
  )
}

export function EvidenceImage({
  src,
  alt,
  look = "raw",
  caption,
  tag,
  ruler = false,
  children,
  partId,
  className,
  ...props
}: EvidenceImageProps) {
  return (
    <div
      {...partAttrs("EvidenceImage", { variant: look, id: partId })}
      className={cn(
        "relative aspect-[2/3] overflow-hidden rounded-[10px] border border-solid border-border bg-canvas",
        className
      )}
      {...props}
    >
      {/* 빈 src(볼 권한 없음 · 그림 없음)는 그리지 않는다 — 빈 src 는 페이지를 다시 받으려 하고 React 가 경고한다 */}
      {src ? <img src={src} alt={alt} className={cn("block size-full object-cover", LOOK_CLASS[look])} /> : null}
      {ruler ? <Ruler /> : null}
      {children ? <div className="pointer-events-none absolute inset-0">{children}</div> : null}
      {tag ? (
        <span className="absolute top-[6px] right-[6px] grid h-[18px] min-w-[18px] place-items-center rounded-[3px] border border-solid border-canvas bg-warn px-[3px] font-code text-[10px] font-bold text-canvas">
          {tag}
        </span>
      ) : null}
      {caption ? (
        <span className="absolute bottom-[6px] left-[8px] font-code text-[10.5px] font-semibold text-fg-2 [text-shadow:0_1px_2px_var(--t-bg)]">
          {caption}
        </span>
      ) : null}
    </div>
  )
}
