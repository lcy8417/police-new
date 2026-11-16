import * as React from "react"

import type { PatternZone } from "@/entities/pattern"
import { cn } from "@/shared/lib/utils"
import { ConfidenceBar } from "@/shared/ui/ai"
import { Button, Chip } from "@/shared/ui/kit"
import { PatternIcon } from "@/shared/ui/viewer"

import { DRAG_FORMAT, PATTERN_COUNTS, patternName, ZONE_ROWS } from "../model/constants"
import type { CrimeZones, PatternCardMeta, PatternCount, PatternMetaMap } from "../model/types"

/** AI 확신도가 이보다 낮으면 주황(시안 cf < 0.5) */
const LOW = 0.5

export interface ZoneRowsProps {
  zones: CrimeZones
  selectedZone: PatternZone
  onSelectZone: (zone: PatternZone) => void
  /** 끌어 온 문양을 놓은 부위에 넣기 */
  onDropToZone: (zone: PatternZone, src: string) => void
  onRemovePattern: (zone: PatternZone, index: number) => void
  onToggleEssential: (zone: PatternZone, index: number) => void
  canEdit: boolean
  /** 시안 r2 문양 카드(AI 제안 · 확신도 · 개수)로 그릴까 */
  plus: boolean
  meta?: PatternMetaMap
  onConfirmSuggestion?: (zone: PatternZone, index: number) => void
  onCountChange?: (zone: PatternZone, index: number, count: PatternCount) => void
}

/** 시안 `.ai-mark`(청록 mono 10px · 자간 .12em) */
const AI_MARK = "font-code text-[10px] font-semibold tracking-[0.12em]"

const CARD_TONE: Record<PatternCardMeta["status"], string> = {
  suggested: "border-dashed border-ai bg-ai-bg/35 opacity-[0.92]",
  ai: "border-solid border-ai-line bg-panel-2",
  manual: "border-solid border-brand-line bg-panel-2",
}

