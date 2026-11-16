import { act, fireEvent, render, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"

import { DISPLAY_PREFS_KEY, resetDisplayPrefsCache, useDisplayPrefs } from "@/shared/lib/display-prefs"
import { ThemeScope } from "./ThemeScope"
import { ThemeSettings } from "./ThemeSettings"

// 설정 창 + 그 값을 쓰는 범위(진열 틀과 같은 조립)
function Harness() {
  const prefs = useDisplayPrefs()
  return (
    <ThemeScope prefs={prefs} data-testid="scope">
      <ThemeSettings />
    </ThemeScope>
  )
}

// 펼침 칸(disclosure) — 이름 있는 구역(region)이고 대화상자가 아니다
const panel = () => screen.queryByRole("region", { name: "화면 설정" })

function open() {
  fireEvent.click(screen.getByRole("button", { name: "화면 설정" }))
  return screen.getByRole("region", { name: "화면 설정" })
}

beforeEach(() => {
  localStorage.clear()
  resetDisplayPrefsCache()
})

describe("ThemeSettings", () => {
  it("처음엔 닫혀 있고, 누르면 열린다", () => {
    render(<Harness />)
    const trigger = screen.getByRole("button", { name: "화면 설정" })
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    expect(panel()).toBeNull()
    open()
    expect(trigger).toHaveAttribute("aria-expanded", "true")
    // 대화상자가 아니므로 초점을 가두지 않는다(aria-controls 로 연결된 펼침 칸)
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(trigger.getAttribute("aria-controls")).toBe(panel()!.id)
  })

  it("기본값: SCAS 밝게 · D2Coding · 보통 · 움직임 줄이기 끔", () => {
    render(<Harness />)
    const dialog = open()
    const pressed = (group: string) =>
      within(within(dialog).getByRole("group", { name: group })).getByRole("button", { pressed: true })
    expect(pressed("색 팔레트")).toHaveTextContent("SCAS 밝게")
    expect(pressed("글꼴")).toHaveTextContent("D2Coding")
    expect(pressed("글자 크기")).toHaveTextContent("보통")
    expect(pressed("움직임 줄이기")).toHaveTextContent("끔")
    expect(screen.getByTestId("scope")).toHaveAttribute("data-theme", "scas-light")
  })

  it("팔레트 4개 · 글꼴 6개 · 글자 크기 3개, 미리보기 색과 글꼴 이름표는 그 범위로 그린다", () => {
    render(<Harness />)
    const dialog = open()
    const palette = within(dialog).getByRole("group", { name: "색 팔레트" })
    expect(within(palette).getAllByRole("button")).toHaveLength(4)
    expect(palette.querySelectorAll("[data-theme]")).toHaveLength(4)
    const fonts = within(dialog).getByRole("group", { name: "글꼴" })
    expect(within(fonts).getAllByRole("button")).toHaveLength(6)
    expect(within(fonts).getByText("나눔바른고딕")).toHaveAttribute("data-font", "nanum-barun")
    expect(within(within(dialog).getByRole("group", { name: "글자 크기" })).getAllByRole("button")).toHaveLength(3)
  })

  it("고르면 범위 속성이 바뀌고 저장소에 기억된다", () => {
    render(<Harness />)
    const dialog = open()
    fireEvent.click(within(dialog).getByRole("button", { name: /어둡게/ }))
    fireEvent.click(within(dialog).getByRole("button", { name: "Pretendard" }))
    fireEvent.click(within(dialog).getByRole("button", { name: "아주 크게" }))
    fireEvent.click(within(dialog).getByRole("button", { name: "켬" }))
    const scope = screen.getByTestId("scope")
    expect(scope).toHaveAttribute("data-theme", "dark")
    expect(scope).toHaveAttribute("data-font", "pretendard")
    expect(scope).toHaveAttribute("data-scale", "xl")
    expect(scope).toHaveAttribute("data-motion", "reduce")
    expect(JSON.parse(localStorage.getItem(DISPLAY_PREFS_KEY) ?? "{}")).toEqual({
      theme: "dark",
      font: "pretendard",
      scale: "xl",
      reducedMotion: true,
    })
  })

  it("Esc 로 닫히고 여는 버튼으로 초점이 돌아간다", () => {
    render(<Harness />)
    open()
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))
    })
    expect(panel()).toBeNull()
    expect(screen.getByRole("button", { name: "화면 설정" })).toHaveFocus()
  })

  it("바깥을 누르면 닫히고, 안을 누르면 그대로", () => {
    render(
      <div>
        <Harness />
        <p>바깥</p>
      </div>,
    )
    const dialog = open()
    fireEvent.mouseDown(dialog)
    expect(panel()).toBeInTheDocument()
    fireEvent.mouseDown(screen.getByText("바깥"))
    expect(panel()).toBeNull()
  })

  it("닫기 버튼", () => {
    render(<Harness />)
    const dialog = open()
    fireEvent.click(within(dialog).getByRole("button", { name: "닫기" }))
    expect(panel()).toBeNull()
  })

  it("기억한 값이 깨져 있어도 기본값으로 열린다", () => {
    localStorage.setItem(DISPLAY_PREFS_KEY, "garbage")
    render(<Harness />)
    expect(screen.getByTestId("scope")).toHaveAttribute("data-theme", "scas-light")
  })
})
