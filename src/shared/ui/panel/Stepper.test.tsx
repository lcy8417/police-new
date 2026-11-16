import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Stepper } from "./Stepper"

const STEPS = ["접수", "분석", "검토", "결재"]

describe("Stepper", () => {
  it("칸 수만큼 그리고 지난 칸 done · 지금 칸 now · 나머지 todo", () => {
    const { container } = render(<Stepper steps={STEPS} current={2} />)
    expect(container.querySelector("[data-part=Stepper]")).toBeInTheDocument()
    const cells = Array.from(container.querySelectorAll("i")).map((i) => i.getAttribute("data-step"))
    expect(cells).toEqual(["done", "done", "now", "todo"])
  })

  it("읽는 이름에 지금 단계를 알린다(색만으로 구분하지 않음)", () => {
    render(<Stepper steps={STEPS} current={2} />)
    expect(screen.getByRole("img", { name: "진행 3/4 · 검토" })).toBeInTheDocument()
  })

  it("current 가 칸 수와 같으면 모두 끝남, 범위 밖은 잘라 쓴다", () => {
    const { container, rerender } = render(<Stepper steps={STEPS} current={4} />)
    expect(screen.getByRole("img", { name: "모든 단계 끝남" })).toBeInTheDocument()
    expect(Array.from(container.querySelectorAll("i")).every((i) => i.dataset.step === "done")).toBe(true)
    rerender(<Stepper steps={STEPS} current={-3} />)
    expect(container.querySelectorAll("i")[0].dataset.step).toBe("now")
  })

  it("칸 폭은 기본 20 · width=18 이면 18", () => {
    const { container, rerender } = render(<Stepper steps={STEPS} current={0} />)
    expect(container.querySelector("i")!.className).toContain("w-[20px]")
    rerender(<Stepper steps={STEPS} current={0} width={18} />)
    expect(container.querySelector("i")!.className).toContain("w-[18px]")
  })
})
