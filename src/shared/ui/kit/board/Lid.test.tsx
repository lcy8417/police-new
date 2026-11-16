import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { BoardLid } from "./BoardLid"
import { LidActiveFilterChip } from "./LidActiveFilterChip"
import { LidChip } from "./LidChip"
import { LidChipGroup } from "./LidChipGroup"
import { LidFilterLabel } from "./LidFilterLabel"
import { LidResetLink } from "./LidResetLink"
import { LidSearch } from "./LidSearch"
import { LidSeparator } from "./LidSeparator"
import { LidViewTab, LidViewTabs } from "./LidViewTabs"

describe("BoardLid", () => {
  it("진한 띠(bg-brand-3) · 종이색 글자, 부품 표식과 위치 식별자", () => {
    const { container } = render(<BoardLid partId="S01-86">x</BoardLid>)
    const lid = container.firstElementChild as HTMLElement
    expect(lid).toHaveAttribute("data-part", "BoardLid")
    expect(lid).toHaveAttribute("data-part-id", "S01-86")
    expect(lid.className).toContain("bg-brand-3")
    expect(lid.className).toContain("text-paper")
  })

  it("scroll 이면 아이들을 옆으로 미는 칸에 넣고 aside 는 밖에 둔다", () => {
    const { container } = render(
      <BoardLid scroll aside={<span>옆</span>}>
        <span>안</span>
      </BoardLid>,
    )
    const scroller = container.querySelector('[data-slot="board-lid-scroll"]')!
    expect(scroller).toHaveTextContent("안")
    expect(scroller).not.toHaveTextContent("옆")
  })
})

describe("LidChip", () => {
  it("누르면 onClick, 켜짐은 aria-pressed=true · 종이색 바탕", () => {
    const onClick = vi.fn()
    const { rerender } = render(<LidChip onClick={onClick}>등록됨</LidChip>)
    const chip = screen.getByRole("button", { name: "등록됨" })
    expect(chip).toHaveAttribute("aria-pressed", "false")
    fireEvent.click(chip)
    expect(onClick).toHaveBeenCalledTimes(1)
    rerender(<LidChip active onClick={onClick}>등록됨</LidChip>)
    expect(chip).toHaveAttribute("aria-pressed", "true")
    expect(chip).toHaveAttribute("data-state", "on")
    expect(chip.className).toContain("bg-paper")
  })

  it("0건은 흐리지만(opacity-40) 누를 수 있다", () => {
    const onClick = vi.fn()
    render(
      <LidChip zero count={0} onClick={onClick}>
        교차 검증
      </LidChip>,
    )
    const chip = screen.getByRole("button", { name: /교차 검증/ })
    expect(chip.className).toContain("opacity-40")
    expect(chip).toHaveAttribute("data-zero", "true")
    fireEvent.click(chip)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("수를 칩 안 굵은 글자로 보인다", () => {
    render(<LidChip count={14}>결과 확인 전</LidChip>)
    expect(screen.getByRole("button", { name: "결과 확인 전 14" })).toBeInTheDocument()
  })

  it("pending 은 「준비 중」 · aria-disabled, 누르면 onClick 대신 onBlocked", () => {
    const onClick = vi.fn()
    const onBlocked = vi.fn()
    render(
      <LidChip pending onClick={onClick} onBlocked={onBlocked}>
        끝
      </LidChip>,
    )
    const chip = screen.getByRole("button", { name: /끝/ })
    expect(chip).toHaveAttribute("aria-disabled", "true")
    expect(chip).toHaveTextContent("준비 중")
    fireEvent.click(chip)
    expect(onClick).not.toHaveBeenCalled()
    expect(onBlocked).toHaveBeenCalledTimes(1)
  })

  it("누르는 동안 1px 내려앉는다", () => {
    render(<LidChip>a</LidChip>)
    expect(screen.getByRole("button").className).toContain("enabled:active:[transform:translateY(1px)]")
  })
})

describe("LidChipGroup · LidSeparator · LidFilterLabel", () => {
  it("묶음은 이름 있는 group, 칸막이는 읽지 않는다, 이름표 기본 글자는 「필터」", () => {
    const { container } = render(
      <>
        <LidFilterLabel />
        <LidChipGroup aria-label="진행 상태">
          <LidChip>등록됨</LidChip>
        </LidChipGroup>
        <LidSeparator />
      </>,
    )
    expect(screen.getByRole("group", { name: "진행 상태" })).toBeInTheDocument()
    expect(container.querySelector('[data-part="LidSeparator"]')).toHaveAttribute("aria-hidden", "true")
    expect(screen.getByText("필터")).toBeInTheDocument()
  })
})

describe("LidResetLink · LidActiveFilterChip", () => {
  it("리셋 링크는 기본 글자 「✕ 필터 풀기」, 누르면 onClick", () => {
    const onClick = vi.fn()
    render(<LidResetLink onClick={onClick} />)
    fireEvent.click(screen.getByRole("button", { name: "✕ 필터 풀기" }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("켜진 조건 칩은 ✕ 동그라미를 읽지 않는다", () => {
    render(<LidActiveFilterChip aria-label="7일 넘음 풀기">7일 넘음</LidActiveFilterChip>)
    const chip = screen.getByRole("button", { name: "7일 넘음 풀기" })
    expect(chip).toHaveAttribute("data-state", "on")
    expect(chip.querySelector('[aria-hidden="true"]')).toHaveTextContent("✕")
  })
})

describe("LidSearch", () => {
  it("값이 없으면 지우기 단추가 없고, 있으면 누를 때 onClear 후 칸으로 초점", () => {
    const onClear = vi.fn()
    const { rerender } = render(<LidSearch inputProps={{ value: "", onChange: () => {}, "aria-label": "검색어" }} onClear={onClear} />)
    expect(screen.queryByRole("button", { name: "찾기 지우기" })).toBeNull()
    rerender(<LidSearch inputProps={{ value: "0646", onChange: () => {}, "aria-label": "검색어" }} onClear={onClear} />)
    fireEvent.click(screen.getByRole("button", { name: "찾기 지우기" }))
    expect(onClear).toHaveBeenCalledTimes(1)
    expect(screen.getByLabelText("검색어")).toHaveFocus()
  })

  it("빈 곳을 눌러도 입력 칸으로 초점이 간다", () => {
    const { container } = render(<LidSearch inputProps={{ "aria-label": "검색어" }} />)
    fireEvent.click(container.querySelector('[data-part="LidSearch"]')!)
    expect(screen.getByLabelText("검색어")).toHaveFocus()
  })
})

describe("LidViewTabs", () => {
  it("켜진 탭만 aria-pressed=true, menu 면 ▾ 를 붙인다", () => {
    render(
      <LidViewTabs aria-label="보기">
        <LidViewTab active>목록</LidViewTab>
        <LidViewTab active={false} menu>
          문양
        </LidViewTab>
      </LidViewTabs>,
    )
    expect(screen.getByRole("button", { name: "목록" })).toHaveAttribute("aria-pressed", "true")
    const other = screen.getByRole("button", { name: "문양" })
    expect(other).toHaveAttribute("aria-pressed", "false")
    expect(other.querySelector('[data-slot="lid-view-tab-caret"]')).toHaveTextContent("▾")
  })
})
