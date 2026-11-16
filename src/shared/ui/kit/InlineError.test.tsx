import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { InlineError } from "./InlineError"

describe("InlineError", () => {
  it("메시지와 시각이 보인다", () => {
    render(<InlineError message="확인 못 함" at="09:12" partId="S00-31" />)
    const el = screen.getByRole("status")
    expect(el).toHaveAttribute("data-part", "InlineError")
    expect(el).toHaveAttribute("data-part-id", "S00-31")
    expect(screen.getByText("확인 못 함")).toBeVisible()
    expect(screen.getByText("09:12")).toBeVisible()
  })

  it("onRetry 가 없으면 다시 버튼이 없다", () => {
    render(<InlineError message="확인 못 함" />)
    expect(screen.queryByRole("button", { name: "다시" })).toBeNull()
  })

  it("다시 버튼을 누르면 onRetry 를 부른다", () => {
    const onRetry = vi.fn()
    render(<InlineError message="확인 못 함" at="09:12" onRetry={onRetry} />)
    fireEvent.click(screen.getByRole("button", { name: "다시" }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
