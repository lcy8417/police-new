import * as React from "react"

import { Button, DialogShell } from "@/shared/ui/kit"
import { ButtonBar } from "@/shared/ui/panel"

/** 확인 창 문구 — 서버는 판정이 확정된 장의 문양 · 편집을 저장하면 그 판정을 「다시 판정」으로 내린다(설계서 §3-6 · supersede) */
export const REJUDGE_MESSAGE = "판정이 확정된 이미지입니다. 저장하면 다시 판정 상태가 됩니다(결과 확인 탭에서 다시 판정)."

export interface RejudgeConfirm {
  /** 저장 전에 부른다 — 확정 판정이 없거나 이미 「계속」을 눌렀으면 바로 true, 아니면 확인 창을 띄워 답을 기다린다 */
  confirm: () => Promise<boolean>
  /** 탭 본문 끝에 그린다 */
  dialog: React.ReactNode
}

/**
 * 「다시 판정 상태가 됩니다」 확인(문양 코드 · 이미지 편집 탭). 판정 상태는 A2 `images[].aprthng_sttus`(CONFIRMED)로 안다.
 * 한 번 「계속」하면 그 탭이 열려 있는 동안 다시 묻지 않는다(첫 저장 뒤 서버가 판정을 내리므로).
 * 생김새는 기존 확인 창 부품(kit `DialogShell` + panel `ButtonBar` · kit `Button`) 그대로.
 */
export function useRejudgeConfirm(judged: boolean): RejudgeConfirm {
  const [open, setOpen] = React.useState(false)
  const accepted = React.useRef(false)
  const pending = React.useRef<((ok: boolean) => void) | null>(null)

  const settle = React.useCallback((ok: boolean) => {
    if (ok) accepted.current = true
    setOpen(false)
    const resolve = pending.current
    pending.current = null
    resolve?.(ok)
  }, [])

  const confirm = React.useCallback(() => {
    if (!judged || accepted.current) return Promise.resolve(true)
    // 이미 묻는 중이면 앞 질문을 취소로 닫고 새로 묻는다
    pending.current?.(false)
    return new Promise<boolean>((resolve) => {
      pending.current = resolve
      setOpen(true)
    })
  }, [judged])

  // 탭이 닫히면 기다리던 저장은 취소로
  React.useEffect(() => () => pending.current?.(false), [])

  const dialog = (
    <DialogShell
      open={open}
      onOpenChange={(next) => {
        if (!next) settle(false)
      }}
      title="다시 판정 확인"
      actions={
        <ButtonBar variant="modal-head">
          <Button size="sm" onClick={() => settle(false)}>
            취소
          </Button>
          <Button size="sm" variant="pri" onClick={() => settle(true)}>
            계속
          </Button>
        </ButtonBar>
      }
    >
      <p className="m-0 p-[16px] text-[12.5px] leading-[1.5] text-fg-2">{REJUDGE_MESSAGE}</p>
    </DialogShell>
  )

  return { confirm, dialog }
}
