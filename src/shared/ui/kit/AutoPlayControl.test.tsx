import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { AutoPlayControl, type AutoPlayControlProps } from "./AutoPlayControl"

function setup(props: Partial<AutoPlayControlProps> = {}) {
  const fns = { onModeChange: vi.fn(), onIntervalChange: vi.fn(), onPlayPause: vi.fn() }
  const base: AutoPlayControlProps = {
    mode: "auto",
    intervalMs: 2000,
    playing: true,
    position: { index: 1, total: 10 },
    remainingRatio: 0.5,
    ...fns,
  }
  const utils = render(<AutoPlayControl {...base} {...props} />)
  return { ...fns, ...utils }
}

describe("AutoPlayControl", () => {
  it("수동 모드에서는 모드 전환과 위치만 보인다", () => {
    const { container } = setup({ mode: "manual", partId: "X-1" })
    expect(container.firstElementChild).toHaveAttribute("data-part", "AutoPlayControl")
    expect(screen.getByRole("button", { name: "수동" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText("2 / 10")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "재생" })).toBeNull()
    expect(screen.queryByRole("progressbar")).toBeNull()
    expect(screen.queryByRole("button", { name: "1초" })).toBeNull()
  })

  it("모드를 바꾼다", () => {
    const { onModeChange } = setup({ mode: "manual" })
    fireEvent.click(screen.getByRole("button", { name: "자동" }))
    expect(onModeChange).toHaveBeenCalledWith("auto")
  })

  it("빠른 고르기 1·2·3·5초, 현재 값이 눌림 상태", () => {
    const { onIntervalChange } = setup()
    expect(screen.getByRole("button", { name: "2초" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "1초" })).toHaveAttribute("aria-pressed", "false")
    fireEvent.click(screen.getByRole("button", { name: "5초" }))
    expect(onIntervalChange).toHaveBeenCalledWith(5000)
  })

  it("미세 조정은 0.5초 단위이고 0.5~10초 안에서만", () => {
    const { onIntervalChange, rerender, ...fns } = setup({ intervalMs: 1500 })
    expect(screen.getByLabelText("현재 간격")).toHaveTextContent("1.5초")
    fireEvent.click(screen.getByRole("button", { name: "간격 0.5초 늘리기" }))
    expect(onIntervalChange).toHaveBeenLastCalledWith(2000)
    fireEvent.click(screen.getByRole("button", { name: "간격 0.5초 줄이기" }))
    expect(onIntervalChange).toHaveBeenLastCalledWith(1000)
    const props = { mode: "auto", playing: true, position: { index: 0, total: 3 }, remainingRatio: 1, ...fns } as const
    rerender(<AutoPlayControl {...props} intervalMs={500} onIntervalChange={onIntervalChange} />)
    expect(screen.getByRole("button", { name: "간격 0.5초 줄이기" })).toBeDisabled()
    rerender(<AutoPlayControl {...props} intervalMs={10000} onIntervalChange={onIntervalChange} />)
    expect(screen.getByRole("button", { name: "간격 0.5초 늘리기" })).toBeDisabled()
  })

  it("재생 중이면 일시정지 버튼, 누르면 알린다", () => {
    const { onPlayPause } = setup({ playing: true })
    fireEvent.click(screen.getByRole("button", { name: "일시정지" }))
    expect(onPlayPause).toHaveBeenCalled()
  })

  it("멈춘 상태면 재생 버튼", () => {
    setup({ playing: false })
    expect(screen.getByRole("button", { name: "재생" })).toHaveAttribute("aria-pressed", "false")
  })

  it("남은 시간 막대는 비율만큼 차고 0~1 밖은 자른다", () => {
    const { rerender, ...fns } = setup({ remainingRatio: 0.25 })
    expect(screen.getByRole("progressbar", { name: "다음까지 남은 시간" })).toHaveAttribute("aria-valuenow", "25")
    rerender(
      <AutoPlayControl mode="auto" intervalMs={1000} playing position={{ index: 0, total: 1 }} remainingRatio={3} {...fns} />
    )
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100")
  })

  it("막대 채움은 움직임 줄이기에서 transition 이 꺼지도록 motion-safe 로만 건다", () => {
    setup()
    const fill = screen.getByRole("progressbar").querySelector("i")!
    expect(fill.className).not.toMatch(/(^|\s)transition/)
    expect(fill.className).toContain("motion-safe:transition-[width]")
    expect(fill.style.width).toBe("50%")
  })

  it("전체가 0이어도 위치가 깨지지 않는다", () => {
    setup({ position: { index: 0, total: 0 } })
    expect(screen.getByText("0 / 0")).toBeInTheDocument()
  })
})
