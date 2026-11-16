import type { ReactNode } from "react"
import { DropdownMenu } from "radix-ui"

import { useThemePortalContainer } from "@/shared/lib/display-prefs"
import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../../part-attrs"

// r4 로망 이식(`shared/ui/panel/head/WorkWindowHead` · `HeadParts` HeadTag · HeadPill): 창 맨 위 어두운 띠.
// 첫 줄 = 머리글자 40 · 이름 17 굵게 · 꼬리표(11.5 굵게 · 흰 14%) … 오른쪽 `end` · ⋯ · ‹ › ×(알약 32 · 폭 30) / 둘째 줄 = info /
// 셋째 줄 flow = 「✓ 접수 › [② 1차 작업] › ③ 검색·판정 …」 — 흐름이 이렇다는 것만 알리는 한 줄(위 1px 흰 22% 선 · 지금 칸만 흰 알약).
// 11/16 사용자 「이 단계에서 할 일은 없애고 … 그냥 플로우가 이렇다 이정도만」: 로망 단계 띠 · 할 일 상자 대신 이 줄 하나.
// ⋯ 메뉴 = 로망 머리 ⋯ 단추(HeadPill · 흰 70% 글자) + 떠 있는 메뉴(흰 · 모서리 10 · 줄 높이 32). 메뉴는 radix DropdownMenu(이 앱 radix-ui) — Esc · 화살표 키는 radix 몫.
// 색만 대응: 먹 2 `bg-ink-2` → `bg-[var(--t-emblem-to)]`, 흰 100 → paper, 흰 14 · 22% → paper/14 · paper/22,
// 진분홍 머리글자 → brand-3, 연분홍 이름 · 마지막 항목 → paper · brand-line. 어두운 띠 위 키보드 초점은 종이색 테(ScasShell 사이드바와 같음).

/** ⋯ 메뉴 한 줄 */
export interface WindowHeadMenuItem {
  label: string
  onSelect: () => void
  /** 되돌리기 어려운 일(위험 글자) */
  danger?: boolean
}

/** 셋째 줄 흐름 한 칸 — 끝(✓ 흐림) · 지금(흰 알약) · 아직(흐림) */
export interface WindowHeadFlowStep {
  label: string
  state: "done" | "now" | "todo"
}

export interface WindowHeadProps {
  /** 머리글자 칸 글자(한 글자) */
  mark: string
  /** 이름(「00001-25-0649」) */
  title: ReactNode
  /** 이름 뒤 작은 글자(「주거침입」) */
  subtitle?: ReactNode
  /** 꼬리표 글자들(의뢰관서 · 등록일 · 장수) */
  tags?: readonly string[]
  /** 둘째 줄 */
  info?: ReactNode
  /** 셋째 줄 흐름(「① 접수 › ② 1차 작업 › …」, 지금 칸만 흰 알약) — 알려 주기만 하고 누르지 않는다. 없으면 그리지 않음 */
  flow?: readonly WindowHeadFlowStep[]
  /** 흐름 줄 화면 읽기 이름 */
  flowLabel?: string
  /** ⋯ 메뉴 — 없거나 비면 단추를 그리지 않음 */
  menu?: readonly WindowHeadMenuItem[]
  /** ‹ › 앞 오른쪽 자리 */
  end?: ReactNode
  /** ‹ › — 둘 다 안 주면 ‹ › 를 그리지 않는다(변형 `noNav` — 앞뒤가 없는 패널, 예 신발 DB) */
  onPrev?: () => void
  onNext?: () => void
  /** 앞이 없음 — 잠김 */
  prevOff?: boolean
  nextOff?: boolean
  /** ‹ › 화면 읽기 이름(기본 「앞 사건」 · 「다음 사건」) */
  prevLabel?: string
  nextLabel?: string
  onClose: () => void
  /** 위치 식별자(`data-part-id`) */
  partId?: string
}

const DARK_FOCUS =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-paper"
const TAG =
  "whitespace-nowrap rounded-[7px] bg-paper/14 px-1.5 py-px text-[11.5px] font-bold leading-[17px] text-paper"
const PILL = cn(
  "m-0 grid h-8 w-[30px] cursor-pointer place-items-center rounded-[9px] border border-solid border-transparent bg-paper/14 p-0 text-[15px] font-bold leading-none text-paper transition-colors duration-150 hover:bg-paper/22 motion-reduce:transition-none",
  "disabled:cursor-default disabled:opacity-40 disabled:hover:bg-paper/14",
  DARK_FOCUS
)
const MENU_ITEM =
  "flex h-8 w-full cursor-pointer items-center rounded-[8px] px-2.5 text-left text-[12.5px] text-fg-2 outline-none data-[highlighted]:bg-brand-bg"

