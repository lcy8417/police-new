import { Minus, Plus, RotateCcw, RotateCw, Search } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { WorkbenchButton } from "@/shared/ui/kit"

import {
  DEFAULT_VIEW_TUNE,
  GAMMA_VALUE,
  isViewTuned,
  LENS_MAX,
  LENS_MIN,
  LENS_STEP,
  LENS_ZOOMS,
  rotateTune,
  stepTune,
  type LensSettings,
  type TuneStep,
  type ViewTune,
} from "./view-tune"

/** 막대 앞 흐린 이름 */
const LABEL = "shrink-0 text-[10.5px] font-semibold text-muted-foreground"

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0")

/** − 값 + 한 묶음(걸음 −2 ~ +2) */
function Stepper({ label, value, shown, onChange }: { label: string; value: TuneStep; shown?: string; onChange: (v: TuneStep) => void }) {
  return (
    <span role="group" aria-label={`${label} ${shown ?? signed(value)}`} className="inline-flex items-center gap-[2px]">
      <span className={cn(LABEL, "mr-[3px]")}>{label}</span>
      <WorkbenchButton
        size="sm"
        variant="ghost"
        icon={Minus}
        iconOnly
        aria-label={`${label} 낮추기`}
        disabled={value === -2}
        onClick={() => onChange(stepTune(value, -1))}
        className="w-[20px]"
      />
      <span className={cn("min-w-[20px] text-center font-code text-[11px] tabular-nums", value === 0 ? "text-muted-foreground" : "text-brand")}>
        {shown ?? signed(value)}
      </span>
      <WorkbenchButton
        size="sm"
        variant="ghost"
        icon={Plus}
        iconOnly
        aria-label={`${label} 높이기`}
        disabled={value === 2}
        onClick={() => onChange(stepTune(value, 1))}
        className="w-[20px]"
      />
    </span>
  )
}

export interface ViewControlsProps {
  tune: ViewTune
  onTuneChange: (next: ViewTune) => void
  /** 확대경 — 없으면 확대경 묶음을 그리지 않는다 */
  lens?: LensSettings
  onLensChange?: (next: LensSettings) => void
  /** 살펴보기 판 — 감마까지 */
  full?: boolean
  /** 밝기 걸음을 숨김(좁은 칸) */
  noBrightness?: boolean
  /** 회전 단추(보기용 — 좌표 캔버스 위에서는 끈다) */
  rotatable?: boolean
  className?: string
}

/**
 * 공용 보기 조정 막대 — 대비 · 밝기 · (감마) · 반전 · 이진화 · (회전) + 확대경(켜기 · 지름 · 배율). 보기용 — 저장하지 않는다.
 * 문양 코드 · 검색 결과 · 정밀 대조 · 신발 DB 가 함께 쓴다. 먹색 작업판(`data-theme="dark"`) 안에 놓는다.
 */
export function ViewControls({ tune, onTuneChange, lens, onLensChange, full = false, noBrightness = false, rotatable = false, className }: ViewControlsProps) {
  const set = (patch: Partial<ViewTune>) => onTuneChange({ ...tune, ...patch })
  return (
    <div role="group" aria-label="보기 조정" className={cn("flex flex-wrap items-center gap-x-[6px] gap-y-[4px]", className)}>
      <Stepper label="대비" value={tune.contrast} onChange={(v) => set({ contrast: v })} />
      {noBrightness ? null : <Stepper label="밝기" value={tune.brightness} onChange={(v) => set({ brightness: v })} />}
      {full ? <Stepper label="감마" value={tune.gamma} shown={GAMMA_VALUE[tune.gamma]} onChange={(v) => set({ gamma: v })} /> : null}
      <span className="inline-flex items-center gap-[3px]">
        <WorkbenchButton size="sm" variant="ghost" aria-pressed={tune.invert} onClick={() => set({ invert: !tune.invert })}>
          반전
        </WorkbenchButton>
        <WorkbenchButton size="sm" variant="ghost" aria-pressed={tune.binary} onClick={() => set({ binary: !tune.binary })}>
          이진화
        </WorkbenchButton>
        {rotatable ? (
          <WorkbenchButton
            size="sm"
            variant="ghost"
            icon={RotateCw}
            aria-pressed={tune.rotate !== 0}
            title="시계 방향 90° 돌리기"
            onClick={() => set({ rotate: rotateTune(tune.rotate ?? 0) })}
          >
            {tune.rotate ? `${tune.rotate}°` : "회전"}
          </WorkbenchButton>
        ) : null}
        <WorkbenchButton
          size="sm"
          variant="ghost"
          icon={RotateCcw}
          iconOnly
          aria-label="보기 되돌리기"
          title="보기 조정을 처음으로"
          disabled={!isViewTuned(tune)}
          onClick={() => onTuneChange(DEFAULT_VIEW_TUNE)}
        />
      </span>
      {lens && onLensChange ? (
        <>
          <span aria-hidden="true" className="h-[16px] w-px bg-line-3" />
          <span role="group" aria-label="확대경" className="inline-flex items-center gap-[6px]">
            <WorkbenchButton
              size="sm"
              variant="ghost"
              icon={Search}
              aria-pressed={lens.on}
              title="마우스를 댄 자리를 동그랗게 키워 봅니다 — 지름은 Shift + 휠 또는 [ ] 키"
              onClick={() => onLensChange({ ...lens, on: !lens.on })}
            >
              확대경
            </WorkbenchButton>
            {lens.on ? (
              <>
                <label className="inline-flex items-center gap-[4px]">
                  <span className={LABEL}>지름</span>
                  <input
                    type="range"
                    aria-label="확대경 지름"
                    min={LENS_MIN}
                    max={LENS_MAX}
                    step={LENS_STEP}
                    value={lens.size}
                    onChange={(e) => onLensChange({ ...lens, size: Number(e.target.value) })}
                    className="h-[16px] w-[64px] cursor-pointer accent-brand"
                  />
                </label>
                <span role="group" aria-label="확대경 배율" className="inline-flex items-center gap-[1px]">
                  {LENS_ZOOMS.map((z) => (
                    <WorkbenchButton
                      key={z}
                      size="sm"
                      variant="ghost"
                      aria-pressed={lens.zoom === z}
                      aria-label={`${z}배`}
                      className="px-[6px] font-code"
                      onClick={() => onLensChange({ ...lens, zoom: z })}
                    >
                      ×{z}
                    </WorkbenchButton>
                  ))}
                </span>
              </>
            ) : null}
          </span>
        </>
      ) : null}
    </div>
  )
}