/** 시안 r2 문양 카드(92px) — 그림(누르면 빼기 · 우클릭 필수) · 상태 표시 · 확신도 · 개수 · 필수/제안 확인 */
function PatternCard({
  zoneLabel,
  name,
  path,
  must,
  meta,
  canEdit,
  onRemove,
  onToggle,
  onConfirm,
  onCount,
}: {
  zoneLabel: string
  name: string
  path: string
  must: boolean
  meta: PatternCardMeta
  canEdit: boolean
  onRemove: () => void
  onToggle: () => void
  onConfirm?: () => void
  onCount?: (count: PatternCount) => void
}) {
  const sug = meta.status === "suggested"
  const low = meta.confidence !== undefined && meta.confidence < LOW
  return (
    <div
      data-plus=""
      data-card-status={meta.status}
      className={cn("grid w-[92px] justify-items-center gap-[4px] rounded-[9px] border px-[4px] pt-[7px] pb-[6px]", CARD_TONE[meta.status])}
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
        className="cursor-pointer border-0 bg-transparent p-0 disabled:cursor-not-allowed"
      >
        <PatternIcon name={name} src={path} selected={meta.status === "manual"} ai={meta.status !== "manual"} />
      </button>
      {sug ? (
        <span className={cn(AI_MARK, meta.doubtful ? "text-warn" : "text-ai")}>{meta.doubtful ? "AI 제안?" : "AI 제안"}</span>
      ) : meta.status === "ai" ? (
        <span className={cn(AI_MARK, "text-ai")}>AI · 확인</span>
      ) : (
        <span className="font-code text-[10px] font-semibold text-brand">수동</span>
      )}
      {meta.confidence !== undefined ? (
        <ConfidenceBar
          value={meta.confidence}
          scale="unit"
          threshold={LOW}
          label="AI 확신도"
          partId={low ? "S04-34" : undefined}
          className="w-[80px]"
        />
      ) : null}
      {onCount ? (
        <select
          aria-label={`${zoneLabel} ${name} 개수`}
          value={meta.count ?? "1"}
          disabled={!canEdit}
          onChange={(e) => onCount(e.target.value as PatternCount)}
          className="h-[20px] rounded-[6px] border border-solid border-border bg-strip px-[6px] font-code text-[11px] text-fg-2 tabular-nums disabled:opacity-60"
        >
          {PATTERN_COUNTS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      ) : null}
      {sug ? (
        <span className="flex gap-[3px]">
          <Button
            size="sm"
            variant="ok"
            // 이름은 「제안 확인 · 상 n21_05」 — 그림 버튼(「상 n21_05」)과 앞부분이 겹치지 않게
            aria-label={`제안 확인 · ${zoneLabel} ${name}`}
            disabled={!canEdit || !onConfirm}
            onClick={onConfirm}
            className="h-[20px] px-[7px]"
          >
            ✓ 확인
          </Button>
          <Button size="sm" aria-label={`제안 빼기 · ${zoneLabel} ${name}`} disabled={!canEdit} onClick={onRemove} className="h-[20px] px-[6px]">
            ✕
          </Button>
        </span>
      ) : (
        <Chip
          variant="h19"
          className={cn("px-[7px] text-[10.5px]", must ? "border-danger-line bg-danger-bg text-danger-fg" : "text-dim")}
        >
          {must ? "● 필수" : "필수"}
        </Chip>
      )}
    </div>
  )
}

/**
 * 상 · 중 · 하 · 윤곽 4부위 행(SCAS 「현장 이미지 문양」). 지금 앱 `PatternZones`와 같은 조작:
 * 부위 머리 클릭 = 넣을 부위 고르기, 문양 클릭 = 빼기, 우클릭 = 필수 켜고 끄기, 행마다 끌어 놓기 대상.
 * 신규 켜기(plus)면 문양마다 시안 r2 카드(AI 제안 · 확신도 · 개수)로 그린다.
 */
export function ZoneRows({
  zones,
  selectedZone,
  onSelectZone,
  onDropToZone,
  onRemovePattern,
  onToggleEssential,
  canEdit,
  plus,
  meta,
  onConfirmSuggestion,
  onCountChange,
}: ZoneRowsProps) {
  // 끌고 있는 문양이 올라와 있는 부위 — 「여기에 놓기」 표시 전용(저장되지 않는 화면 안 상태)
  const [dragOver, setDragOver] = React.useState<PatternZone | null>(null)

  return (
    <div role="group" aria-label="현장 이미지 문양" className="flex flex-col gap-[4px]">
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
                    // preventDefault 가 있어야 drop 이 생긴다
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
              "relative grid grid-cols-[64px_minmax(0,1fr)] items-center gap-[10px] rounded-[10px] px-[10px] py-[8px]",
              on ? "bg-danger-bg/40 [box-shadow:inset_0_0_0_2px_var(--t-danger)]" : "border-b border-solid border-line-2",
              over && "bg-brand-bg [box-shadow:inset_0_0_0_2px_var(--t-brand)]",
            )}
          >
            <button
              type="button"
              aria-pressed={on}
              aria-label={`${label} 부위 ${items.length}개${on ? " 입력 중" : ""}`}
              onClick={() => onSelectZone(zone)}
              className="grid cursor-pointer justify-items-start gap-[2px] border-0 bg-transparent p-0 text-left text-foreground"
            >
              <b className="text-[15px]">{label}</b>
              <span className="text-[10.5px] leading-[1.3] text-dim">{on ? "입력 중" : `${items.length}개`}</span>
            </button>
            <div className="flex min-w-0 flex-wrap items-center gap-[8px]">
              {items.map(([path, essential], index) => {
                const name = patternName(path)
                const must = Boolean(essential)
                const cardMeta = plus ? (meta?.[zone]?.[name] ?? { status: "manual" as const }) : null
                if (cardMeta) {
                  return (
                    <PatternCard
                      key={`${name}-${index}`}
                      zoneLabel={label}
                      name={name}
                      path={path}
                      must={must}
                      meta={cardMeta}
                      canEdit={canEdit}
                      onRemove={() => onRemovePattern(zone, index)}
                      onToggle={() => onToggleEssential(zone, index)}
                      onConfirm={onConfirmSuggestion ? () => onConfirmSuggestion(zone, index) : undefined}
                      onCount={onCountChange ? (c) => onCountChange(zone, index, c) : undefined}
                    />
                  )
                }
                return (
                  <button
                    key={`${name}-${index}`}
                    type="button"
                    disabled={!canEdit}
                    aria-label={`${label} ${name}${must ? " 필수" : ""}`}
                    title="누르면 빼기 · 우클릭하면 필수 켜고 끄기"
                    onClick={() => onRemovePattern(zone, index)}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      onToggleEssential(zone, index)
                    }}
                    className={cn(
                      "cursor-pointer rounded-[8px] border border-solid bg-panel-2 p-[6px] disabled:cursor-not-allowed",
                      must ? "border-danger-line" : "border-line-3",
                    )}
                  >
                    <PatternIcon name={name} src={path} essential={must} />
                  </button>
                )
              })}
              {zone === "outline" ? (
                plus ? (
                  // 시안: 윤곽은 AI 미지원 칸(150 × 110)
                  <span
                    data-plus=""
                    className="inline-grid h-[110px] w-[150px] place-items-center content-center gap-[4px] rounded-[9px] border border-dashed border-line-3 text-center text-[11px] leading-[1.5] text-muted-foreground"
                  >
                    <Chip variant="h19" className="text-[10.5px]">
                      AI 미지원
                    </Chip>
                    <span>
                      윤곽은 감정관이
                      <br />
                      직접 넣습니다
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-[6px] text-[11px] text-muted-foreground">
                    <Chip variant="h19">AI 미지원</Chip>
                    윤곽은 감정관이 직접 넣습니다
                  </span>
                )
              ) : null}
              {items.length === 0 ? (
                <span className="inline-grid h-[50px] min-w-[92px] place-items-center rounded-[9px] border border-dashed border-line-3 px-[8px] text-[11px] text-faint">
                  여기로 드래그
                </span>
              ) : plus && zone !== "outline" ? (
                // 시안: 문양 뒤 「＋ 끌어 놓기」 빈 칸
                <span
                  data-plus=""
                  className="inline-grid h-[110px] w-[92px] place-items-center content-center rounded-[9px] border border-dashed border-line-3 text-center text-[11px] text-faint"
                >
                  <span aria-hidden="true">＋</span>
                  끌어 놓기
                </span>
              ) : null}
            </div>
            {over ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 grid place-items-center rounded-[10px] bg-canvas/60 text-[12px] font-semibold text-brand"
              >
                여기에 놓기
              </span>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
