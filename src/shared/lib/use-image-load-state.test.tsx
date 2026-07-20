import { useRef } from "react"
import { describe, expect, it } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { useImageLoadState } from "./use-image-load-state"

/** 훅 상태를 DOM으로 노출하는 최소 프로브. */
function Probe({ src }: { src: string }) {
  const load = useImageLoadState(src)
  return (
    <img
      data-testid="img"
      data-status={load.status}
      src={src}
      alt="probe"
      {...load.handlers}
    />
  )
}

/**
 * 즉시 로드(data URL)를 흉내내는 프로브 — 렌더 도중(effect가 돌기 전) 이미 load가
 * 끝난 상황을 만든다. 이것이 실제 버그가 났던 조건이다: 정렬 폴리곤으로 크롭한
 * 족적은 data URL이라 onLoad가 effect보다 먼저 발생했고, effect가 "loaded"를
 * "loading"으로 덮어써 스피너가 영구히 남았다.
 */
function EagerProbe({ src }: { src: string }) {
  const load = useImageLoadState(src)
  // 실제 onLoad는 딱 한 번만 발생한다 — ref로 1회만 통지해야 진짜 조건이 재현된다.
  // (매 렌더 통지하면 effect가 덮어써도 다음 렌더에서 스스로 복구돼 버그를 놓친다.)
  const fired = useRef(false)
  if (!fired.current) {
    fired.current = true
    load.markLoaded()
  }
  return <span data-testid="eager" data-status={load.status} />
}

describe("useImageLoadState", () => {
  it("초기 상태는 loading이다", () => {
    render(<Probe src="/a.png" />)
    expect(screen.getByTestId("img")).toHaveAttribute("data-status", "loading")
  })

  it("onLoad가 오면 loaded가 된다", () => {
    render(<Probe src="/a.png" />)
    fireEvent.load(screen.getByTestId("img"))
    expect(screen.getByTestId("img")).toHaveAttribute("data-status", "loaded")
  })

  it("onError가 오면 error가 된다", () => {
    render(<Probe src="/a.png" />)
    fireEvent.error(screen.getByTestId("img"))
    expect(screen.getByTestId("img")).toHaveAttribute("data-status", "error")
  })

  it("src가 바뀌면 다시 loading으로 돌아간다", () => {
    const { rerender } = render(<Probe src="/a.png" />)
    fireEvent.load(screen.getByTestId("img"))
    expect(screen.getByTestId("img")).toHaveAttribute("data-status", "loaded")

    rerender(<Probe src="/b.png" />)
    expect(screen.getByTestId("img")).toHaveAttribute("data-status", "loading")
  })

  // 회귀 방지(핵심): effect로 리셋하면 여기서 loading에 갇힌다.
  it("effect보다 먼저 로드가 끝나도 loaded가 유지된다(즉시 로드 data URL 경합)", () => {
    render(<EagerProbe src="data:image/png;base64,AAAA" />)
    // 렌더+effect 플러시가 끝난 시점에도 loaded여야 한다.
    expect(screen.getByTestId("eager")).toHaveAttribute("data-status", "loaded")
  })

  it("같은 src로 재렌더돼도 loaded가 풀리지 않는다", () => {
    const { rerender } = render(<Probe src="/a.png" />)
    fireEvent.load(screen.getByTestId("img"))
    rerender(<Probe src="/a.png" />)
    rerender(<Probe src="/a.png" />)
    expect(screen.getByTestId("img")).toHaveAttribute("data-status", "loaded")
  })
})
