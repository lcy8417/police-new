import * as React from "react"
import { Check, X } from "lucide-react"

import type { PatternZone } from "@/entities/pattern"
import { cn } from "@/shared/lib/utils"
import { PatternIcon } from "@/shared/ui/viewer"

import { DRAG_FORMAT, PATTERN_COUNTS, patternName, ZONE_ROWS } from "../model/constants"
import type { CrimeZones, PatternCardMeta, PatternCount, PatternMetaMap, WeightLevel } from "../model/types"
import { describeWeight, WEIGHT_LABEL, WEIGHT_LEVELS, WEIGHT_VALUE, type PatternWeight, type PatternWeightMap } from "../model/weight-rules"

/** AI 확신도가 이보다 낮으면 주황 */
const LOW = 0.5

export interface ZoneBoardProps {
  zones: CrimeZones
  selectedZone: PatternZone
  onSelectZone: (zone: PatternZone) => void
  onDropToZone: (zone: PatternZone, src: string) => void
  onRemovePattern: (zone: PatternZone, index: number) => void
  onToggleEssential: (zone: PatternZone, index: number) => void
  canEdit: boolean
  meta?: PatternMetaMap
  weights: PatternWeightMap
  onWeightChange?: (zone: PatternZone, index: number, level: WeightLevel | null) => void
  onConfirmSuggestion?: (zone: PatternZone, index: number) => void
  onCountChange?: (zone: PatternZone, index: number, count: PatternCount) => void
}

/** 작은 꼬리 단추(필수 · 확인 · 빼기) — 카드 안 22 높이 */
const MINI =
  "inline-flex h-[20px] shrink-0 cursor-pointer items-center gap-[3px] rounded-[5px] border border-solid px-[5px] text-[10.5px] font-semibold transition-colors duration-150 motion-reduce:transition-none disabled:cursor-default disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-brand"

/**
 * 가중치 세 칸(낮 · 보 · 높) — 신호 막대 모양. 고른 단계까지 막대가 차고, 옆에 ×값. 사람이 고르면 「직접」.
 * 마우스 설명에 걸린 규칙(spec 2026-11-17 §3 「화면에 까닭을 보인다」). 고른 칸을 다시 누르면 규칙 값으로 되돌린다.
 */
function WeightBars({
  label,
  weight,
  disabled,
  onChange,
}: {
  label: string
  weight: PatternWeight
  disabled: boolean
  onChange?: (level: WeightLevel | null) => void
}) {
  const at = WEIGHT_LEVELS.indexOf(weight.level)
  const why = describeWeight(weight)
  return (
    <span role="group" aria-label={`${label} 가중치 ${WEIGHT_LABEL[weight.level]}${weight.source === "manual" ? " 직접" : ""}`} title={why} className="inline-flex items-center gap-[4px]">
      <span className="inline-flex items-end gap-[2px]">
        {WEIGHT_LEVELS.map((lv, i) => (
          <button
            key={lv}
            type="button"
            aria-pressed={weight.level === lv}
            aria-label={`가중치 ${WEIGHT_LABEL[lv]}`}
            title={`${WEIGHT_LABEL[lv]} ×${WEIGHT_VALUE[lv]} — ${why}`}
            disabled={disabled || !onChange}
            onClick={() => onChange?.(weight.source === "manual" && weight.level === lv ? null : lv)}
            className="m-0 flex h-[16px] w-[9px] cursor-pointer items-end border-0 bg-transparent p-0 disabled:cursor-default focus-visible:outline-1 focus-visible:outline-solid focus-visible:outline-brand"
          >
            <span
              aria-hidden="true"
              className={cn(
                "block w-full rounded-[2px]",
                i === 0 ? "h-[6px]" : i === 1 ? "h-[10px]" : "h-[14px]",
                i <= at ? (weight.source === "manual" ? "bg-brand" : "bg-fg-2") : "bg-line-3"
              )}
            />
          </button>
        ))}
      </span>
      <span className="font-code text-[10.5px] text-fg-2 tabular-nums">×{weight.value}</span>
      {weight.source === "manual" ? <span className="text-[10px] font-semibold text-brand">직접</span> : null}
    </span>
  )
}

