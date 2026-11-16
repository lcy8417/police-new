import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useAutoPlay } from "./use-auto-play"

type Opts = Parameters<typeof useAutoPlay>[0]

function setup(initial: Partial<Opts> = {}) {
  const onStep = vi.fn()
  const hook = renderHook((p: Partial<Opts>) => useAutoPlay({ count: 3, intervalMs: 1000, enabled: true, onStep, ...p }), {
    initialProps: initial,
  })
  return { onStep, ...hook }
}

describe("useAutoPlay", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("주기마다 다음 칸으로 가고 onStep 을 부른다", () => {
    const { result, onStep } = setup()
    expect(result.current.index).toBe(0)
    expect(result.current.playing).toBe(true)
    act(() => void vi.advanceTimersByTime(999))
    expect(result.current.index).toBe(0)
    act(() => void vi.advanceTimersByTime(1))
    expect(result.current.index).toBe(1)
    expect(onStep).toHaveBeenLastCalledWith(1)
  })

  it("마지막에서 멈추고(돌아가기 없음) 더는 걸지 않는다", () => {
    const { result, onStep } = setup()
    act(() => void vi.advanceTimersByTime(2000))
    expect(result.current.index).toBe(2)
    act(() => void vi.advanceTimersByTime(1000))
    expect(result.current.index).toBe(2)
    expect(result.current.playing).toBe(false)
    expect(result.current.remainingMs).toBe(0)
    expect(onStep).toHaveBeenCalledTimes(2)
    expect(vi.getTimerCount()).toBe(0)
  })

  it("loop 이면 처음으로 돌아간다", () => {
    const { result } = setup({ loop: true })
    act(() => void vi.advanceTimersByTime(3000))
    expect(result.current.index).toBe(0)
    expect(result.current.playing).toBe(true)
  })

  it("주기를 바꾸면 곧바로 새 주기로 다시 센다", () => {
    const { result, rerender } = setup()
    act(() => void vi.advanceTimersByTime(600))
    rerender({ intervalMs: 2000 })
    expect(result.current.remainingMs).toBe(2000)
    act(() => void vi.advanceTimersByTime(1900))
    expect(result.current.index).toBe(0)
    act(() => void vi.advanceTimersByTime(100))
    expect(result.current.index).toBe(1)
  })

  it("일시정지하면 멈추고 다시 시작하면 남은 시간부터 이어 간다", () => {
    const { result } = setup()
    act(() => void vi.advanceTimersByTime(400))
    act(() => result.current.pause())
    expect(result.current.playing).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
    act(() => void vi.advanceTimersByTime(5000))
    expect(result.current.index).toBe(0)
    act(() => result.current.play())
    expect(result.current.playing).toBe(true)
    act(() => void vi.advanceTimersByTime(599))
    expect(result.current.index).toBe(0)
    act(() => void vi.advanceTimersByTime(1))
    expect(result.current.index).toBe(1)
  })

  it("next · prev 는 범위 안에서 움직이고 주기를 다시 센다", () => {
    const { result, onStep } = setup()
    act(() => void vi.advanceTimersByTime(700))
    act(() => result.current.next())
    expect(result.current.index).toBe(1)
    expect(onStep).toHaveBeenLastCalledWith(1)
    expect(result.current.remainingMs).toBe(1000)
    act(() => result.current.prev())
    act(() => result.current.prev())
    expect(result.current.index).toBe(0)
    expect(onStep).toHaveBeenCalledTimes(2)
    act(() => result.current.next())
    act(() => result.current.next())
    act(() => result.current.next())
    expect(result.current.index).toBe(2)
  })

  it("remainingMs 가 시간에 따라 줄어든다", () => {
    const { result } = setup()
    expect(result.current.remainingMs).toBe(1000)
    act(() => void vi.advanceTimersByTime(300))
    expect(result.current.remainingMs).toBe(700)
  })

  it("enabled 가 꺼지면 타이머가 하나도 남지 않고 index 는 유지된다", () => {
    const { result, rerender } = setup()
    act(() => void vi.advanceTimersByTime(1000))
    expect(vi.getTimerCount()).toBe(1)
    rerender({ enabled: false })
    expect(vi.getTimerCount()).toBe(0)
    expect(result.current.playing).toBe(false)
    expect(result.current.index).toBe(1)
    rerender({ enabled: true })
    expect(result.current.playing).toBe(true)
  })

  it("꺼진 채로 시작하면 타이머를 걸지 않는다", () => {
    setup({ enabled: false })
    expect(vi.getTimerCount()).toBe(0)
  })

  it("언마운트하면 타이머가 하나도 남지 않는다", () => {
    const { unmount } = setup()
    expect(vi.getTimerCount()).toBe(1)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it("마지막에서 멈춘 뒤 play 하면 처음부터 다시 간다", () => {
    const { result, onStep } = setup()
    act(() => void vi.advanceTimersByTime(3000))
    act(() => result.current.play())
    expect(result.current.index).toBe(0)
    expect(onStep).toHaveBeenLastCalledWith(0)
    expect(result.current.playing).toBe(true)
  })

  it("count 가 줄어 index 가 넘치면 마지막 칸으로 맞추고 onStep 을 한 번 부른다", () => {
    const { result, rerender, onStep } = setup({ count: 5 })
    act(() => result.current.next())
    act(() => result.current.next())
    act(() => result.current.next())
    expect(result.current.index).toBe(3)
    onStep.mockClear()
    rerender({ count: 2 })
    expect(result.current.index).toBe(1)
    expect(onStep).toHaveBeenCalledTimes(1)
    expect(onStep).toHaveBeenCalledWith(1)
    // 맞춘 뒤에는 다시 부르지 않는다
    rerender({ count: 2 })
    expect(onStep).toHaveBeenCalledTimes(1)
  })

  it("틱이 늦어도 기한이 밀리지 않는다(450ms 주기로 10칸이 정확히 4500ms)", () => {
    const { result } = setup({ count: 12, intervalMs: 450 })
    act(() => void vi.advanceTimersByTime(4499))
    expect(result.current.index).toBe(9)
    act(() => void vi.advanceTimersByTime(1))
    expect(result.current.index).toBe(10)
  })

  it("count 가 주기보다 자주 바뀌어도 칸은 주기대로 넘어간다", () => {
    const { result, rerender } = setup({ count: 3 })
    act(() => void vi.advanceTimersByTime(400))
    rerender({ count: 4 })
    act(() => void vi.advanceTimersByTime(400))
    rerender({ count: 5 })
    act(() => void vi.advanceTimersByTime(199))
    expect(result.current.index).toBe(0)
    act(() => void vi.advanceTimersByTime(1))
    expect(result.current.index).toBe(1)
  })

  it("goTo 는 정한 칸으로 바로 옮기고 onStep 을 한 번만 부른다", () => {
    const { result, onStep } = setup({ count: 10 })
    act(() => result.current.goTo(7))
    expect(result.current.index).toBe(7)
    expect(onStep).toHaveBeenCalledTimes(1)
    expect(onStep).toHaveBeenCalledWith(7)
    // 같은 칸이면 부르지 않는다 · 범위 밖은 끝으로 맞춘다
    act(() => result.current.goTo(7))
    expect(onStep).toHaveBeenCalledTimes(1)
    act(() => result.current.goTo(99))
    expect(result.current.index).toBe(9)
    act(() => result.current.goTo(-3))
    expect(result.current.index).toBe(0)
    act(() => result.current.goTo(Number.NaN))
    expect(result.current.index).toBe(0)
    expect(onStep).toHaveBeenCalledTimes(3)
  })

  it("goTo 는 주기를 처음부터 다시 센다(같은 칸이어도)", () => {
    const { result } = setup({ count: 10 })
    act(() => void vi.advanceTimersByTime(700))
    act(() => result.current.goTo(4))
    expect(result.current.remainingMs).toBe(1000)
    act(() => void vi.advanceTimersByTime(999))
    expect(result.current.index).toBe(4)
    act(() => void vi.advanceTimersByTime(1))
    expect(result.current.index).toBe(5)
    act(() => void vi.advanceTimersByTime(600))
    act(() => result.current.goTo(5))
    act(() => void vi.advanceTimersByTime(999))
    expect(result.current.index).toBe(5)
    act(() => void vi.advanceTimersByTime(1))
    expect(result.current.index).toBe(6)
  })

  it("goTo 는 일시정지를 지킨다 — 칸만 옮기고, 다시 재생하면 그 칸에서 한 주기 뒤에 넘어간다", () => {
    const { result } = setup({ count: 5 })
    act(() => result.current.pause())
    act(() => result.current.goTo(4))
    expect(result.current.index).toBe(4)
    expect(result.current.playing).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
    // 멈춘 채 마지막 칸으로 옮긴 뒤 재생해도 처음으로 되돌아가지 않는다
    act(() => result.current.play())
    expect(result.current.index).toBe(4)
    expect(result.current.remainingMs).toBe(1000)
    act(() => void vi.advanceTimersByTime(1000))
    expect(result.current.index).toBe(4)
    expect(result.current.playing).toBe(false)
  })

  it("goTo 는 수동 모드(꺼짐)에서도 칸을 옮긴다", () => {
    const { result, onStep } = setup({ count: 5, enabled: false })
    act(() => result.current.goTo(2))
    expect(result.current.index).toBe(2)
    expect(onStep).toHaveBeenCalledWith(2)
    expect(vi.getTimerCount()).toBe(0)
  })

  it("멈춘 동안 주기를 줄이면 남은 시간도 새 주기까지로 줄어든다", () => {
    const { result, rerender } = setup({ intervalMs: 3000 })
    act(() => void vi.advanceTimersByTime(300))
    act(() => result.current.pause())
    rerender({ intervalMs: 1000 })
    act(() => result.current.play())
    expect(result.current.remainingMs).toBe(1000)
    act(() => void vi.advanceTimersByTime(1000))
    expect(result.current.index).toBe(1)
  })
})
