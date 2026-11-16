import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"

// 시안 `.stat`(r3 현황 타일)의 부품판. 구조: 라벨(.k) · 숫자(.v, 단위는 작은 글자) · [children] · 보조 글자(.s).
// - tone: 테두리 + 라벨 색. default | ai(청록) | warn(주황) | danger(빨강). 시안은 tone 없이 번짐(glow)만 바꾼 타일도 있어 둘은 따로 받는다.
// - glow: 오른쪽 위 모서리 번짐 색. 안 주면 tone 에 맞춘다(default→기본 파랑, 나머지는 같은 색 계열).
//   시안 화면마다 .14~.22 사이로 조금씩 달리 준 번짐은 5가지(기본 · brand · ai · warn · danger)로 모았다.
// - size: md(기본, 숫자 22px) · sm(S09, 19px) · xs(S14, 17px) — 시안이 인라인으로 줄인 크기.
// label · value 는 생략 가능: S01 「AI 사전 처리」 카드처럼 첫 줄이 따로 짜인 타일은 children 으로만 채운다.
export type StatTone = "default" | "ai" | "warn" | "danger"
export type StatGlow = "default" | "brand" | "ai" | "warn" | "danger"
export type StatSize = "md" | "sm" | "xs"

const BASE =
  "relative grid gap-[4px] overflow-hidden rounded-[10px] border border-solid border-border " +
  "bg-[linear-gradient(160deg,var(--t-panel-2),var(--t-panel))] px-[12px] py-[10px] " +
  "after:pointer-events-none after:absolute after:-right-[30px] after:-top-[30px] after:size-[90px] after:rounded-[50%] " +
  "after:bg-[radial-gradient(var(--glow,var(--t-stat-glow)),transparent_70%)] after:content-['']"

const TONE_CLASS: Record<StatTone, string> = {
  default: "",
  ai: "border-ai-line",
  warn: "border-warn-line",
  danger: "border-danger-line",
}
const LABEL_TONE: Record<StatTone, string> = {
  default: "text-muted-foreground",
  ai: "text-muted-foreground",
  warn: "text-warn",
  danger: "text-danger-fg",
}
const TONE_GLOW: Record<StatTone, StatGlow> = { default: "default", ai: "ai", warn: "warn", danger: "danger" }
const GLOW_CLASS: Record<StatGlow, string> = {
  default: "[--glow:var(--t-stat-glow)]",
  brand: "[--glow:var(--t-stat-glow-brand)]",
  ai: "[--glow:var(--t-stat-glow-ai)]",
  warn: "[--glow:var(--t-stat-glow-warn)]",
  danger: "[--glow:var(--t-stat-glow-danger)]",
}
const SIZE_CLASS: Record<StatSize, { root: string; k: string; v: string; s: string }> = {
  md: { root: "", k: "text-[11.5px]", v: "text-[22px]", s: "text-[10.5px]" },
  sm: { root: "px-[9px] py-[8px]", k: "text-[10.5px]", v: "text-[19px]", s: "text-[9.5px] leading-[1.3]" },
  xs: { root: "gap-[2px] px-[10px] py-[7px]", k: "text-[11.5px]", v: "text-[17px]", s: "text-[10.5px]" },
}

export interface StatTileProps extends Omit<React.ComponentProps<"div">, "children"> {
  label?: React.ReactNode
  value?: React.ReactNode
  /** 숫자 뒤 작은 단위(건 · 장 · 명 …) */
  unit?: string
  /** 아래 보조 글자(.s) */
  sub?: React.ReactNode
  tone?: StatTone
  glow?: StatGlow
  size?: StatSize
  /** 숫자 색: danger 면 빨강(S14 「실패·권한 없음」) */
  valueTone?: "default" | "danger"
  /** 숫자와 보조 글자 사이(막대 등) */
  children?: React.ReactNode
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
}

export function StatTile({
  label,
  value,
  unit,
  sub,
  tone = "default",
  glow,
  size = "md",
  valueTone = "default",
  children,
  partId,
  className,
  ...props
}: StatTileProps) {
  const sz = SIZE_CLASS[size]
  const variant = [tone === "default" ? "" : tone, size === "md" ? "" : size].filter(Boolean).join("-")
  return (
    <div
      {...partAttrs("StatTile", { variant: variant || undefined, id: partId })}
      className={cn(BASE, TONE_CLASS[tone], GLOW_CLASS[glow ?? TONE_GLOW[tone]], sz.root, className)}
      {...props}
    >
      {label != null && <span className={cn(LABEL_TONE[tone], sz.k)}>{label}</span>}
      {value != null && (
        <span
          className={cn(
            "font-code font-bold tabular-nums",
            valueTone === "danger" ? "text-danger-fg" : "text-foreground",
            sz.v,
            "leading-none",
          )}
        >
          {value}
          {unit && <small className="font-ui text-[11px] font-medium leading-[normal] text-dim"> {unit}</small>}
        </span>
      )}
      {children}
      {sub != null && <span className={cn("text-dim", sz.s)}>{sub}</span>}
    </div>
  )
}
