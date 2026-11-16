import type { ReactNode } from "react"
import { DropdownMenu } from "radix-ui"

import { useThemePortalContainer } from "@/shared/lib/display-prefs"
import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../../part-attrs"

// r4 로망 이식(`shared/ui/panel/head/WorkWindowHead` · `HeadParts` HeadTag · HeadPill): 창 맨 위 어두운 띠.
// 첫 줄 = 머리글자 40 · 이름 17 굵게 · 꼬리표(11.5 굵게 · 흰 14%) … 오른쪽 `end` · ⋯ · ‹ › ×(알약 32 · 폭 30) / 둘째 줄 = info /
// 셋째 줄 now = 「⑥ 결재 › 결재 올리기 [지금 할 차례]」(로망 visual-spec 12-6 셋째 줄: 15 굵게 · 마지막 항목 연한 강조 · 위 1px 흰 22% 선).
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

/** 셋째 줄 — 지금 단계 › 첫 할 일 [꼬리표] */
export interface WindowHeadNow {
  /** 단계 번호(1 부터, 동그라미 안 글자) */
  num: number
  /** 단계 이름(「결재」) */
  stage: string
  /** › 뒤 지금 할 일(「결재 올리기」) — 연한 강조 */
  task?: string
  /** 흰 알약(「지금 할 차례」) */
  badge?: string
  /** 오른쪽 작은 글자 자리 */
  right?: ReactNode
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
  /** 셋째 줄(지금 단계) — 없으면 그리지 않음 */
  now?: WindowHeadNow
  /** ⋯ 메뉴 — 없거나 비면 단추를 그리지 않음 */
  menu?: readonly WindowHeadMenuItem[]
  /** ‹ › 앞 오른쪽 자리 */
  end?: ReactNode
  onPrev: () => void
  onNext: () => void
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
  now,
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
  return (
    <div
      {...partAttrs("WindowHead", { id: partId })}
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
          <button type="button" aria-label={prevLabel} disabled={prevOff} onClick={onPrev} className={PILL}>
            ‹
          </button>
          <button type="button" aria-label={nextLabel} disabled={nextOff} onClick={onNext} className={PILL}>
            ›
          </button>
          <button type="button" aria-label="창 닫기" title="닫기 · Esc" onClick={onClose} className={PILL}>
            ×
          </button>
        </span>
      </div>
      {info ? <div className="flex basis-full flex-wrap items-center gap-x-2.5 gap-y-1.5 pl-[50px]">{info}</div> : null}
      {now ? (
        <div
          data-slot="window-head-now"
          className="mt-0.5 flex basis-full flex-wrap items-center gap-x-2 gap-y-1 border-0 border-t border-solid border-paper/22 pt-[9px]"
        >
          <b className="flex items-center gap-2 whitespace-nowrap text-[15px] font-bold text-paper">
            <i
              aria-hidden="true"
              className="grid size-5 flex-none place-items-center rounded-full border-[1.5px] border-solid border-paper text-[11px] font-bold not-italic leading-none"
            >
              {now.num}
            </i>
            {now.stage}
            {now.task ? (
              <>
                <span aria-hidden="true" className="text-paper/50">
                  ›
                </span>
                <span className="text-brand-line">{now.task}</span>
              </>
            ) : null}
          </b>
          {now.badge ? (
            <span className="whitespace-nowrap rounded-full bg-panel px-[9px] py-0.5 text-[11.5px] font-bold text-[var(--t-emblem-to)]">
              {now.badge}
            </span>
          ) : null}
          {now.right ? <span className="ml-auto flex items-center gap-2 text-[12px] text-paper/62">{now.right}</span> : null}
        </div>
      ) : null}
    </div>
  )
}
