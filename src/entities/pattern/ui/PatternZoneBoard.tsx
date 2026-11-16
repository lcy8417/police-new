import * as React from "react"
import { Asterisk, Check, X } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { PatternIcon } from "@/shared/ui/viewer"

import type { PatternZone } from "../model/pattern"
import {
  PATTERN_DRAG_FORMAT,
  PATTERN_WEIGHT_LEVELS,
  PATTERN_ZONES,
  dropOrigin,
  type PatternInsertOrigin,
  type PatternCardView,
  type PatternWeightLevel,
  type PatternWeightView,
  type PatternZoneCards,
} from "../model/view"

/** AI 점수가 이보다 낮으면 주황 */
const LOW = 0.5

/** 카드 안 작은 단추(필수 · 확인 · 빼기) — 18 높이 */
const MINI =
  "inline-flex h-[18px] shrink-0 cursor-pointer items-center justify-center rounded-[5px] border border-solid px-[2px] text-[10px] font-semibold transition-colors duration-150 motion-reduce:transition-none disabled:cursor-default disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-brand"

export interface PatternZoneBoardProps {
  /** 부위별 문양 칸(부르는 쪽이 crime 튜플 · shoe 이름을 바꿔 넘긴다) */
  zones: PatternZoneCards
  /** 넣을 부위 */
  selectedZone: PatternZone
  onSelectZone: (zone: PatternZone) => void
  /** 끌어 온 문양(그림 경로)을 놓은 부위에 넣기 — 없으면 끌어 놓기 안 받음. origin = AI 추출 결과에서 왔나 */
  onDropToZone?: (zone: PatternZone, src: string, origin: PatternInsertOrigin) => void
  onRemove: (zone: PatternZone, index: number) => void
  /** 필수 켜고 끄기(crime 전용) — 주면 카드마다 필수 단추 · 우클릭 */
  onToggleMust?: (zone: PatternZone, index: number) => void
  /** AI 제안 확인 */
  onConfirm?: (zone: PatternZone, index: number) => void
  /** 개수 바꾸기(crime 전용) */
  onCount?: (zone: PatternZone, index: number, count: string) => void
  /** 개수 선택지(SCAS 0–9 · 10이상) */
  countOptions?: readonly string[]
  /** 가중치 바꾸기 — null 이면 규칙 값으로 되돌림 */
  onWeight?: (zone: PatternZone, index: number, level: PatternWeightLevel | null) => void
  canEdit: boolean
  /** 부위 줄 오른쪽 덧말(신발 부위별 AI 확신도 등) */
  zoneNote?: Partial<Record<PatternZone, React.ReactNode>>
  /** 윤곽 줄 머리에 「AI 미지원」 */
  outlineAiNote?: boolean
  /** 빈 부위 안내 */
  emptyText?: string
  /** 묶음 이름(기본 「현장 이미지 문양」) */
  label?: string
  className?: string
}

/**
 * 가중치 세그먼트(낮 · 보 · 높) — 문양 그림 오른쪽에 바로 누르는 세 칸(11/17 사용자 「가중치 설정하는거 문양 오른쪽이나 거기 좀 잘 보이게」).
 * 규칙 값 = 글자색 채움, 사람이 고른 값 = brand 채움. 고른 칸을 다시 누르면 규칙 값으로 되돌린다. 까닭은 마우스 설명.
 */
