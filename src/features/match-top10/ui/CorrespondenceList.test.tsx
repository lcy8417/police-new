import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import type { MatchCorrespondence } from "@/entities/match"
import { CorrespondenceList } from "./CorrespondenceList"

function makeMatch(i: number): MatchCorrespondence {
  return {
    fx: 100 + i * 10,
    fy: 200 + i * 10,
    sx: 50 + i * 5,
    sy: 60 + i * 5,
    score: 0.9 - i * 0.05,
    box: { cx: 100 + i * 10, cy: 200 + i * 10, size: 96 },
    box_image: `data:image/png;base64,SCENE${i}`,
  }
}

describe("CorrespondenceList — [CORRECTION 2] 여러 대응을 한 번에 비교하는 짝(pair) 리스트", () => {
  it("대응마다 한 행 — 족적(scene) 크롭과 신발(shoe) 크롭을 나란히 렌더한다", () => {
    const matches = [makeMatch(0), makeMatch(1), makeMatch(2)]
    render(
      <CorrespondenceList
        matches={matches}
        sceneCrops={matches.map((m) => m.box_image)}
        shoeCrops={["data:image/png;base64,SHOE0", "data:image/png;base64,SHOE1", undefined]}
        activeIndex={null}
        onSelect={() => {}}
        onHover={() => {}}
      />
    )

    // 3개 행 각각 족적 크롭(alt에 순위 포함) + 신발 크롭이 존재한다.
    for (let i = 1; i <= 3; i += 1) {
      expect(screen.getByAltText(`대응 ${i}번 족적 크롭`)).toBeInTheDocument()
    }
    expect(screen.getByAltText("대응 1번 신발 크롭")).toHaveAttribute(
      "src",
      "data:image/png;base64,SHOE0"
    )
    expect(screen.getByAltText("대응 2번 신발 크롭")).toHaveAttribute(
      "src",
      "data:image/png;base64,SHOE1"
    )
  })

  it("신발 크롭이 아직 준비되지 않으면(undefined) 그 행에 로딩/대체 표시를 보인다", () => {
    const matches = [makeMatch(0)]
    render(
      <CorrespondenceList
        matches={matches}
        sceneCrops={matches.map((m) => m.box_image)}
        shoeCrops={[undefined]}
        activeIndex={null}
        onSelect={() => {}}
        onHover={() => {}}
      />
    )
    expect(screen.queryByAltText("대응 1번 신발 크롭")).toBeNull()
    expect(screen.getByText(/생성 중|이미지 없음/)).toBeInTheDocument()
  })

  it("각 행에 순위(rank)와 백분율 score를 표시한다", () => {
    const matches = [makeMatch(0), makeMatch(1)]
    render(
      <CorrespondenceList
        matches={matches}
        sceneCrops={matches.map((m) => m.box_image)}
        shoeCrops={[undefined, undefined]}
        activeIndex={null}
        onSelect={() => {}}
        onHover={() => {}}
      />
    )
    expect(screen.getByText("90%")).toBeInTheDocument() // makeMatch(0).score = 0.9
    expect(screen.getByText("85%")).toBeInTheDocument() // makeMatch(1).score = 0.85
  })

  it("행을 클릭하면 onSelect(index)가 호출된다", () => {
    const matches = [makeMatch(0), makeMatch(1)]
    const onSelect = vi.fn()
    render(
      <CorrespondenceList
        matches={matches}
        sceneCrops={matches.map((m) => m.box_image)}
        shoeCrops={[undefined, undefined]}
        activeIndex={null}
        onSelect={onSelect}
        onHover={() => {}}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /대응 2번 행 선택/ }))
    expect(onSelect).toHaveBeenCalledWith(1)
  })

  it("행에 마우스를 올리면 onHover(index)가, 벗어나면 onHover(null)이 호출된다", () => {
    const matches = [makeMatch(0), makeMatch(1)]
    const onHover = vi.fn()
    render(
      <CorrespondenceList
        matches={matches}
        sceneCrops={matches.map((m) => m.box_image)}
        shoeCrops={[undefined, undefined]}
        activeIndex={null}
        onSelect={() => {}}
        onHover={onHover}
      />
    )
    const row = screen.getByRole("button", { name: /대응 1번 행 선택/ })
    fireEvent.mouseEnter(row)
    expect(onHover).toHaveBeenCalledWith(0)
    fireEvent.mouseLeave(row)
    expect(onHover).toHaveBeenCalledWith(null)
  })

  // 회귀 방지: 예전에는 족적 썸네일이 `match.box_image`(항상 RGB 크롭)에 하드코딩돼
  // 있어 좌측 큰 이미지의 RGB↔스케치·이진 토글을 따라가지 못했다. 이제 호출부가
  // 모드에 맞는 크롭을 `sceneCrops`로 넘기며, 이 컴포넌트는 그것만 그린다.
  it("족적 썸네일은 box_image가 아니라 sceneCrops(모드별 크롭)를 그린다", () => {
    const matches = [makeMatch(0)]
    render(
      <CorrespondenceList
        matches={matches}
        sceneCrops={["data:image/png;base64,OUTLINE0"]}
        shoeCrops={["data:image/png;base64,SHOE0"]}
        activeIndex={null}
        onSelect={() => {}}
        onHover={() => {}}
      />
    )
    expect(screen.getByAltText("대응 1번 족적 크롭")).toHaveAttribute(
      "src",
      "data:image/png;base64,OUTLINE0"
    )
  })

  it("족적 크롭이 아직 준비되지 않으면(undefined) 그 자리에 로딩 표시를 보인다", () => {
    const matches = [makeMatch(0)]
    render(
      <CorrespondenceList
        matches={matches}
        sceneCrops={[undefined]}
        shoeCrops={["data:image/png;base64,SHOE0"]}
        activeIndex={null}
        onSelect={() => {}}
        onHover={() => {}}
      />
    )
    expect(screen.queryByAltText("대응 1번 족적 크롭")).toBeNull()
    expect(screen.getByText("생성 중")).toBeInTheDocument()
  })

  it("activeIndex와 일치하는 행은 선택 상태(aria-pressed=true)로 강조된다", () => {
    const matches = [makeMatch(0), makeMatch(1)]
    render(
      <CorrespondenceList
        matches={matches}
        sceneCrops={matches.map((m) => m.box_image)}
        shoeCrops={[undefined, undefined]}
        activeIndex={1}
        onSelect={() => {}}
        onHover={() => {}}
      />
    )
    expect(screen.getByRole("button", { name: /대응 1번 행 선택/ })).toHaveAttribute(
      "aria-pressed",
      "false"
    )
    expect(screen.getByRole("button", { name: /대응 2번 행 선택/ })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
  })
})
