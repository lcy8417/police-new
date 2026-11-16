import { Fragment, type ReactNode } from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../../part-attrs"

import { StepNum } from "./StateBox"
import { NOW_BOX, NOW_RING, STATE_BOX, type PanelState } from "./state-tone"

// r4 로망 이식(`shared/ui/panel/stage/StageStrip.tsx` — StageStrip box 모양 · TaskBoxes 「↳」 상자 줄): 창 머리 아래 단계 띠와 「↳ 이 단계 할 일」 상자.
// 병렬 업무라 떨어진 네모 칸(모서리 9 · 높이 46 · 13 굵게 + 아래 10), 꼭 마지막 칸(final)만 › 뒤 · 최대 170. 할 일 상자 = 높이 36 · 모서리 8 · 11.5 굵게.
// 로망과 다른 점(경찰 정본 · 사용자 요청 11/16):
//   - 보고 있는 칸 깜빡(animate-progress-now) → 멈춘 2px 테(NOW_RING). 움직임은 AI 가 일하는 자리에만.
//   - 지금 칸(now)을 box 모양에도 받는다(로망은 sequence 모양만) — 채움 brand-3 + aria-current="step".
//   - 상태 표식은 `data-state`(shadcn 예약) 대신 `data-cell-state`.
// 단계 이름 · 상자 글자 · 상태 판정은 쓰는 쪽이 정해 넘긴다 — 이 부품은 글자 · 상태 · 누를 함수만 받는다.

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-brand"

// 칸 너비 = 글자만큼 + 남는 폭을 나눠 가짐(로망 시안 `.ld-s` flex 1 1 auto 실측)
const BOX = cn(
  "flex min-w-0 flex-auto cursor-pointer flex-col items-start justify-center gap-0.5 rounded-[9px] border-0 px-3 py-1.5 text-left transition-colors duration-150 motion-reduce:transition-none",
  FOCUS
)

/** 흰 꼬리표(로망 `.q8-bnm.on` · `.q8-osb` — 흰 바탕 · 위험 글자 · 알약) */
const BADGE = "flex-none whitespace-nowrap rounded-full bg-panel px-2 py-0.5 font-bold not-italic text-danger"

/** [UI] 단계 띠 칸 하나 */
export interface StageStripItem {
  /** 단계 번호(0 부터) — 동그라미 숫자는 key + 1 */
  key: number
  /** 칸 색 */
  state: PanelState
  label: string
  /** 칸 아래 작은 글자(「끝」 · 「1개 남음」) */
  note: string
  /** 꼭 마지막 칸 — 앞에 › · 최대 폭 170 */
  final?: boolean
  /** 지금 할 단계 — brand 채움 + aria-current="step". 상태(data-cell-state)는 그대로 둔다 */
  now?: boolean
  /** 작은 글자 끝 「!」 동그라미(이 단계에 확인할 문제가 있음) */
  dot?: boolean
  /** 이름 옆 흰 꼬리표(「! 사유」) */
  badge?: string
  /** 작은 글자를 노랑으로(필수 빈 칸) */
  noteTone?: "blank"
  /** 마우스를 올리면 보이는 까닭(title) */
  hint?: string
}

export interface StageStripProps {
  /** 띠 접근성 이름(「사건 진행 단계」) */
  label: string
  items: readonly StageStripItem[]
  /** 보고 있는 칸(테 2px) — 없으면 지금 칸(now) */
  current?: number
  onPick: (key: number) => void
  /** 위치 식별자(`data-part-id`) */
  partId?: string
}

/** 칸 아래 작은 글자 색 — 아직 밝은 70% · 끝 회색 · 필수 빔 노랑 */
const stripNote = (one: StageStripItem) =>
  one.noteTone === "blank" ? "text-warn-line" : one.state === "pending" && !one.now ? "text-paper/70" : one.state === "done" ? "text-muted-foreground" : ""

