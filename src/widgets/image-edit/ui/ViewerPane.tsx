import { cn } from "@/shared/lib/utils"
import { Button, Field } from "@/shared/ui/kit"
import { CompareView, EvidenceImage, type EvidenceLook } from "@/shared/ui/viewer"

import { DEFAULT_VIEW_ADJUSTMENTS, lookFor } from "../model/constants"
import type { ViewAdjustments } from "../model/types"
import { ScasButtonRow } from "./ScasButtonRow"

const PRESSED = "bg-brand-bg text-foreground [box-shadow:inset_0_0_0_1px_var(--t-brand)]"
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

interface NumberSpec {
  key: "brightness" | "contrast" | "gamma"
  label: string
  min: number
  max: number
  step: number
}

const NUMBERS: NumberSpec[] = [
  { key: "brightness", label: "밝기", min: -100, max: 100, step: 5 },
  { key: "contrast", label: "대비", min: -100, max: 100, step: 5 },
  { key: "gamma", label: "감마", min: 0.2, max: 3, step: 0.1 },
]

export interface ViewerPaneProps {
  image: { src: string; alt: string }
  adjustments: ViewAdjustments
  onAdjustmentsChange: (next: ViewAdjustments) => void
  onClose: () => void
}

/** B — 검색 중 보기용 뷰어(저장 안 함). 원본/보정 나란히 + 보기 방식 6가지 */
export function ViewerPane({ image, adjustments: a, onAdjustmentsChange, onClose }: ViewerPaneProps) {
  const set = (patch: Partial<ViewAdjustments>) => onAdjustmentsChange({ ...a, ...patch })
  const pic = (look: EvidenceLook) => (
    <EvidenceImage src={image.src} alt={image.alt} look={look} className="mx-auto h-[360px] w-auto max-w-full" />
  )
  return (
    <section aria-label="이미지 뷰어" className="flex min-w-0 flex-col gap-[8px]">
      <CompareView mode="side" left={pic("raw")} right={pic(lookFor(a))} leftLabel="원본" rightLabel="보정" />

      <div className="flex flex-wrap items-center gap-x-[14px] gap-y-[6px] rounded-[8px] border border-solid border-line-2 bg-panel-2 px-[10px] py-[8px]">
        <span className="text-[11px] text-dim">보기 방식</span>
        {NUMBERS.map((n) => (
          <span key={n.key} className="inline-flex items-center gap-[5px] text-[12px] text-fg-2">
            <span aria-hidden="true">{n.label}</span>
            <Field
              type="number"
              variant="mono"
              aria-label={n.label}
              min={n.min}
              max={n.max}
              step={n.step}
              value={a[n.key]}
              onChange={(e) => {
                const v = Number(e.target.value)
                if (Number.isFinite(v)) set({ [n.key]: clamp(v, n.min, n.max) })
              }}
              className="w-[64px]"
            />
          </span>
        ))}
        <span className="inline-flex items-center gap-[5px] text-[12px] text-fg-2">
          <span aria-hidden="true">임계값</span>
          <Field
            type="number"
            variant="mono"
            aria-label="임계값"
            min={0}
            max={255}
            placeholder="끔"
            value={a.threshold ?? ""}
            onChange={(e) => {
              const raw = e.target.value
              if (raw === "") return set({ threshold: null })
              const v = Number(raw)
              if (Number.isFinite(v)) set({ threshold: clamp(Math.round(v), 0, 255) })
            }}
            className="w-[64px]"
          />
        </span>
        <Button size="sm" aria-pressed={a.invert} className={cn(a.invert && PRESSED)} onClick={() => set({ invert: !a.invert })}>
          반전
        </Button>
        <Button
          size="sm"
          aria-pressed={a.grayscale}
          className={cn(a.grayscale && PRESSED)}
          onClick={() => set({ grayscale: !a.grayscale })}
        >
          흑백
        </Button>
      </div>

      <ScasButtonRow
        label="SCAS 뷰어 아래 버튼 줄"
        className="gap-[3px]"
        pressed={{ 색상반전: a.invert }}
        actions={{
          처음상태: () => onAdjustmentsChange(DEFAULT_VIEW_ADJUSTMENTS),
          색상반전: () => set({ invert: !a.invert }),
          밝게: () => set({ brightness: clamp(a.brightness + 10, -100, 100) }),
          어둡게: () => set({ brightness: clamp(a.brightness - 10, -100, 100) }),
        }}
      />

      <div className="flex items-center gap-[8px]">
        <p className="flex flex-1 items-center gap-[8px] rounded-[8px] border border-solid border-line-3 bg-panel-3 px-[10px] py-[7px] text-[11.5px] text-fg-2">
          <b>저장 안 함</b> · 밝기 · 반전 같은 보기 설정은 닫으면 원본 그대로입니다.
        </p>
        <Button size="sm" onClick={onClose}>
          닫기
        </Button>
      </div>
    </section>
  )
}
