import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import type { Shoe } from "@/entities/shoe"
import { ShoeInfoPanel } from "./ShoeInfoPanel"

const NULL_META_SHOE: Shoe = {
  ftwrId: "00758",
  ftwrGroupNm: null,
  modlNm: null,
  brandCode: null,
  makrCode: null,
  colctPlace: null,
  colctYear: null,
  top: [],
  mid: [],
  bottom: [],
  outline: [],
}

function renderPanel(props: Partial<Parameters<typeof ShoeInfoPanel>[0]> = {}) {
  const onFieldChange = vi.fn()
  render(
    <ShoeInfoPanel
      formData={NULL_META_SHOE}
      onFieldChange={onFieldChange}
      onSubmit={vi.fn()}
      onReset={vi.fn()}
      {...props}
    />
  )
  return { onFieldChange }
}

const input = (label: string) => screen.getByLabelText(label) as HTMLInputElement

describe("ShoeInfoPanel — SCAS 신발 입력칸", () => {
  it("renders null metadata as blank — 입력칸 값이 빈 문자열이다", () => {
    renderPanel()
    expect(input("신발ID").value).toBe("00758")
    for (const label of ["모델명", "상표코드", "제조사코드", "수집처", "수집연도"]) {
      expect(input(label).value).toBe("")
    }
  })

  it("설계서 §5 최대 길이를 maxLength로 건다", () => {
    renderPanel()
    expect(input("신발ID").maxLength).toBe(8)
    expect(input("모델명").maxLength).toBe(500)
    expect(input("상표코드").maxLength).toBe(9)
    expect(input("제조사코드").maxLength).toBe(8)
    expect(input("수집처").maxLength).toBe(200)
    expect(input("수집연도").maxLength).toBe(4)
  })

  it("필드 키는 SCAS 이름으로 올리고, 수집연도는 숫자만 남긴다", () => {
    const { onFieldChange } = renderPanel()
    fireEvent.change(input("모델명"), { target: { value: "클로그" } })
    expect(onFieldChange).toHaveBeenLastCalledWith("modlNm", "클로그")
    fireEvent.change(input("수집처"), { target: { value: "서울" } })
    expect(onFieldChange).toHaveBeenLastCalledWith("colctPlace", "서울")
    fireEvent.change(input("수집연도"), { target: { value: "20a1" } })
    expect(onFieldChange).toHaveBeenLastCalledWith("colctYear", "201")
  })

  it("수정 모드에서는 신발ID를 잠근다", () => {
    renderPanel({ ftwrIdReadOnly: true })
    expect(input("신발ID").readOnly).toBe(true)
    expect(input("모델명").readOnly).toBe(false)
  })
})
