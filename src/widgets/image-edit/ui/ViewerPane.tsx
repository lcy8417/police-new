import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { LiveDot } from "@/shared/ui/ai"
import { Button, Chip, Field, Segmented } from "@/shared/ui/kit"
import { CompareView, EvidenceImage, type CompareMode, type EvidenceLook } from "@/shared/ui/viewer"

import { DEFAULT_VIEW_ADJUSTMENTS, lookFor, SCAS_BOTTOM_BUTTONS, type ScasBottomButton } from "../model/constants"
import type { FoundImage, ViewAdjustments } from "../model/types"
import { Crosshair, Loupe, type PctPoint } from "./decorations"
import { ScasButtonRow } from "./ScasButtonRow"

const PRESSED = "bg-brand-bg text-foreground [box-shadow:inset_0_0_0_1px_var(--t-brand)]"
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
/** 소수 한 자리로(감마 0.1 걸음의 부동소수 꼬리 지움) */
const round1 = (v: number) => Math.round(v * 10) / 10
/** 음수 기호는 시안처럼 − (U+2212) */
const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0")

/** 시안 `.btn.sm` 작은 줄(뷰어 창 안 SCAS 줄 · −[값]+) */
const SMALL_ROW = "gap-[3px] [&_button]:h-[22px] [&_button]:px-[6px] [&_button]:text-[11px]"
/** 시안 `inp mono` 44 × 24 숫자 칸(브라우저 숫자 화살표는 숨겨 시안처럼 숫자만) */
const STEP_FIELD =
  "h-[24px] w-[44px] justify-center px-[4px] text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"

/** 십자선 · 돋보기 자리(시안 left 46% · top 36%) */
const CROSS_AT: PctPoint = { x: 46, y: 36 }
/** 시안 뷰어 확대율 칸 기본값 「288」 = 1배 */
const BASE_ZOOM = 288

interface StepSpec {
  key: "brightness" | "contrast" | "gamma"
  label: string
  min: number
  max: number
  step: number
}

const NUMBERS: StepSpec[] = [
  { key: "brightness", label: "밝기", min: -100, max: 100, step: 5 },
  { key: "contrast", label: "대비", min: -100, max: 100, step: 5 },
  { key: "gamma", label: "감마", min: 0.2, max: 3, step: 0.1 },
]

const MODES = [
  { value: "side", label: "나란히" },
  { value: "overlay", label: "겹쳐 보기" },
  { value: "slide", label: "밀어서 비교" },
]

const LINKS = [
  { value: "linked", label: "🔗 함께 확대·이동" },
  { value: "free", label: "따로" },
]

/** 시안 「− [값] +」 한 묶음 */
function Step({
  label,
  value,
  onDec,
  onInc,
  onInput,
  placeholder,
  disabled,
}: {
  label: string
  value: number | ""
  onDec: () => void
  onInc: () => void
  /** 없으면 숫자 칸은 읽기 전용 */
  onInput?: (raw: string) => void
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <span className="inline-flex items-center gap-[3px]">
      <Button size="sm" aria-label={`${label} 낮추기`} disabled={disabled} onClick={onDec}>
        −
      </Button>
      <Field
        type="number"
        variant="mono"
        aria-label={label}
        value={value}
        placeholder={placeholder}
        readOnly={!onInput}
        onChange={onInput ? (e) => onInput(e.target.value) : undefined}
        className={STEP_FIELD}
      />
      <Button size="sm" aria-label={`${label} 높이기`} disabled={disabled} onClick={onInc}>
        +
      </Button>
    </span>
  )
}

/** 켜진 보기 칩 글자(시안: 그림 위 칩에 지금 켜진 보기를 파랗게) */
function activeViews(a: ViewAdjustments): string[] {
  const out: string[] = []
  if (a.brightness !== 0) out.push(`밝기 ${signed(a.brightness)}`)
  if (a.contrast !== 0) out.push(`대비 ${signed(a.contrast)}`)
  if (a.gamma !== 1) out.push(`감마 ${a.gamma.toFixed(1)}`)
  if (a.threshold !== null) out.push(`임계값 ${a.threshold}`)
  if (a.invert) out.push("반전")
  if (a.grayscale) out.push("흑백")
  return out
}