export function WindowHead({
  mark,
  title,
  subtitle,
  tags,
  info,
  flow,
  flowLabel = "진행 흐름",
  menu,
  end,
  onPrev,
  onNext,
  prevOff = false,
  nextOff = false,
  prevLabel = "앞 사건",
  nextLabel = "다음 사건",
  onClose,
  partId,
}: WindowHeadProps) {
  // 시안 화면 범위 안이면 범위의 포털 자리로(팔레트 · 글꼴을 받는다). 범위 밖은 null = body
  const portal = useThemePortalContainer()
  const nav = onPrev !== undefined || onNext !== undefined
  return (
    <div
      {...partAttrs("WindowHead", { variant: nav ? undefined : "noNav", id: partId })}
      data-slot="window-head"
      className="flex shrink-0 flex-wrap items-center gap-x-2.5 gap-y-2 bg-[var(--t-emblem-to)] px-3.5 pt-2.5 pb-3 text-[13px] text-paper"
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-2">
        <span
          aria-hidden="true"
          className="grid size-10 flex-none place-items-center rounded-[10px] bg-brand-3 text-[15px] font-bold text-paper"
        >
          {mark}
        </span>
        <span className="flex min-w-0 items-baseline gap-2">
          <b className="truncate font-code text-[17px] font-bold leading-[25px] text-paper">{title}</b>
          {subtitle ? <span className="truncate text-[14px] font-bold text-paper/70">{subtitle}</span> : null}
        </span>
        {tags?.map((t) => (
          <span key={t} data-slot="window-head-tag" className={TAG}>
            {t}
          </span>
        ))}
      </div>
      <div className="flex h-10 shrink-0 items-center gap-2.5 self-start">
        {end}
        {menu && menu.length > 0 ? (
          <DropdownMenu.Root modal={false}>
            <DropdownMenu.Trigger asChild>
              <button type="button" aria-label="이 창 메뉴" className={cn(PILL, "w-auto px-3 text-paper/70")}>
                ⋯
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal container={portal}>
              <DropdownMenu.Content
                align="end"
                sideOffset={6}
                data-slot="window-head-menu"
                className="z-50 w-[200px] rounded-[10px] border border-solid border-border bg-panel p-1.5 [box-shadow:0_8px_30px_0_var(--t-panel-drop)]"
              >
                {menu.map((item) => (
                  <DropdownMenu.Item
                    key={item.label}
                    onSelect={item.onSelect}
                    className={cn(MENU_ITEM, item.danger && "text-danger")}
                  >
                    {item.label}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        ) : null}
        <span className="ml-0.5 flex gap-1">
          {nav ? (
            <>
              <button type="button" aria-label={prevLabel} disabled={prevOff} onClick={onPrev} className={PILL}>
                ‹
              </button>
              <button type="button" aria-label={nextLabel} disabled={nextOff} onClick={onNext} className={PILL}>
                ›
              </button>
            </>
          ) : null}
          <button type="button" aria-label="창 닫기" title="닫기 · Esc" onClick={onClose} className={PILL}>
            ×
          </button>
        </span>
      </div>
      {info ? <div className="flex basis-full flex-wrap items-center gap-x-2.5 gap-y-1.5 pl-[50px]">{info}</div> : null}
      {flow && flow.length > 0 ? (
        <ol
          aria-label={flowLabel}
          data-slot="window-head-flow"
          className="m-0 mt-0.5 flex basis-full list-none flex-wrap items-center gap-x-1.5 gap-y-1 border-0 border-t border-solid border-paper/22 p-0 pt-2 text-[12.5px]"
        >
          {flow.map((s, i) => (
            <li
              key={s.label}
              data-flow-state={s.state}
              aria-current={s.state === "now" ? "step" : undefined}
              className="flex items-center gap-1.5 whitespace-nowrap"
            >
              {i > 0 ? (
                <span aria-hidden="true" className="text-paper/35">
                  ›
                </span>
              ) : null}
              <span
                className={cn(
                  "inline-flex h-6 items-center gap-1.5 rounded-full px-2",
                  s.state === "now" ? "bg-panel font-bold text-[var(--t-emblem-to)]" : s.state === "done" ? "text-paper/60" : "text-paper/45"
                )}
              >
                <i
                  aria-hidden="true"
                  className={cn(
                    "grid size-4 flex-none place-items-center rounded-full border border-solid text-[10px] font-bold not-italic leading-none",
                    s.state === "now" ? "border-[var(--t-emblem-to)]" : "border-current"
                  )}
                >
                  {s.state === "done" ? "✓" : i + 1}
                </i>
                {s.label}
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  )
}
