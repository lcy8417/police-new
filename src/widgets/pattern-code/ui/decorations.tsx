// S04 좌표 캔버스(PatternCanvas 자리) 위 「시안 도구 모양」 고정 장식(spec §6-1, layout.md 「좌표 민감 영역」).
// 공용 부품이 아니고 이 화면 폴더 안의 표시 조각이다. pointer-events-none 이라 경계선 끌기 판정을 막지 않고,
// 좌표(line_ys · render_size)를 재거나 보내지 않는다. 위치값(%)만 인라인 style 로 받는다.
import { cn } from "@/shared/lib/utils"

/** 상 · 중 · 하 경계선 2개 + 끌기 손잡이 모양. ys 는 위에서부터 백분율 */
export function BoundaryLines({ ys }: { ys: readonly [number, number] }) {
  return (
    <div data-deco="boundary-lines" aria-hidden="true" className="pointer-events-none absolute inset-0">
      {ys.map((y, i) => (
        <span key={i} className="absolute inset-x-0 h-0 border-t-2 border-dashed border-danger" style={{ top: `${y}%` }}>
          <span className="absolute right-[6px] -top-[8px] grid h-[14px] w-[22px] place-items-center rounded-[3px] bg-danger text-[9px] leading-none text-paper">
            ⇕
          </span>
        </span>
      ))}
    </div>
  )
}

/** 영역별 AI 확신도 꼬리표 한 개(시안 r3 「상 0.93」) */
export interface ZoneConfidenceTag {
  key: "top" | "mid" | "bottom"
  /** 부위 글자(상 · 중 · 하) */
  label: string
  /** 띠 시작 · 끝(위에서부터 백분율) */
  from: number
  to: number
  /** AI 확신도 0~1 */
  confidence: number
}

const TAG_TONE: Record<ZoneConfidenceTag["key"], string> = {
  top: "border-brand/60 text-brand",
  mid: "border-ai/60 text-ai",
  bottom: "border-violet/60 text-violet",
}

/**
 * 영역별 AI 확신도(시안 핀 12 +α) — 상 · 중 · 하 띠 가운데 왼쪽에 「상 0.93」 꼬리표. 신규(+α)라 `data-plus`.
 * 띠 자체는 ZoneBands(공용)가 그리고, 이 장식은 꼬리표만 얹는다.
 */
export function ZoneConfidenceTags({ tags }: { tags: readonly ZoneConfidenceTag[] }) {
  return (
    <div data-deco="zone-confidence" data-plus="" aria-hidden="true" className="pointer-events-none absolute inset-0">
      {tags.map((t) => (
        <span
          key={t.key}
          className={cn(
            "absolute left-[4px] -mt-[9px] rounded-[4px] border border-solid bg-canvas/90 px-[5px] py-px font-code text-[10px]",
            TAG_TONE[t.key],
          )}
          style={{ top: `${(t.from + t.to) / 2}%` }}
        >
          <b>{t.label}</b> {t.confidence.toFixed(2)}
        </span>
      ))}
    </div>
  )
}

/** 가격표로 보이는 네모(시안 핀 8 — 주황). 신규(+α)라 `data-plus` */
export function PriceTagBox({ left, top, width, height }: { left: number; top: number; width: number; height: number }) {
  return (
    <span
      data-deco="price-tag"
      data-plus=""
      aria-hidden="true"
      className="pointer-events-none absolute border-[1.5px] border-solid border-warn bg-warn/25"
      style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}
    />
  )
}

/** 신발 사각 영역(ROI) 틀 */
export function RoiBox({ left, top, width, height }: { left: number; top: number; width: number; height: number }) {
  return (
    <span
      data-deco="roi-box"
      aria-hidden="true"
      className="pointer-events-none absolute border-[1.5px] border-solid border-brand"
      style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}
    >
      <span className="absolute top-[2px] right-[2px] rounded-[3px] bg-canvas/90 px-[5px] font-code text-[9.5px] text-brand">ROI</span>
    </span>
  )
}