/** 문양 카드(가로 · 컴팩트) — 그림 · 코드 · AI 확신도 · 개수 · 필수 · 가중치 · 빼기 */
function Card({
  zoneLabel,
  name,
  path,
  must,
  meta,
  weight,
  canEdit,
  onRemove,
  onToggle,
  onConfirm,
  onCount,
  onWeight,
}: {
  zoneLabel: string
  name: string
  path: string
  must: boolean
  meta: PatternCardMeta
  weight?: PatternWeight
  canEdit: boolean
  onRemove: () => void
  onToggle: () => void
  onConfirm?: () => void
  onCount?: (count: PatternCount) => void
  onWeight?: (level: WeightLevel | null) => void
}) {
  const sug = meta.status === "suggested"
  const low = meta.confidence !== undefined && meta.confidence < LOW
  return (
    <div
      data-card-status={meta.status}
      className={cn(
        "grid w-[196px] max-w-full grid-cols-[36px_minmax(0,1fr)] items-center gap-x-[7px] gap-y-[4px] rounded-[9px] border px-[6px] py-[5px]",
        sug ? "border-dashed border-ai-line bg-transparent" : "border-solid border-line-3 bg-panel-2",
        must && !sug && "border-danger-line"
      )}
    >
      <button
        type="button"
        disabled={!canEdit}
        aria-label={`${zoneLabel} ${name}${must ? " 필수" : ""}`}
        title="누르면 빼기 · 우클릭하면 필수 켜고 끄기"
        onClick={onRemove}
        onContextMenu={(e) => {
          e.preventDefault()
          onToggle()
        }}
        className={cn("row-span-2 m-0 cursor-pointer border-0 bg-transparent p-0 disabled:cursor-default", sug && "opacity-80")}
      >
        <PatternIcon name={name} src={path} ai={sug} />
      </button>
      <span className="flex min-w-0 items-center gap-[5px]">
        <b className="truncate font-code text-[11.5px] font-semibold text-foreground">{name}</b>
        {meta.status !== "manual" && meta.confidence !== undefined ? (
          <span
            title={`AI 확신도 ${meta.confidence.toFixed(2)}${sug ? " · 확인 전 제안(검색에 안 들어감)" : " · 감정관 확인"}`}
            className={cn("shrink-0 font-code text-[10px] tabular-nums", low || meta.doubtful ? "text-warn" : "text-ai")}
          >
            {sug ? "제안" : "AI"} {meta.confidence.toFixed(2)}
          </span>
        ) : (
          <span className="shrink-0 text-[10px] text-muted-foreground">수동</span>
        )}
        {onCount ? (
          <select
            aria-label={`${zoneLabel} ${name} 개수`}
            title="SCAS 개수 — 이 부위에 이 문양이 몇 개 보이나(0–9 · 10이상)"
            value={meta.count ?? "1"}
            disabled={!canEdit}
            onChange={(e) => onCount(e.target.value as PatternCount)}
            className="ml-auto h-[18px] w-[34px] shrink-0 cursor-pointer appearance-none rounded-[4px] border border-solid border-line-3 bg-panel-3 px-0 text-center font-code text-[10px] text-fg-2 tabular-nums hover:border-brand-line disabled:cursor-default disabled:opacity-60"
          >
            {PATTERN_COUNTS.map((c) => (
              <option key={c} value={c}>
                ×{c}
              </option>
            ))}
          </select>
        ) : null}
      </span>
      <span className="flex min-w-0 items-center gap-[5px]">
        {sug ? (
          <>
            <button
              type="button"
              aria-label={`제안 확인 · ${zoneLabel} ${name}`}
              disabled={!canEdit || !onConfirm}
              onClick={onConfirm}
              className={cn(MINI, "border-ai-line bg-ai-bg text-ai hover:border-ai")}
            >
              <Check aria-hidden="true" className="size-[11px]" strokeWidth={2.6} />
              확인
            </button>
          </>
        ) : (
          <button
            type="button"
            aria-pressed={must}
            aria-label={`필수 · ${zoneLabel} ${name}`}
            title="필수 — 이 문양이 없는 신발은 결과에서 뺍니다(가중치와 따로)"
            disabled={!canEdit}
            onClick={onToggle}
            className={cn(MINI, must ? "border-danger-line bg-danger-bg text-danger-fg" : "border-line-3 bg-transparent text-muted-foreground hover:text-foreground")}
          >
            {must ? "● 필수" : "필수"}
          </button>
        )}
        {weight ? <WeightBars label={`${zoneLabel} ${name}`} weight={weight} disabled={!canEdit} onChange={onWeight} /> : null}
        <button
          type="button"
          aria-label={`${sug ? "제안 빼기" : "빼기"} · ${zoneLabel} ${name}`}
          title="빼기"
          disabled={!canEdit}
          onClick={onRemove}
          className={cn(MINI, "ml-auto border-transparent bg-transparent px-[3px] text-muted-foreground hover:bg-panel-3 hover:text-foreground")}
        >
          <X aria-hidden="true" className="size-[12px]" strokeWidth={2.2} />
        </button>
      </span>
    </div>
  )
}