/** 보정 줄 — 시안 덧붙임 도구 줄 모양(점선 틀 + −[값]+ · 켜고 끄는 버튼). 1차 지금 기능 F11 */
function AdjustRow({ a, set }: { a: ViewAdjustments; set: (patch: Partial<ViewAdjustments>) => void }) {
  return (
    <div
      role="group"
      aria-label="보정"
      className={cn("flex flex-wrap items-center gap-x-[10px] gap-y-[6px] rounded-[8px] border border-dashed border-line-3 px-[6px] py-[4px]", SMALL_ROW)}
    >
      <span className="text-[11px] text-dim">보정(덧붙임)</span>
      {NUMBERS.map((n) => {
        const put = (v: number) => set({ [n.key]: round1(clamp(v, n.min, n.max)) })
        return (
          <span key={n.key} className="inline-flex items-center gap-[4px] text-[11.5px] text-fg-2">
            <span aria-hidden="true">{n.label}</span>
            <Step
              label={n.label}
              value={a[n.key]}
              onDec={() => put(a[n.key] - n.step)}
              onInc={() => put(a[n.key] + n.step)}
              onInput={(raw) => {
                const v = Number(raw)
                if (Number.isFinite(v)) put(v)
              }}
            />
          </span>
        )
      })}
      <span className="inline-flex items-center gap-[4px] text-[11.5px] text-fg-2">
        <span aria-hidden="true">임계값</span>
        <Step
          label="임계값"
          value={a.threshold ?? ""}
          placeholder="끔"
          onDec={() => a.threshold !== null && set({ threshold: clamp(a.threshold - 5, 0, 255) })}
          onInc={() => set({ threshold: a.threshold === null ? 127 : clamp(a.threshold + 5, 0, 255) })}
          onInput={(raw) => {
            if (raw === "") return set({ threshold: null })
            const v = Number(raw)
            if (Number.isFinite(v)) set({ threshold: clamp(Math.round(v), 0, 255) })
          }}
        />
      </span>
      <Button size="sm" aria-pressed={a.invert} className={cn(a.invert && PRESSED)} onClick={() => set({ invert: !a.invert })}>
        반전
      </Button>
      <Button size="sm" aria-pressed={a.grayscale} className={cn(a.grayscale && PRESSED)} onClick={() => set({ grayscale: !a.grayscale })}>
        흑백
      </Button>
    </div>
  )
}

interface PaneView {
  zoom: number
  rot: number
}