/** [UI] 단계 띠 — 칸을 누르면 onPick(key). 끝 ✓ 흐림 · 지금 채움 · 문제 위험 채움 · 아직 어두운 칸 */
export function StageStrip({ label, items, current, onPick, partId }: StageStripProps) {
  const viewing = current ?? items.find((i) => i.now)?.key
  return (
    <div
      {...partAttrs("StageStrip", { id: partId })}
      role="group"
      aria-label={label}
      data-slot="panel-stage-strip"
      className="flex items-stretch gap-1.5 overflow-x-auto px-5 pt-3.5 pb-3 [scrollbar-width:none]"
    >
      {items.map((one) => (
        <Fragment key={one.key}>
          {one.final ? (
            <em aria-hidden="true" className="self-center px-px text-[20px] font-bold not-italic leading-none text-faint">
              ›
            </em>
          ) : null}
          <button
            type="button"
            onClick={() => onPick(one.key)}
            title={one.hint}
            aria-current={one.now ? "step" : undefined}
            data-slot="panel-stage"
            data-cell-state={one.state}
            data-now={one.now || undefined}
            className={cn(
              BOX,
              "min-h-[46px]",
              one.final && "max-w-[170px]",
              one.now ? NOW_BOX : STATE_BOX[one.state],
              viewing === one.key && NOW_RING
            )}
          >
            <b className="flex items-center whitespace-nowrap text-[13px] font-bold">
              <StepNum state={one.state} n={one.key + 1} now={one.now} />
              <span className="ml-1.5">{one.label}</span>
              {one.badge ? <em data-slot="panel-stage-badge" className={cn(BADGE, "ml-1.5 text-[11px] leading-[14.3px]")}>{one.badge}</em> : null}
            </b>
            <small className={cn("flex items-center gap-[5px] whitespace-nowrap pl-[23px] text-[10px] font-normal leading-[15px]", stripNote(one))}>
              {one.note}
              {one.dot ? (
                <i
                  data-slot="panel-stage-dot"
                  aria-label="확인할 문제 있음"
                  className={cn(
                    "grid size-3.5 flex-none place-items-center rounded-full text-[10px] font-bold not-italic leading-none",
                    one.state === "problem" || one.now ? "bg-panel text-danger" : "bg-danger text-paper"
                  )}
                >
                  !
                </i>
              ) : null}
            </small>
          </button>
        </Fragment>
      ))}
    </div>
  )
}

/** [UI] 할 일 상자 하나 */
export interface TaskBoxItem {
  key: string
  state: PanelState
  label: string
  /** 상자 안 작은 글자(「지금」 · 「_4 ↔ _5」) */
  note: string
  /** 마우스를 올리면 보이는 까닭(title) */
  hint: string
  /** 보고 있는 항목 — 테 2px */
  current?: boolean
  /** 지금 할 상자 — brand 채움(상태는 그대로) */
  now?: boolean
  /** 글자 뒤 흰 꼬리표(「! 흐림」) */
  badge?: string
  /** 이름 앞 작은 표식(쓰는 쪽이 넣는다 — AI 출처 표시 등) */
  mark?: ReactNode
  /** 상자 뒤에 붙는 조각 */
  after?: ReactNode
}

export interface TaskBoxesProps {
  /** 줄 머리 글자 겸 접근성 이름(「이 단계 할 일」) */
  label: string
  items: readonly TaskBoxItem[]
  onPress: (key: string) => void
  /** 줄 오른쪽 끝 자리(저장 글자 등) */
  right?: ReactNode
  /** 위치 식별자(`data-part-id`) */
  partId?: string
}

/** [UI] 「↳ {label}」 할 일 상자 줄 — 상자를 누르면 onPress(key) */
export function TaskBoxes({ label, items, onPress, right, partId }: TaskBoxesProps) {
  return (
    <div {...partAttrs("TaskBoxes", { id: partId })} data-slot="panel-task-boxes" className="flex items-start gap-2 px-5 pb-3">
      <em className="mt-[9px] whitespace-nowrap text-[11px] not-italic text-faint">{`↳ ${label}`}</em>
      <div role="list" aria-label={label} className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {items.map((item, index) => (
          <span key={item.key} role="listitem" className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPress(item.key)}
              title={item.hint}
              data-slot="panel-task-box"
              data-cell-state={item.state}
              data-now={item.now || undefined}
              className={cn(
                "inline-flex h-9 cursor-pointer items-center gap-[5px] whitespace-nowrap rounded-[8px] border-0 px-3 text-[11.5px] font-bold transition-colors duration-150 motion-reduce:transition-none",
                FOCUS,
                item.now ? NOW_BOX : STATE_BOX[item.state],
                item.current && NOW_RING
              )}
            >
              <StepNum state={item.state} n={index + 1} size={16} now={item.now} />
              {item.mark}
              <span className="text-[12px]">{item.label}</span>
              <small
                className={cn(
                  "text-[10px] font-normal",
                  !item.now && (item.state === "pending" || item.state === "noSource") && "opacity-72",
                  item.state === "done" && "text-muted-foreground"
                )}
              >
                {item.note}
              </small>
              {item.badge ? <em data-slot="panel-task-badge" className={cn(BADGE, "text-[10.5px] leading-[15.75px]")}>{item.badge}</em> : null}
            </button>
            {item.after}
          </span>
        ))}
      </div>
      {right}
    </div>
  )
}
