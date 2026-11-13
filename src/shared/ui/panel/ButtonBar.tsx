import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"

// 시안 `.panel-h .r` 의 부품판: 버튼들을 가로로 묶어 오른쪽 끝에 놓는다(gap 6 · 세로 가운데 · 왼쪽 자동 여백).
// 순서는 받은 그대로 그린다. SCAS 의 버튼 순서(초기화 · 엑셀 · 조회 · 등록 …) 고정은 쓰는 쪽 책임이다.
// 변형 이름은 시안 S01 · S02 의 `data-part-variant` 값 그대로다.
export type ButtonBarVariant = "panel-head" | "modal-head"

// border-none: preflight 가 span 에 붙이는 border-style: solid 를 시안(none)대로 되돌린다
const BASE = "ml-auto flex items-center gap-[6px] border-none"

const VARIANT_CLASS: Record<ButtonBarVariant, string> = {
  // 패널 머리 오른쪽(S01-16): 시안 인라인 padding-left 14 = 주석 핀(M.apin) 자리(판정 R40).
  // 대조가 요구해 남겨 두지만 새 변형에 복사하지 말 것 — 시안을 고칠 때 핀을 옮기고 이 값 제거.
  "panel-head": "pl-[14px]",
  // 모달 머리 오른쪽(S02-23): 덧붙는 값 없음
  "modal-head": "",
}

export interface ButtonBarProps extends React.ComponentProps<"span"> {
  variant?: ButtonBarVariant
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
}

export function ButtonBar({ variant = "panel-head", partId, className, ...props }: ButtonBarProps) {
  return (
    <span
      role="group"
      {...partAttrs("ButtonBar", { variant, id: partId })}
      className={cn(BASE, VARIANT_CLASS[variant], className)}
      {...props}
    />
  )
}
