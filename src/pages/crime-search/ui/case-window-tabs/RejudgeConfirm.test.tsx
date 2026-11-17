import { describe, expect, it } from "vitest"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"

import { REJUDGE_MESSAGE, useRejudgeConfirm, type RejudgeConfirm } from "./RejudgeConfirm"

let handle: RejudgeConfirm | null = null

function Probe({ judged }: { judged: boolean }) {
  const confirm = useRejudgeConfirm(judged)
  handle = confirm
  return <>{confirm.dialog}</>
}

describe("useRejudgeConfirm — 판정 확정 장 저장 전 「다시 판정 상태가 됩니다」", () => {
  it("확정 판정이 없으면 묻지 않고 바로 진행", async () => {
    render(<Probe judged={false} />)
    await expect(handle!.confirm()).resolves.toBe(true)
    expect(screen.queryByText(REJUDGE_MESSAGE)).toBeNull()
  })

  it("확정 판정이면 확인 창 — 취소는 false, 계속은 true 이고 그 뒤로는 다시 묻지 않는다", async () => {
    render(<Probe judged />)
    let answer: Promise<boolean> | null = null
    act(() => {
      answer = handle!.confirm()
    })
    expect(await screen.findByText(REJUDGE_MESSAGE)).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "취소" }))
    await expect(answer!).resolves.toBe(false)

    act(() => {
      answer = handle!.confirm()
    })
    fireEvent.click(await screen.findByRole("button", { name: "계속" }))
    await expect(answer!).resolves.toBe(true)
    await waitFor(() => expect(screen.queryByText(REJUDGE_MESSAGE)).toBeNull())

    await expect(handle!.confirm()).resolves.toBe(true)
    expect(screen.queryByText(REJUDGE_MESSAGE)).toBeNull()
  })
})
