import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { Shoe } from "@/entities/shoe"

import { ShoeCard } from "./ShoeCard"

const shoe = (image: string | null): Shoe => ({
  ftwrId: "314924",
  modlNm: null,
  brandCode: null,
  makrCode: null,
  colctPlace: null,
  colctYear: null,
  image,
  top: [],
  mid: [],
  bottom: [],
  outline: [],
})

describe("ShoeCard — 그림 없음 자리", () => {
  it("그림을 못 읽으면(서버 404) 깨진 그림 대신 같은 칸 안 「이미지 없음」, 카드는 그대로 열린다", () => {
    const onOpen = vi.fn()
    const { container } = render(
      <ShoeCard shoe={shoe("/shoes_images/B/314924.png")} selected={false} hasPattern={false} onOpen={onOpen} imageClass="h-[104px]" />,
    )
    const img = container.querySelector("img")
    expect(img).toHaveAttribute("src", "/shoes_images/B/314924.png")
    expect(screen.queryByText("이미지 없음")).toBeNull()

    fireEvent.error(img as HTMLImageElement)
    expect(container.querySelector("img")).toBeNull()
    expect(screen.getByText("이미지 없음")).toBeInTheDocument()
    // 칸 크기(사진 칸 높이 클래스)는 그대로
    const box = screen.getByRole("button", { name: "314924 열기" })
    expect(box).toHaveClass("h-[104px]")
    expect(box.querySelector('[data-slot="shoe-card-no-image"]')).not.toBeNull()

    fireEvent.click(box)
    expect(onOpen).toHaveBeenCalledWith("314924")
  })

  it("그림 주소가 없으면 처음부터 「이미지 없음」", () => {
    const { container } = render(<ShoeCard shoe={shoe(null)} selected={false} hasPattern={false} onOpen={() => {}} />)
    expect(container.querySelector("img")).toBeNull()
    expect(screen.getByText("이미지 없음")).toBeInTheDocument()
  })

  it("그림을 새 주소로 바꾸면 다시 읽어 본다", () => {
    const { container, rerender } = render(
      <ShoeCard shoe={shoe("/shoes_images/B/314924.png")} selected={false} hasPattern={false} onOpen={() => {}} />,
    )
    fireEvent.error(container.querySelector("img") as HTMLImageElement)
    rerender(<ShoeCard shoe={shoe("data:image/png;base64,AAAA")} selected={false} hasPattern={false} onOpen={() => {}} />)
    expect(container.querySelector("img")).toHaveAttribute("src", "data:image/png;base64,AAAA")
    expect(screen.queryByText("이미지 없음")).toBeNull()
  })
})
