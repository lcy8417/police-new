import type { ReactNode } from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../../part-attrs"

// r4 로망 이식(`shared/ui/panel/head/WorkWindowHead` · `HeadParts` HeadTag · HeadPill): 창 맨 위 어두운 띠.
// 첫 줄 = 머리글자 40 · 이름 17 굵게 · 꼬리표(11.5 굵게 · 흰 14%) … 오른쪽 `end` · ‹ › ×(알약 32 · 폭 30) / 둘째 줄 = info.
// 로망의 ⋯ 메뉴 · 셋째 줄(「단계 [지금 할 차례]」)은 이번 범위 밖이라 뺐다.
// 색만 대응: 먹 2 `bg-ink-2` → `bg-[var(--t-emblem-to)]`, 흰 100 → paper, 흰 14 · 22% → paper/14 · paper/22,
// 진분홍 머리글자 → brand-3, 연분홍 이름 → paper. 어두운 띠 위 키보드 초점은 종이색 테(ScasShell 사이드바와 같음).

export interface WindowHeadProps {
  /** 머리글자 칸 글자(한 글자) */
  mark: string
  /** 이름(「00001-25-0649」) */
  title: ReactNode
  /** 이름 뒤 작은 글자(「주거침입」) */
  subtitle?: ReactNode
  /** 꼬리표 글자들(의뢰관서 · 등록일 · 장수 · 단계) */
  tags?: readonly string[]
  /** 둘째 줄 */
  info?: ReactNode
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

export function WindowHead({
  mark,
  title,
  subtitle,
  tags,
  info,
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
    </div>
  )
}
