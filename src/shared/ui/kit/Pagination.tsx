import * as React from "react"

import { partAttrs } from "../part-attrs"
import { cn } from "@/shared/lib/utils"
import { Button } from "./Button"
import { Field } from "./Field"

// SCAS 목록 아래 쪽수: 왼쪽 「‹ 이전 · 다음 ›」, 오른쪽 「전체 n 중 a-b」(시안 S01 `.num`).
// 전체 개수를 모르면(total 없음) 「a-b」만 보인다. 쪽 번호는 1부터.
// `jump`(11/17 신발 DB 패널 — 사용자 「우하단 검색으로 페이지 넘어갈 수 있고」): 왼쪽 범위 글자, 오른쪽
// 「« 처음 · ‹ 이전 · [쪽 번호] / 끝 쪽 · 이동 · 다음 › · 끝 »」. 쪽 번호는 Enter 또는 「이동」으로 가고, 범위 밖이면 처음 · 끝 쪽으로 맞춘다.
// 전체 개수를 모르면 끝 쪽을 몰라 기본 모양으로 그린다.
export interface PaginationProps {
  total?: number
  page: number
  pageSize: number
  hasNext: boolean
  onPageChange: (page: number) => void
  /** 쪽 번호를 넣어 바로 가기 + 처음 · 끝 단추(전체 개수를 알 때만) */
  jump?: boolean
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
  className?: string
}

/** 넣은 글자 → 갈 쪽(1 ~ lastPage). 숫자가 아니면 null */
function toPage(text: string, lastPage: number): number | null {
  const n = Number.parseInt(text.replace(/[^0-9]/g, ""), 10)
  if (!Number.isFinite(n)) return null
  return Math.min(Math.max(n, 1), lastPage)
}

export function Pagination({ total, page, pageSize, hasNext, onPageChange, jump = false, partId, className }: PaginationProps) {
  // 전체 개수가 있으면 마지막 쪽을 넘는 쪽 번호는 마지막 쪽으로 보인다
  const lastPage = total === undefined ? page : Math.max(1, Math.ceil(total / pageSize))
  const shown = Math.min(page, lastPage)
  const from = (shown - 1) * pageSize + 1
  const to = total === undefined ? shown * pageSize : Math.min(shown * pageSize, total)
  const range = `${from}-${to}`
  const label = total === undefined ? range : total === 0 ? "전체 0" : `전체 ${total} 중 ${range}`
  const canJump = jump && total !== undefined

  // 쪽 번호 칸에 치는 중인 글자(null = 지금 쪽). 쪽이 바뀌면 치던 글자는 버린다
  const [draft, setDraft] = React.useState<string | null>(null)
  const [draftFor, setDraftFor] = React.useState(shown)
  if (draftFor !== shown) {
    setDraftFor(shown)
    setDraft(null)
  }
  const go = () => {
    const target = draft === null ? null : toPage(draft, lastPage)
    setDraft(null)
    if (target !== null && target !== shown) onPageChange(target)
  }

  if (!canJump) {
    return (
      <div
        {...partAttrs("Pagination", { id: partId })}
        className={cn("flex items-center justify-between gap-[10px] px-[14px] py-[10px] text-[12px] text-muted-foreground", className)}
      >
        <span className="inline-flex items-center gap-[6px]">
          <Button size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            <span aria-hidden="true">‹</span>
            이전
          </Button>
          <Button size="sm" disabled={!hasNext} onClick={() => onPageChange(page + 1)}>
            다음
            <span aria-hidden="true">›</span>
          </Button>
        </span>
        <span className="font-code tabular-nums">{label}</span>
      </div>
    )
  }

  return (
    <div
      {...partAttrs("Pagination", { variant: "jump", id: partId })}
      className={cn("flex flex-wrap items-center justify-between gap-x-[10px] gap-y-[6px] px-[14px] py-[10px] text-[12px] text-muted-foreground", className)}
    >
      <span className="font-code tabular-nums">{label}</span>
      <nav aria-label="쪽 이동" className="inline-flex items-center gap-[6px]">
        <Button size="sm" disabled={shown <= 1} onClick={() => onPageChange(1)}>
          <span aria-hidden="true">«</span>
          처음
        </Button>
        <Button size="sm" disabled={shown <= 1} onClick={() => onPageChange(shown - 1)}>
          <span aria-hidden="true">‹</span>
          이전
        </Button>
        <Field
          variant="mono-sm"
          aria-label="쪽 번호"
          inputMode="numeric"
          autoComplete="off"
          value={draft ?? String(shown)}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              go()
            } else if (e.key === "Escape" && draft !== null) {
              // 치던 쪽 번호만 버린다(패널 · 창의 Esc 닫기로 올라가지 않게)
              e.stopPropagation()
              setDraft(null)
            }
          }}
          className="w-[64px] text-center"
        />
        <span className="font-code tabular-nums">/ {lastPage}쪽</span>
        <Button size="sm" onClick={go}>
          이동
        </Button>
        <Button size="sm" disabled={!hasNext || shown >= lastPage} onClick={() => onPageChange(shown + 1)}>
          다음
          <span aria-hidden="true">›</span>
        </Button>
        <Button size="sm" disabled={shown >= lastPage} onClick={() => onPageChange(lastPage)}>
          끝
          <span aria-hidden="true">»</span>
        </Button>
      </nav>
    </div>
  )
}