/** 시안 `pane()` — 머리(제목 + 켜진 보기 칩) · −[확대]+ 좌[각도]우 · 그림(십자선) · 작은 SCAS 줄 */
function Pane({
  title,
  chips,
  view,
  onView,
  picture,
  extra,
  row,
}: {
  title: string
  chips: string[]
  view: PaneView
  onView: (next: PaneView) => void
  picture: React.ReactNode
  extra?: React.ReactNode
  row: React.ReactNode
}) {
  return (
    <section aria-label={title} className="grid min-w-0 gap-[6px] rounded-[10px] border border-solid border-border bg-panel-2 p-[8px]">
      <div className="flex items-center gap-[6px] text-[11.5px]">
        <b>{title}</b>
        {chips.length > 0 ? (
          <span className="ml-auto flex flex-wrap justify-end gap-[3px]">
            {chips.map((c) => (
              <Chip key={c} variant="blue-h20" className="h-[17px] px-[5px] text-[9.5px]">
                {c}
              </Chip>
            ))}
          </span>
        ) : null}
      </div>
      <div className={cn("flex flex-wrap items-center gap-[4px]", SMALL_ROW)}>
        <Step
          label={`${title} 확대율`}
          value={view.zoom}
          onDec={() => onView({ ...view, zoom: Math.max(BASE_ZOOM / 4, view.zoom - 24) })}
          onInc={() => onView({ ...view, zoom: view.zoom + 24 })}
        />
        <span className="inline-flex items-center gap-[3px]">
          <Button size="sm" onClick={() => onView({ ...view, rot: view.rot - 90 })}>
            좌
          </Button>
          <Field type="number" variant="mono" aria-label={`${title} 회전 각도`} value={view.rot} readOnly className={STEP_FIELD} />
          <Button size="sm" onClick={() => onView({ ...view, rot: view.rot + 90 })}>
            우
          </Button>
        </span>
      </div>
      <span className="relative block h-[262px] overflow-hidden rounded-[8px] border border-solid border-border bg-canvas">
        <span
          className="absolute inset-0 block"
          // 보기용 확대 · 회전(계산되는 변환값만 인라인 style)
          style={{ transform: `scale(${view.zoom / BASE_ZOOM}) rotate(${view.rot}deg)` }}
        >
          {picture}
        </span>
        <Crosshair at={CROSS_AT} />
        {extra}
      </span>
      {row}
    </section>
  )
}

export interface ViewerPaneProps {
  image: { src: string; alt: string }
  adjustments: ViewAdjustments
  onAdjustmentsChange: (next: ViewAdjustments) => void
  /** 시안 r2 신규 요소를 보일까 */
  plus: boolean
  /** 왼쪽 창 머리 글자 */
  viewerLabel?: string
  /** 오른쪽 창 — 발견 이미지(없으면 1차처럼 원본/보정 비교) */
  foundImage?: FoundImage
  onPlusAction?: (label: string) => void
  onReextract?: () => void
  /** AI 다시 추출 · AI 보정을 누를 수 있나(시안 data-lock analyst admin) */
  canAiRedo: boolean
}

/**
 * B — 검색 중 보기용 뷰어(저장 안 함). 보기 방식 · 확대 · 십자선은 저장하지 않는 화면 안 상태.
 * 신규 켜기 + 발견 이미지가 있으면 시안 r3(유류 · 발견 두 장 나란히 · 겹쳐 · 밀어서), 아니면 1차(원본/보정 나란히).
 */
