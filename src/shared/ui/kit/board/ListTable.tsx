// r4 로망 이식(`board/list/ListTable.tsx`): 판 안 평평한 목록(칸 머리 · 묶음 머리 · 줄 · 이름 칸 · 아래 한 줄 · 안내 한 줄).
// 부품은 글자 · 상태 · 누를 동작만 받는다. 어떤 칸을 그릴지 · 묶음을 어떻게 나눌지는 화면이 정한다.
// 색만 경찰 토큰: 선 `border-border`, 회색 글자 `text-muted-foreground`, 연분홍 → `bg-brand-bg`, 진분홍 글자 → `text-brand-3`,
// 분홍 초점 · 고른 줄 테 → `ring-brand`.
import type { ComponentPropsWithoutRef, ReactNode } from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../../part-attrs"
import { PANEL_FOCUS_RING } from "./board-classes"

interface PartIdProp {
  /** 위치 식별자(`data-part-id`) */
  partId?: string
}

export type ListHeadRowProps = ComponentPropsWithoutRef<"div"> & PartIdProp

/** 칸 머리 줄 — 높이 32 · 흰 바탕 · 10.5 보통 회색 · 아래 선 · 맨 위에 붙음(sticky). 칸 폭은 줄과 같은 폭 클래스를 쓰는 쪽이 맞춘다. */
export function ListHeadRow({ partId, className, children, ...props }: ListHeadRowProps) {
  return (
    <div
      aria-hidden="true"
      {...props}
      {...partAttrs("ListHeadRow", { id: partId })}
      data-slot="list-head"
      className={cn(
        "sticky top-0 z-10 flex h-8 shrink-0 items-center gap-x-2.5 border-b border-solid border-border bg-panel px-3.5 text-[10.5px] font-normal text-muted-foreground",
        className
      )}
    >
      {children}
    </div>
  )
}

export interface ListGroupHeadProps extends Omit<ComponentPropsWithoutRef<"div">, "title">, PartIdProp {
  /** 묶음 이름 앞 선 아이콘(14px) — 없으면 이름만 */
  icon?: ReactNode
  /** 묶음 이름 */
  title: ReactNode
  /** 오른쪽 흐린 수 */
  aside?: ReactNode
}

/** 묶음 머리 줄 — 옅은 brand 바탕 · brand-3 12 굵게 이름 · 오른쪽 흐린 11 수. */
export function ListGroupHead({ icon, title, aside, partId, className, ...props }: ListGroupHeadProps) {
  return (
    <div
      {...props}
      {...partAttrs("ListGroupHead", { id: partId })}
      data-slot="list-group-head"
      className={cn(
        "flex h-8 items-center gap-2 border-b border-solid border-border bg-brand-bg px-3.5 text-[12px] font-bold text-brand-3",
        className
      )}
    >
      {icon}
      {title}
      {aside !== undefined && <span className="ml-auto text-[11px] font-normal text-muted-foreground">{aside}</span>}
    </div>
  )
}

export interface ListRowProps extends ComponentPropsWithoutRef<"div">, PartIdProp {
  /** 고른 줄 — 옅은 brand 바탕 + brand 1.5px 안쪽 테 */
  selected?: boolean
  /** 판 안 목록 — 올리면 옅은 brand · Tab 으로 닿는 줄의 초점 테 */
  interactive?: boolean
}

/** 줄 하나 — 높이 30 · 아래 1px 선 · 12 글자. 칸은 children(폭 클래스를 단 span). */
export function ListRow({ selected = false, interactive = false, partId, className, children, ...props }: ListRowProps) {
  return (
    <div
      {...props}
      {...partAttrs("ListRow", { state: selected ? "selected" : undefined, id: partId })}
      data-slot="list-row"
      data-state={selected ? "selected" : "default"}
      className={cn(
        "flex h-[30px] cursor-pointer items-center gap-x-2.5 border-b border-solid border-border px-3.5 text-[12px] text-fg-2",
        className,
        selected && "bg-brand-bg ring-[1.5px] ring-inset ring-brand",
        interactive && cn("hover:bg-brand-bg/60", PANEL_FOCUS_RING)
      )}
    >
      {children}
    </div>
  )
}

export interface ListNameCellProps extends PartIdProp {
  /** 이름 — 비면 흐린 「이름 없음」 */
  name: string | null | undefined
  /** 칸 폭 */
  className?: string
  /** 시험이 찾는 이름 글자 표시 */
  nameTestId?: string
  /** 이름 뒤 작은 꼬리표 */
  children?: ReactNode
}

/** 이름 칸 — 옅은 brand 머리글자 동그라미 + 12.5 굵게 이름. 빈 이름은 빈 줄로 보이지 않게 사실만 적는다. */
export function ListNameCell({ name, className, nameTestId, partId, children }: ListNameCellProps) {
  const text = (name ?? "").trim()
  return (
    <span {...partAttrs("ListNameCell", { id: partId })} className={cn("flex shrink-0 items-center gap-2", className)}>
      <span
        aria-hidden="true"
        className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-bg text-[10.5px] font-bold text-brand-3"
      >
        {Array.from(text)[0] ?? ""}
      </span>
      {text !== "" ? (
        <span data-testid={nameTestId} className="truncate text-[12.5px] font-bold text-foreground">
          {name}
        </span>
      ) : (
        <span data-testid={nameTestId} className="truncate text-[12px] text-faint">
          이름 없음
        </span>
      )}
      {children}
    </span>
  )
}

export type ListFootProps = ComponentPropsWithoutRef<"div"> & PartIdProp

/** 표 아래 한 줄 — 위 1px 선 · 11 회색 글자. 오른쪽 끝 것은 `ml-auto` 로 민다. */
export function ListFoot({ partId, className, children, ...props }: ListFootProps) {
  return (
    <div
      {...props}
      {...partAttrs("ListFoot", { id: partId })}
      data-slot="list-foot"
      className={cn(
        "flex h-9 shrink-0 items-center gap-3 border-t border-solid border-border px-3.5 text-[11px] text-muted-foreground",
        className
      )}
    >
      {children}
    </div>
  )
}

export interface ListNoteProps extends ComponentPropsWithoutRef<"p">, PartIdProp {
  /** 「· 다시」 같은 뒤 글자 단추 — 주면 글자와 한 줄로 4px 띄워 놓는다 */
  action?: ReactNode
}

/** 빈 상태 · 확인 못 함 한 줄 — 표 자리 12 회색 글자(+ 뒤 「· 다시」). */
export function ListNote({ action, partId, className, children, ...props }: ListNoteProps) {
  return (
    <p
      {...props}
      {...partAttrs("ListNote", { id: partId })}
      data-slot="list-note"
      className={cn("m-0 px-4 py-6 text-[12px] text-muted-foreground", action !== undefined && "flex items-center gap-1", className)}
    >
      {action !== undefined ? <span>{children}</span> : children}
      {action !== undefined && (
        <>
          <span aria-hidden="true">·</span>
          {action}
        </>
      )}
    </p>
  )
}
