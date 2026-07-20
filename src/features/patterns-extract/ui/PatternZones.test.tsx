import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

import type { Crime } from "@/entities/crime"
import { PatternZones } from "./PatternZones"

const BASE_CRIME: Crime = {
  crimeNumber: "2024-100",
  image: "data:image/png;base64,AAAA",
  top: [],
  mid: [],
  bottom: [],
  outline: [],
}

function makeDataTransfer(payload: string) {
  return {
    getData: () => payload,
    dropEffect: "",
  } as unknown as DataTransfer
}

/**
 * AC-SCENE-005/017(v0.2.0): 상/중/하/윤곽 4개 존 전부가 활성 드롭 타깃이어야
 * 한다 — v0.1.0의 "윤곽 존 숨김/예약" 결정은 D3에서 번복되었다.
 */
describe("PatternZones — 4개 존 드롭 타깃 (AC-SCENE-005/017)", () => {
  it("상/중/하/윤곽 4개 존 라벨이 모두 렌더된다", () => {
    render(
      <PatternZones
        selected={null}
        setSelected={vi.fn()}
        deletePattern={vi.fn()}
        essentialCheck={vi.fn()}
        currentData={BASE_CRIME}
      />
    )

    expect(screen.getByText("상")).toBeInTheDocument()
    expect(screen.getByText("중")).toBeInTheDocument()
    expect(screen.getByText("하")).toBeInTheDocument()
    expect(screen.getByText("윤곽")).toBeInTheDocument()
  })

  it.each([
    ["상", "top"],
    ["중", "mid"],
    ["하", "bottom"],
    ["윤곽", "outline"],
  ] as const)(
    "%s 존에 드롭하면 onDropToZone이 kind=%s로 호출된다",
    (label, kind) => {
      const onDropToZone = vi.fn()
      render(
        <PatternZones
          selected={null}
          setSelected={vi.fn()}
          deletePattern={vi.fn()}
          essentialCheck={vi.fn()}
          currentData={BASE_CRIME}
          onDropToZone={onDropToZone}
        />
      )

      const zoneHeader = screen.getByText(label)
      // 드롭 타깃은 헤더 버튼의 부모 컨테이너(onDrop 핸들러가 달린 div)다.
      const zoneContainer = zoneHeader.closest("button")!.parentElement!

      const src = "/src/assets/Patterns/전체/s21b.png"
      const event = new Event("drop", { bubbles: true, cancelable: true })
      Object.defineProperty(event, "dataTransfer", {
        value: makeDataTransfer(src),
      })
      zoneContainer.dispatchEvent(event)

      expect(onDropToZone).toHaveBeenCalledWith(kind, src)
    }
  )

  it("윤곽 존에 이미 배치된 문양이 렌더된다 (REQ-SCENE-018 복원 확인)", () => {
    const crimeWithOutline: Crime = {
      ...BASE_CRIME,
      outline: [["/src/assets/Patterns/전체/s41d.png", 0]],
    }
    render(
      <PatternZones
        selected={null}
        setSelected={vi.fn()}
        deletePattern={vi.fn()}
        essentialCheck={vi.fn()}
        currentData={crimeWithOutline}
      />
    )

    expect(screen.getByAltText("윤곽 문양 1")).toBeInTheDocument()
  })
})