export function ViewerPane({
  image,
  adjustments: a,
  onAdjustmentsChange,
  plus,
  viewerLabel,
  foundImage,
  onPlusAction,
  onReextract,
  canAiRedo,
}: ViewerPaneProps) {
  const set = (patch: Partial<ViewAdjustments>) => onAdjustmentsChange({ ...a, ...patch })
  const [mode, setMode] = React.useState<CompareMode>("side")
  const [linked, setLinked] = React.useState(true)
  const [views, setViews] = React.useState<[PaneView, PaneView]>([
    { zoom: BASE_ZOOM, rot: 0 },
    { zoom: BASE_ZOOM, rot: 0 },
  ])
  const setView = (i: 0 | 1, next: PaneView) =>
    setViews((prev) => (linked ? [next, next] : i === 0 ? [next, prev[1]] : [prev[0], next]))

  const scasRow = (
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
  )

  const note = (
    <p className="m-0 flex items-center gap-[8px] rounded-[8px] border border-solid border-line-3 bg-panel-3 px-[10px] py-[7px] text-[11.5px] text-fg-2">
      <span>
        <b>저장 안 함</b> · 평준화·확대는 보기용이라 닫으면 원본 그대로입니다.
      </span>
    </p>
  )

  if (!plus || !foundImage) {
    // 1차 모양 — 원본/보정 나란히
    const pic = (look: EvidenceLook) => (
      <EvidenceImage src={image.src} alt={image.alt} look={look} className="mx-auto h-[360px] w-auto max-w-full" />
    )
    return (
      <section aria-label="이미지 뷰어" className="flex min-w-0 flex-col gap-[8px]">
        <CompareView mode="side" left={pic("raw")} right={pic(lookFor(a))} leftLabel="원본" rightLabel="보정" />
        <AdjustRow a={a} set={set} />
        {scasRow}
        {note}
      </section>
    )
  }

  const leftTitle = viewerLabel ?? "유류 이미지"
  const fill = "size-full rounded-none border-0 aspect-auto"
  const leftPic = <EvidenceImage src={image.src} alt={image.alt} look={lookFor(a)} className={fill} />
  const rightPic = <EvidenceImage src={foundImage.src} alt={foundImage.alt} look="raw" className={fill} />
  // 발견 이미지 쪽 SCAS 줄 — 이 창은 신규라 버튼이 아직 동작하지 않는다(누르면 준비 중 알림)
  const foundActions = Object.fromEntries(
    SCAS_BOTTOM_BUTTONS.map((b) => [b, () => onPlusAction?.(`발견 이미지 ${b}`)]),
  ) as Record<ScasBottomButton, () => void>

  return (
    <section aria-label="이미지 뷰어" className="flex min-w-0 flex-col gap-[8px]">
      <div data-plus="" className="flex flex-wrap items-center gap-[8px] pr-[14px]">
        <span className="text-[11px] text-dim">보기 방식</span>
        <Segmented
          aria-label="보기 방식"
          items={MODES}
          value={mode}
          onValueChange={(v) => setMode(v as CompareMode)}
          className="[&_button]:px-[9px] [&_button]:py-[3px] [&_button]:text-[11.5px]"
        />
        <span className="ml-auto inline-flex items-center gap-[5px] text-[11px] text-ai">
          <LiveDot state="busy" label="십자선 함께 움직임" hideLabel />
          <span aria-hidden="true">십자선 함께 움직임</span>
        </span>
      </div>

      {mode === "side" ? (
        <div data-plus="" className="grid min-w-0 grid-cols-2 gap-[8px]">
          <Pane
            title={leftTitle}
            chips={activeViews(a)}
            view={views[0]}
            onView={(v) => setView(0, v)}
            picture={leftPic}
            extra={<Loupe src={image.src} at={CROSS_AT} />}
            row={<div className={SMALL_ROW}>{scasRow}</div>}
          />
          <Pane
            title={foundImage.label}
            chips={[]}
            view={views[1]}
            onView={(v) => setView(1, v)}
            picture={rightPic}
            row={
              <div className={SMALL_ROW}>
                <ScasButtonRow label="발견 이미지 아래 버튼 줄" className="gap-[3px]" actions={foundActions} />
              </div>
            }
          />
        </div>
      ) : (
        <div data-plus="" className="flex min-w-0 flex-col gap-[8px]">
          <CompareView
            mode={mode}
            left={<div className="relative h-[262px]">{leftPic}</div>}
            right={<div className="relative h-[262px]">{rightPic}</div>}
            leftLabel={leftTitle}
            rightLabel={foundImage.label}
          />
          {scasRow}
        </div>
      )}

      <AdjustRow a={a} set={set} />

      <div data-plus="" className="flex items-center justify-center gap-[6px]">
        <Segmented
          aria-label="함께 확대 · 이동"
          items={LINKS}
          value={linked ? "linked" : "free"}
          onValueChange={(v) => setLinked(v === "linked")}
          className="[&_button]:px-[9px] [&_button]:py-[3px] [&_button]:text-[11.5px]"
        />
      </div>

      {note}

      <div data-plus="" className="flex flex-wrap gap-[6px]">
        <Button size="sm" variant="ai" disabled={!canAiRedo} onClick={onReextract}>
          ✦ 이 화면 그대로 AI 문양 다시 추출 → S04
        </Button>
        <Button size="sm" variant="ai" disabled={!canAiRedo} onClick={() => onPlusAction?.("AI 보정")}>
          AI 보정 ▾ 이진화·노이즈 제거
        </Button>
      </div>
    </section>
  )
}
