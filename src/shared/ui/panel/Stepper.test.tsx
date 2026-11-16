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

describe("Stepper — 안 좋은 입력", () => {
  it("current 가 NaN · Infinity 여도 터지지 않고 첫 칸이 지금", () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const { container, unmount } = render(<Stepper steps={STEPS} current={bad} />)
      expect(container.querySelectorAll("i")[0].dataset.step).toBe("now")
      unmount()
    }
  })
})

describe("Stepper variant=labeled (S02 제목 줄 단계)", () => {
  const SIX = ["접수", "1차 작업", "검색·판정", "교차 검증", "감정서", "결재"]

  it("단계 이름이 보이고 변형 표식이 붙는다", () => {
    const { container } = render(<Stepper variant="labeled" steps={SIX} current={1} />)
    expect(container.querySelector("[data-part=Stepper]")).toHaveAttribute("data-part-variant", "labeled")
    for (const s of SIX) expect(screen.getByText(s)).toBeInTheDocument()
  })

  it("지난 단계 done · 지금 now(aria-current=step) · 나머지 todo", () => {
    const { container } = render(<Stepper variant="labeled" steps={SIX} current={1} />)
    const st = Array.from(container.querySelectorAll("[data-step]")).map((e) => e.getAttribute("data-step"))
    expect(st).toEqual(["done", "now", "todo", "todo", "todo", "todo"])
    expect(container.querySelector("[aria-current=step]")).toHaveTextContent("1차 작업")
  })

  it("연결선은 단계 사이 5개, 지금 단계로 들어오는 선까지만 파랑(시안 i<=지금)", () => {
    const { container } = render(<Stepper variant="labeled" steps={SIX} current={1} />)
    const lines = Array.from(container.querySelectorAll("i[data-line]"))
    expect(lines).toHaveLength(5)
    expect(lines.map((l) => l.className.includes("bg-brand-2"))).toEqual([true, false, false, false, false])
  })

  it("기본(bar)은 변형 표식이 없다", () => {
    const { container } = render(<Stepper steps={SIX} current={1} />)
    expect(container.querySelector("[data-part=Stepper]")).not.toHaveAttribute("data-part-variant")
  })
})
