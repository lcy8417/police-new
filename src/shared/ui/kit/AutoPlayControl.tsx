import { Pause, Play } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"
import { Segmented } from "./Segmented"

// 자동 모드 조작 줄: 수동/자동 · 빠른 고르기(1·2·3·5초) · 0.5초 단위 미세 조정(0.5~10초) · 재생/일시정지 · 「n / 전체」 · 남은 시간 막대.
// 스페이스 키 처리는 화면 몫(이 부품은 버튼만). 막대는 움직임 줄이기에서 변화 없이 정지 폭만 보인다.
// 족적 앱이 아니어도 뜻이 통하는 조작이라 kit 에 둔다(AI 가 하는 일을 보여 주는 부품이 아님 — SKILL.md 출입구 질문).
export const AUTO_PLAY_MIN_MS = 500
export const AUTO_PLAY_MAX_MS = 10000
export const AUTO_PLAY_STEP_MS = 500
const QUICK_MS = [1000, 2000, 3000, 5000] as const

export interface AutoPlayControlProps {
  mode: "manual" | "auto"
  onModeChange: (mode: "manual" | "auto") => void
  intervalMs: number
  onIntervalChange: (ms: number) => void
  playing: boolean
  onPlayPause: () => void
  position: { index: number; total: number }
  /** 남은 시간 비율 0~1 */
  remainingRatio: number
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
  className?: string
}

/** 초 단위 글자(1000 → 「1초」, 1500 → 「1.5초」) */
export function formatSeconds(ms: number): string {
  return `${Number((ms / 1000).toFixed(1))}초`
}

const BTN =
  "inline-flex h-[24px] min-w-[24px] cursor-pointer items-center justify-center rounded-[6px] border border-solid border-line-3 bg-panel-2 px-[6px] text-[11.5px] text-fg-2 disabled:cursor-not-allowed disabled:opacity-50"

export function AutoPlayControl({
  mode,
  onModeChange,
  intervalMs,
  onIntervalChange,
  playing,
  onPlayPause,
  position,
  remainingRatio,
  partId,
  className,
}: AutoPlayControlProps) {
  const auto = mode === "auto"
  const clamp = (ms: number) => Math.min(AUTO_PLAY_MAX_MS, Math.max(AUTO_PLAY_MIN_MS, ms))
  const ratio = Number.isFinite(remainingRatio) ? Math.min(1, Math.max(0, remainingRatio)) : 0
  const shown = Math.min(position.total, position.index + 1)

  return (
    <div
      {...partAttrs("AutoPlayControl", { variant: mode, state: auto && playing ? "playing" : undefined, id: partId })}
      className={cn("flex flex-wrap items-center gap-x-[10px] gap-y-[6px]", className)}
    >
      <Segmented
        aria-label="이동 방식"
        items={[
          { value: "manual", label: "수동" },
          { value: "auto", label: "자동" },
        ]}
        value={mode}
        onValueChange={(v) => onModeChange(v === "auto" ? "auto" : "manual")}
      />
      {auto ? (
        <>
          <div role="group" aria-label="넘기는 간격" className="inline-flex items-center gap-[4px]">
            {QUICK_MS.map((ms) => (
              <button
                key={ms}
                type="button"
                aria-pressed={intervalMs === ms}
                onClick={() => onIntervalChange(ms)}
                className={cn(BTN, intervalMs === ms && "border-brand-line bg-brand-bg text-foreground")}
              >
                {formatSeconds(ms)}
              </button>
            ))}
            <span className="ml-[4px] inline-flex items-center gap-[2px]" role="group" aria-label="간격 미세 조정">
              <button
                type="button"
                aria-label="간격 0.5초 줄이기"
                disabled={intervalMs <= AUTO_PLAY_MIN_MS}
                onClick={() => onIntervalChange(clamp(intervalMs - AUTO_PLAY_STEP_MS))}
                className={BTN}
              >
                −
              </button>
              <output aria-label="현재 간격" className="min-w-[38px] text-center font-code text-[11.5px] tabular-nums text-fg-2">
                {formatSeconds(intervalMs)}
              </output>
              <button
                type="button"
                aria-label="간격 0.5초 늘리기"
                disabled={intervalMs >= AUTO_PLAY_MAX_MS}
                onClick={() => onIntervalChange(clamp(intervalMs + AUTO_PLAY_STEP_MS))}
                className={BTN}
              >
                +
              </button>
            </span>
          </div>
          <button
            type="button"
            aria-label={playing ? "일시정지" : "재생"}
            aria-pressed={playing}
            onClick={onPlayPause}
            className={cn(BTN, "gap-[4px] px-[8px]")}
          >
            {playing ? <Pause aria-hidden="true" className="size-[12px]" /> : <Play aria-hidden="true" className="size-[12px]" />}
            {playing ? "일시정지" : "재생"}
          </button>
        </>
      ) : null}
      <span className="font-code text-[11.5px] tabular-nums text-muted-foreground">
        {shown} / {position.total}
      </span>
      {auto ? (
        <div
          role="progressbar"
          aria-label="다음까지 남은 시간"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(ratio * 100)}
          className="relative h-[4px] w-[96px] overflow-hidden rounded-[3px] bg-border"
        >
          <i
            aria-hidden="true"
            className="absolute inset-y-0 left-0 rounded-[3px] bg-brand motion-safe:transition-[width] motion-safe:duration-100 motion-safe:ease-linear"
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
      ) : null}
    </div>
  )
}
