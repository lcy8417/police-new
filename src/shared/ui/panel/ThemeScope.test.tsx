import { act, render, screen } from "@testing-library/react"
import { toast } from "sonner"
import { describe, expect, it } from "vitest"

import { Toaster } from "@/shared/ui/sonner"
import { DialogShell } from "../kit"
import { ThemeScope } from "./ThemeScope"

const PREFS = { theme: "scas-light", font: "noto-sans", scale: "lg", reducedMotion: false } as const

describe("ThemeScope", () => {
  it("설정 값을 범위 속성으로 단다", () => {
    const { container } = render(
      <ThemeScope prefs={{ theme: "dark", font: "pretendard", scale: "lg", reducedMotion: false }} className="x">
        <p>본문</p>
      </ThemeScope>,
    )
    const el = container.firstElementChild!
    expect(el).toHaveAttribute("data-part", "ThemeScope")
    expect(el).toHaveAttribute("data-theme", "dark")
    expect(el).toHaveAttribute("data-font", "pretendard")
    expect(el).toHaveAttribute("data-scale", "lg")
    expect(el).not.toHaveAttribute("data-motion")
    expect(el).toHaveClass("x")
    expect(el).toHaveTextContent("본문")
  })

  it("움직임 줄이기면 data-motion=reduce", () => {
    const { container } = render(
      <ThemeScope prefs={{ theme: "scas-light", font: "d2coding", scale: "md", reducedMotion: true }} />,
    )
    expect(container.firstElementChild).toHaveAttribute("data-motion", "reduce")
  })
})

describe("겹침 창이 범위를 벗어나지 않는다", () => {
  it("DialogShell(modal)은 범위 안 포털 자리로 뜬다", () => {
    render(
      <ThemeScope prefs={PREFS}>
        <DialogShell open onOpenChange={() => {}} title="신발 정보">
          <p>몸</p>
        </DialogShell>
      </ThemeScope>,
    )
    const dialog = screen.getByRole("dialog", { name: "신발 정보" })
    const scope = dialog.closest('[data-part="ThemeScope"]')
    expect(scope).not.toBeNull()
    expect(dialog.closest("[data-theme-portal]")).not.toBeNull()
    expect(scope).toHaveAttribute("data-theme", "scas-light")
    expect(scope).toHaveAttribute("data-font", "noto-sans")
    expect(scope).toHaveAttribute("data-scale", "lg")
  })

  it("DialogShell(layer)도 container 가 없으면 범위 안 포털 자리로", () => {
    render(
      <ThemeScope prefs={PREFS}>
        <DialogShell open onOpenChange={() => {}} title="레이어" variant="layer">
          <p>몸</p>
        </DialogShell>
      </ThemeScope>,
    )
    expect(screen.getByRole("dialog", { name: "레이어" }).closest("[data-theme-portal]")).not.toBeNull()
  })

  it("범위 밖 DialogShell 은 전과 같이 body 로", () => {
    render(
      <DialogShell open onOpenChange={() => {}} title="밖">
        <p>몸</p>
      </DialogShell>,
    )
    const dialog = screen.getByRole("dialog", { name: "밖" })
    expect(dialog.closest("[data-theme-portal]")).toBeNull()
    expect(dialog.closest("[data-theme]")).toBeNull()
  })

  it("알림(Toaster)은 범위가 열려 있을 때만 범위 속성 상자로 감싸진다", async () => {
    const { container, rerender } = render(<Toaster />)
    expect(container.querySelector("[data-toaster-scope]")).toBeNull()
    rerender(
      <>
        <ThemeScope prefs={PREFS} />
        <Toaster />
      </>,
    )
    const wrap = container.querySelector("[data-toaster-scope]")
    expect(wrap).toHaveAttribute("data-theme", "scas-light")
    expect(wrap).toHaveAttribute("data-font", "noto-sans")
    await act(async () => {
      toast("저장했습니다")
    })
    expect(await screen.findByText("저장했습니다")).toBeInTheDocument()
    expect(screen.getByText("저장했습니다").closest("[data-toaster-scope]")).toBe(wrap)
    rerender(<Toaster />)
    expect(container.querySelector("[data-toaster-scope]")).toBeNull()
  })
})