function WeightSegment({
  label,
  weight,
  disabled,
  onChange,
}: {
  label: string
  weight: PatternWeightView
  disabled: boolean
  onChange?: (level: PatternWeightLevel | null) => void
}) {
  const now = PATTERN_WEIGHT_LEVELS.find((w) => w.level === weight.level)?.label ?? ""
  const why = `가중치 ${now}${weight.why ? ` · ${weight.why}` : ""}`
  return (
    <span
      role="group"
      aria-label={`${label} 가중치 ${now}${weight.manual ? " 직접" : ""}`}
      title={why}
      className="inline-flex shrink-0 overflow-hidden rounded-[5px] border border-solid border-line-3"
    >
      {PATTERN_WEIGHT_LEVELS.map(({ level, short, label: name }) => {
        const on = weight.level === level
        return (
          <button
            key={level}
            type="button"
            aria-pressed={on}
            aria-label={`가중치 ${name}`}
            title={`가중치 ${name}${weight.why ? ` — ${weight.why}` : ""}`}
            disabled={disabled || !onChange}
            onClick={() => onChange?.(weight.manual && on ? null : level)}
            className={cn(
              "m-0 grid h-[18px] w-[19px] cursor-pointer place-items-center border-0 p-0 text-[11px] leading-none font-bold transition-colors duration-150 motion-reduce:transition-none disabled:cursor-default focus-visible:outline-1 focus-visible:outline-solid focus-visible:-outline-offset-1 focus-visible:outline-brand",
              on
                ? weight.manual
                  ? "bg-brand text-paper"
                  : "bg-fg-2 text-canvas"
                : "bg-transparent text-muted-foreground enabled:hover:bg-panel-3 enabled:hover:text-foreground"
            )}
          >
            {short}
          </button>
        )
      })}
      {/* 사람이 고른 값은 색만이 아니라 글자로도(1회차 검수 — 색으로만 규칙/직접을 가르던 것) */}
      {weight.manual ? (
        <span aria-hidden="true" title="직접 고른 가중치" className="grid place-items-center border-0 border-l border-solid border-line-3 px-[3px] text-[10px] leading-none font-semibold text-brand">
          직접
        </span>
      ) : null}
    </span>
  )
}

/**
 * 문양 카드(가로 · 컴팩트) — 그림 | AI 점수(크게) · 개수 · 빼기 / 가중치 세그먼트 · 필수(또는 제안 확인).
 * 코드 글자는 마우스 설명으로만, 확신도 막대는 없다(11/17 사용자 「문양 넘버 필요없고 … 게이지 이런거 다 버려 공간 낭비야」).
 * 필수 = 진한 테 + 좌상단 「필수」 표식.
 */