/**
 * 사건 창 4부위 문양 행(상 · 중 · 하 · 윤곽) — 어두운 작업판 가운데. 지금 앱 `PatternZones` 와 같은 조작
 * (부위 머리 = 넣을 부위 고르기, 그림 = 빼기, 우클릭 = 필수, 행마다 끌어 놓기) + 카드마다 필수 · 가중치 · 빼기 단추.
 * 고른 부위 = 옅은 brand 판 + 1px 테(옆 줄 없음).
 */
export function ZoneBoard({
  zones,
  selectedZone,
  onSelectZone,
  onDropToZone,
  onRemovePattern,
  onToggleEssential,
  canEdit,
  meta,
  weights,
  onWeightChange,
  onConfirmSuggestion,
  onCountChange,
}: ZoneBoardProps) {
  const [dragOver, setDragOver] = React.useState<PatternZone | null>(null)
  return (
    <div role="group" aria-label="현장 이미지 문양" className="flex flex-col gap-[6px]">
      {ZONE_ROWS.map(({ zone, label }) => {
        const items = zones[zone]
        const on = zone === selectedZone
        const over = dragOver === zone
        return (
          <div
            key={zone}
            data-drop-zone={zone}
            onDragOver={
              canEdit
                ? (e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = "copy"
                    if (!over) setDragOver(zone)
                  }
                : undefined
            }
            onDragLeave={canEdit ? () => setDragOver((z) => (z === zone ? null : z)) : undefined}
            onDrop={
              canEdit
                ? (e) => {
                    e.preventDefault()
                    setDragOver(null)
                    const src = e.dataTransfer.getData(DRAG_FORMAT)
                    if (src) onDropToZone(zone, src)
                  }
                : undefined
            }
            className={cn(
              "relative grid grid-cols-[46px_minmax(0,1fr)] items-start gap-[8px] rounded-[10px] @max-[860px]:grid-cols-[38px_minmax(0,1fr)] @max-[860px]:gap-[6px] @max-[860px]:px-[6px] border border-solid px-[8px] py-[7px] transition-colors duration-150 motion-reduce:transition-none",
              on ? "border-brand-line bg-brand-bg/50" : "border-line-2 bg-panel/40",
              over && "border-brand bg-brand-bg"
            )}
          >
            <button
              type="button"
              aria-pressed={on}
              aria-label={`${label} 부위 ${items.length}개${on ? " 입력 중" : ""}`}
              onClick={() => onSelectZone(zone)}
              className="m-0 grid cursor-pointer justify-items-start gap-[3px] border-0 bg-transparent p-0 pt-[3px] text-left text-foreground focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-brand"
            >
              <b className={cn("text-[14px] leading-none", on && "text-brand")}>{label}</b>
              <span className={cn("text-[10px] leading-[1.3]", on ? "font-semibold text-brand" : "text-muted-foreground")}>{on ? "입력 중" : `${items.length}개`}</span>
              {zone === "outline" ? <span className="text-[9.5px] leading-[1.3] text-muted-foreground">AI 미지원</span> : null}
            </button>
            <div className="flex min-w-0 flex-wrap items-center gap-[6px]">
              {items.map(([path, essential], index) => {
                const name = patternName(path)
                return (
                  <Card
                    key={`${name}-${index}`}
                    zoneLabel={label}
                    name={name}
                    path={path}
                    must={Boolean(essential)}
                    meta={meta?.[zone]?.[name] ?? { status: "manual" }}
                    weight={weights[zone]?.[name]}
                    canEdit={canEdit}
                    onRemove={() => onRemovePattern(zone, index)}
                    onToggle={() => onToggleEssential(zone, index)}
                    onConfirm={onConfirmSuggestion ? () => onConfirmSuggestion(zone, index) : undefined}
                    onCount={onCountChange ? (c) => onCountChange(zone, index, c) : undefined}
                    onWeight={onWeightChange ? (lv) => onWeightChange(zone, index, lv) : undefined}
                  />
                )
              })}
              {items.length === 0 ? (
                // 빈 부위만 자리 표시 — 문양이 있는 행은 행 전체가 놓는 자리(끌면 「여기에 놓기」)
                <span className="inline-grid h-[48px] min-w-[132px] place-items-center rounded-[9px] border border-dashed border-line-3 px-[10px] text-[10.5px] text-muted-foreground">
                  여기로 드래그
                </span>
              ) : null}
            </div>
            {over ? (
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center rounded-[10px] bg-canvas/60 text-[12px] font-semibold text-brand">
                여기에 놓기
              </span>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
