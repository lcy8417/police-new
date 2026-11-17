import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"

// 시안 `.picon` 의 부품판. `src` 는 받은 그대로 그린다 — 경로를 붙이거나 바꾸지 않는다
// (docs/pattern-data-model.md §3: 표시 컴포넌트 안에서 재변환 금지, 소비 측이 hydrate 해서 넘긴다).
export type PatternIconSize = "sm" | "md" | "lg"

const SIZE_CLASS: Record<PatternIconSize, string> = {
  sm: "size-[28px]",
  md: "size-[36px]",
  lg: "size-[48px]",
}

export interface PatternIconProps extends Omit<React.ComponentProps<"span">, "children"> {
  /** 문양 이름(대체글 · 툴팁) */
  name: string
  /** 이미지 경로(그대로 사용) */
  src: string
  size?: PatternIconSize
  /** 필수 문양 — 「필수」 표시 */
  essential?: boolean
  /** 같은 문양 개수 표시 */
  count?: number
  /** 고름(`sel`, 파란 테) */
  selected?: boolean
  /** AI 제안(`ai`, 청록 테) */
  ai?: boolean
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
}

export function PatternIcon({
  name,
  src,
  size = "md",
  essential = false,
  count,
  selected = false,
  ai = false,
  partId,
  className,
  title,
  ...props
}: PatternIconProps) {
  // 배지(필수 · 개수)가 없으면 시안처럼 바탕 안에서 자른다. 배지는 모서리 밖으로 나와야 하므로 있으면 자르지 않고 그림 모서리만 둥글게 한다.
  const hasBadge = essential || count !== undefined
  const alt = selected ? `${name} 선택됨` : ai ? `${name} AI 제안` : name
  // 그림을 못 읽으면(서버 이름에 맞는 그림이 이 화면에 없음 등) 깨진 그림 · 대체글 대신 같은 칸 안에 이름만 작게 —
  // 칸 크기 · 줄이 흐트러지지 않게(11/17 사용자 「문양 부분 좀 규격화하고 정렬맞춰」). 다른 src 가 오면 다시 그림을 시도한다
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null)
  const failed = failedSrc === src
  return (
    <span
      {...partAttrs("PatternIcon", { variant: size, state: selected ? "sel" : ai ? "ai" : undefined, id: partId })}
      title={title ?? name}
      className={cn(
        // 바탕은 시안 .picon 의 밝은 종이색(토큰 --t-picon-bg)
        "inline-grid place-items-center rounded-[6px] border border-solid border-line-3 bg-picon",
        SIZE_CLASS[size],
        // 배지가 있으면 배지의 기준(relative)이 되고 자르지 않는다. 없으면 시안처럼 static + 안에서 자름.
        hasBadge ? "relative" : "overflow-hidden",
        selected && "outline-2 outline-offset-1 outline-brand",
        ai && !selected && "outline-2 outline-offset-1 outline-ai",
        className
      )}
      {...props}
    >
      {failed ? (
        <span
          role="img"
          aria-label={alt}
          data-img-missing=""
          className="grid size-full min-w-0 place-items-center overflow-hidden px-[2px] text-center font-code text-[9px] leading-[1.15] break-all text-muted-foreground"
        >
          {name}
        </span>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailedSrc(src)}
          className={cn("size-full object-contain", hasBadge && "overflow-hidden rounded-[5px]")}
        />
      )}
      {essential ? (
        <span className="absolute -top-[5px] -left-[5px] rounded-[3px] border border-solid border-danger-line bg-danger-bg px-[3px] text-[9px] leading-[12px] text-danger-fg">
          필수
        </span>
      ) : null}
      {count !== undefined ? (
        <span className="absolute -right-[5px] -bottom-[5px] min-w-[14px] rounded-[7px] border border-solid border-brand-line bg-brand-bg px-[3px] text-center font-code text-[9px] leading-[12px] text-brand">
          {count}
        </span>
      ) : null}
    </span>
  )
}