function PatternCard({
  zoneLabel,
  card,
  canEdit,
  countOptions,
  onRemove,
  onToggleMust,
  onConfirm,
  onCount,
  onWeight,
}: {
  zoneLabel: string
  card: PatternCardView
  canEdit: boolean
  countOptions?: readonly string[]
  onRemove: () => void
  onToggleMust?: () => void
  onConfirm?: () => void
  onCount?: (count: string) => void
  onWeight?: (level: PatternWeightLevel | null) => void
}) {
  const { name, src, status, must = false, score, doubtful, count, weight } = card
  const sug = status === "suggested"
  const mustOn = must && !sug
  const low = score !== undefined && score < LOW
  const label = `${zoneLabel} ${name}`
  const statusText = sug ? "AI 제안" : status === "ai" ? "AI · 확인" : "수동"
  const hasSecondRow = weight !== undefined || onToggleMust !== undefined || (sug && onConfirm !== undefined)
  return (
    <div
      data-card-status={status}
      data-must={mustOn ? "on" : undefined}
      className={cn(
        "relative grid grid-cols-[36px_auto] items-center gap-x-[6px] gap-y-[3px] rounded-[8px] px-[5px] py-[4px]",
        sug ? "border border-dashed border-ai-line bg-transparent" : "bg-panel-2",
        mustOn ? "border-2 border-solid border-danger" : !sug && "border border-solid border-line-3"
      )}
    >
      {mustOn ? (
        <span aria-hidden="true" className="pointer-events-none absolute top-0 left-0 z-[1] rounded-tl-[5px] rounded-br-[5px] bg-danger px-[3px] text-[10px] leading-[12px] font-bold text-paper">
          필수
        </span>
      ) : null}
      <button
        type="button"
        disabled={!canEdit}
        aria-label={`${label}${must ? " 필수" : ""}`}
        title={`${name} · ${statusText}${score !== undefined ? ` ${score.toFixed(2)}` : ""} — 누르면 빼기${onToggleMust ? " · 우클릭하면 필수 켜고 끄기" : ""}`}
        onClick={onRemove}
        onContextMenu={
          onToggleMust
            ? (e) => {
                e.preventDefault()
                // 보기 전용이면 우클릭으로도 필수를 못 바꾼다(1회차 검수 — 잠긴 단추도 우클릭은 들어옴).
                // 확인 전 AI 제안도 못 바꾼다 — 검색에 안 들어가는 카드에 표식 없는 숨은 필수가 켜지던 것(3회차 검수)
                if (canEdit && !sug) onToggleMust()
              }
            : undefined
        }
        className={cn("m-0 cursor-pointer border-0 bg-transparent p-0 disabled:cursor-default", hasSecondRow && "row-span-2", sug && "opacity-85")}
      >
        <PatternIcon name={name} src={src} ai={sug} title={name} />
      </button>
      <span className="flex min-w-0 items-center gap-[4px]">
        {score !== undefined && status !== "manual" ? (
          <b
            title={`AI 점수 ${score.toFixed(2)}${sug ? " · 확인 전 제안(검색에 안 들어감)" : " · 감정관 확인"}`}
            className={cn("min-w-[34px] font-code text-[16px] leading-none font-bold tabular-nums", low || doubtful ? "text-warn" : "text-ai")}
          >
            {score.toFixed(2)}
          </b>
        ) : (
          <span className={cn("min-w-[34px] text-[11px] font-semibold", status === "manual" ? "text-muted-foreground" : "font-code tracking-[0.08em] text-ai")}>
            {status === "manual" ? "수동" : "AI"}
          </span>
        )}
        {onCount && countOptions ? (
          <select
            aria-label={`${label} 개수`}
            title="SCAS 개수 — 이 부위에 이 문양이 몇 개 보이나(0–9 · 10이상)"
            value={count ?? "1"}
            disabled={!canEdit}
            onChange={(e) => onCount(e.target.value)}
            className="h-[16px] w-[24px] shrink-0 cursor-pointer appearance-none rounded-[4px] border-0 bg-transparent px-0 text-center font-code text-[10px] text-muted-foreground tabular-nums hover:bg-panel-3 hover:text-fg-2 disabled:cursor-default disabled:opacity-60"
          >
            {countOptions.map((c) => (
              <option key={c} value={c}>
                ×{c}
              </option>
            ))}
          </select>
        ) : null}
        <button
          type="button"
          aria-label={`${sug ? "제안 빼기" : "빼기"} · ${label}`}
          title="빼기"
          disabled={!canEdit}
          onClick={onRemove}
          className={cn(MINI, "ml-auto border-transparent bg-transparent px-[1px] text-muted-foreground hover:bg-panel-3 hover:text-foreground")}
        >
          <X aria-hidden="true" className="size-[11px]" strokeWidth={2.2} />
        </button>
      </span>
      {hasSecondRow ? (
        <span className="flex min-w-0 items-center gap-[4px]">
          {weight ? <WeightSegment label={label} weight={weight} disabled={!canEdit} onChange={onWeight} /> : null}
          {sug && onConfirm ? (
            <button
              type="button"
              aria-label={`제안 확인 · ${label}`}
              title="제안 확인 — 확인해야 검색에 들어갑니다"
              disabled={!canEdit}
              onClick={onConfirm}
              className={cn(MINI, "w-[20px] border-ai-line bg-ai-bg text-ai hover:border-ai")}
            >
              <Check aria-hidden="true" className="size-[11px]" strokeWidth={2.6} />
            </button>
          ) : onToggleMust && !sug ? (
            <button
              type="button"
              aria-pressed={must}
              aria-label={`필수 · ${label}`}
              title={must ? "필수 끄기" : "필수 — 이 문양이 없는 신발은 결과에서 뺍니다"}
              disabled={!canEdit}
              onClick={onToggleMust}
              className={cn(MINI, "w-[20px]", must ? "border-danger bg-danger text-paper" : "border-line-3 bg-transparent text-muted-foreground hover:text-foreground")}
            >
              <Asterisk aria-hidden="true" className="size-[11px]" strokeWidth={2.6} />
            </button>
          ) : null}
        </span>
      ) : null}
    </div>
  )
}

/**
 * 4부위 문양 행(상 · 중 · 하 · 윤곽) — 문양 코드 탭과 신발 편집이 같이 쓰는 표시 부품.
 * 부위 머리 = 넣을 부위 고르기, 그림 = 빼기, (crime) 우클릭 = 필수, 행마다 끌어 놓기 대상. 고른 부위 = 옅은 brand 판 + 1px 테.
 * crime(필수 · 가중치 · 개수 · AI 점수) · shoe(이름만)는 콜백 · 값 유무로 켜고 끈다.
 */
