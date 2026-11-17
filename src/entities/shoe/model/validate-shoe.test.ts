import { describe, expect, it } from "vitest"

import { EMPTY_SHOE_FORM } from "./form"
import type { Shoe } from "./types"
import { validateShoeForm } from "./validate-shoe"

const MSG_BAD_CHARS = "번호는 영문·숫자·-·_만 쓸 수 있습니다"

function shoe(overrides: Partial<Shoe> = {}): Shoe {
  return { ...EMPTY_SHOE_FORM, ftwrId: "00758", ...overrides }
}

describe("validateShoeForm — 새 등록(new)", () => {
  it("정상 입력이면 null", () => {
    expect(validateShoeForm(shoe({ colctYear: "2019", modlNm: "크록스" }), "new")).toBeNull()
  })

  it("신발ID가 비면 필수 메시지", () => {
    expect(validateShoeForm(shoe({ ftwrId: "" }), "new")).toBe("신발ID를 입력하세요")
    expect(validateShoeForm(shoe({ ftwrId: "   " }), "new")).toBe("신발ID를 입력하세요")
  })

  it("rejects reserved ftwrId — 예약어 count와 허용되지 않은 문자를 막는다", () => {
    expect(validateShoeForm(shoe({ ftwrId: "count" }), "new")).toBe(
      "'count'은(는) 신발 ID로 쓸 수 없습니다"
    )
    // 서버(schemas/shoes.py)와 같이 대소문자를 가리지 않는다.
    expect(validateShoeForm(shoe({ ftwrId: "COUNT" }), "new")).toBe(
      "'COUNT'은(는) 신발 ID로 쓸 수 없습니다"
    )
    // B 단계 GET /shoes/stages(J8)와 겹침 — 서버 RESERVED_FTWR_IDS와 같다
    expect(validateShoeForm(shoe({ ftwrId: "stages" }), "new")).toBe(
      "'stages'은(는) 신발 ID로 쓸 수 없습니다"
    )
    expect(validateShoeForm(shoe({ ftwrId: "Stages" }), "new")).toBe(
      "'Stages'은(는) 신발 ID로 쓸 수 없습니다"
    )
    expect(validateShoeForm(shoe({ ftwrId: "a.b" }), "new")).toBe(MSG_BAD_CHARS)
    expect(validateShoeForm(shoe({ ftwrId: "a/b" }), "new")).toBe(MSG_BAD_CHARS)
    expect(validateShoeForm(shoe({ ftwrId: "a b" }), "new")).toBe(MSG_BAD_CHARS)
  })

  it("신발ID는 8자 이내", () => {
    expect(validateShoeForm(shoe({ ftwrId: "12345678" }), "new")).toBeNull()
    expect(validateShoeForm(shoe({ ftwrId: "123456789" }), "new")).toBe(
      "신발ID는 8자 이내여야 합니다"
    )
  })

  it("앞자리 0 ID와 -·_ 를 허용한다", () => {
    expect(validateShoeForm(shoe({ ftwrId: "007-5_8" }), "new")).toBeNull()
  })
})

describe("validateShoeForm — 공통 메타데이터 규칙", () => {
  it("수집연도는 비었거나 숫자 4자리", () => {
    expect(validateShoeForm(shoe({ colctYear: "" }), "new")).toBeNull()
    expect(validateShoeForm(shoe({ colctYear: null }), "edit")).toBeNull()
    expect(validateShoeForm(shoe({ colctYear: "19" }), "new")).toBe(
      "수집연도는 숫자 4자리여야 합니다"
    )
    expect(validateShoeForm(shoe({ colctYear: "2O19" }), "edit")).toBe(
      "수집연도는 숫자 4자리여야 합니다"
    )
  })

  it("최대 길이를 넘으면 메시지", () => {
    expect(validateShoeForm(shoe({ modlNm: "가".repeat(501) }), "new")).toBe(
      "모델명은 500자 이내입니다"
    )
    expect(validateShoeForm(shoe({ brandCode: "1234567890" }), "edit")).toBe(
      "상표코드는 9자 이내입니다"
    )
    expect(validateShoeForm(shoe({ makrCode: "123456789" }), "edit")).toBe(
      "제조사코드는 8자 이내입니다"
    )
    expect(validateShoeForm(shoe({ colctPlace: "가".repeat(201) }), "edit")).toBe(
      "수집처는 200자 이내입니다"
    )
  })

  it("null 메타데이터(SCAS 빈 값)는 통과한다", () => {
    expect(
      validateShoeForm(
        shoe({ modlNm: null, brandCode: null, makrCode: null, colctPlace: null, colctYear: null }),
        "edit"
      )
    ).toBeNull()
  })
})

describe("validateShoeForm — 수정(edit)", () => {
  it("신발ID는 URL 키라 검사하지 않는다(SCAS 원본 ID 그대로 수정 가능)", () => {
    expect(validateShoeForm(shoe({ ftwrId: "count" }), "edit")).toBeNull()
  })
})