export function PatternZoneBoard({
  zones,
  selectedZone,
  onSelectZone,
  onDropToZone,
  onRemove,
  onToggleMust,
  onConfirm,
  onCount,
  countOptions,
  onWeight,
  canEdit,
  zoneNote,
  outlineAiNote = false,
  emptyText = "여기로 드래그",
  label = "현장 이미지 문양",
  className,
}: PatternZoneBoardProps) {
  const [dragOver, setDragOver] = React.useState<PatternZone | null>(null)
  const drops = canEdit && onDropToZone !== undefined
  return (
    <div role="group" aria-label={label} className={cn("flex flex-col gap-[6px]", className)}>
      {PATTERN_ZONES.map(({ zone, label: zoneLabel }) => {
        const items = zones[zone]
        const on = zone === selectedZone
        const over = dragOver === zone
        return (
          <div
            key={zone}
            data-drop-zone={zone}
            onDragOver={
              drops
                ? (e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = "copy"
                    if (!over) setDragOver(zone)
                  }
                : undefined
            }
            onDragLeave={drops ? () => setDragOver((z) => (z === zone ? null : z)) : undefined}
            onDrop={
              drops
                ? (e) => {
                    e.preventDefault()
                    setDragOver(null)
                    const src = e.dataTransfer.getData(PATTERN_DRAG_FORMAT)
                    if (src) onDropToZone?.(zone, src, dropOrigin(e.dataTransfer))
                  }
                : undefined
            }
            className={cn(
              "relative grid grid-cols-[46px_minmax(0,1fr)_auto] items-start gap-[8px] rounded-[10px] border border-solid px-[8px] py-[7px] transition-colors duration-150 motion-reduce:transition-none @max-[860px]:grid-cols-[38px_minmax(0,1fr)_auto] @max-[860px]:gap-[6px] @max-[860px]:px-[6px]",
              on ? "border-brand-line bg-brand-bg/50" : "border-line-2 bg-panel/40",
              over && "border-brand bg-brand-bg"
            )}
          >
            <button
              type="button"
              aria-pressed={on}
              aria-label={`${zoneLabel} 부위 ${items.length}개${on ? " 입력 중" : ""}`}
              onClick={() => onSelectZone(zone)}
              className="m-0 grid cursor-pointer justify-items-start gap-[3px] border-0 bg-transparent p-0 pt-[3px] text-left text-foreground focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-brand"
            >
              <b className={cn("text-[13px] leading-none", on && "text-brand")}>{zoneLabel}</b>
              <span className={cn("text-[10px] leading-[1.3]", on ? "font-semibold text-brand" : "text-muted-foreground")}>{on ? "입력 중" : `${items.length}개`}</span>
              {outlineAiNote && zone === "outline" ? <span className="text-[10px] leading-[1.3] text-muted-foreground">AI 미지원</span> : null}
            </button>
            <div className="flex min-w-0 flex-wrap items-center gap-[6px]">
              {items.map((card, index) => (
                <PatternCard
                  key={`${card.name}-${index}`}
                  zoneLabel={zoneLabel}
                  card={card}
                  canEdit={canEdit}
                  countOptions={countOptions}
                  onRemove={() => onRemove(zone, index)}
                  onToggleMust={onToggleMust ? () => onToggleMust(zone, index) : undefined}
                  onConfirm={onConfirm ? () => onConfirm(zone, index) : undefined}
                  onCount={onCount ? (c) => onCount(zone, index, c) : undefined}
                  onWeight={onWeight ? (lv) => onWeight(zone, index, lv) : undefined}
                />
              ))}
              {items.length === 0 ? (
                // 빈 부위만 자리 표시 — 문양이 있는 행은 행 전체가 놓는 자리(끌면 「여기에 놓기」)
                <span className="inline-grid h-[44px] min-w-[132px] place-items-center rounded-[9px] border border-dashed border-line-3 px-[10px] text-[11px] text-muted-foreground">
                  {emptyText}
                </span>
              ) : null}
            </div>
            <span className="pt-[3px]">{zoneNote?.[zone] ?? null}</span>
            {over ? (
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center rounded-[10px] bg-canvas/60 text-[12.5px] font-semibold text-brand">
                여기에 놓기
              </span>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
