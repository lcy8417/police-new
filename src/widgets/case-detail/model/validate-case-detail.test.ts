import { describe, expect, it } from "vitest"

import { REQUIRED_MESSAGE, imageSeq, validateCaseDetail } from "./validate-case-detail"
import type { CaseDetailForm } from "./types"

const FORM: CaseDetailForm = {
  apprslReqestNo: "00001-25-0649", aprthngSn: "1", rqestGrfcNm: "", crimeNm: "", pickDt: "", pickPlace: "", pickMthCode: "",
}

describe("validateCaseDetail", () => {
  it("사건번호가 비면 필수 안내", () => {
    expect(validateCaseDetail({ ...FORM, apprslReqestNo: " " }, 3)).toBe(REQUIRED_MESSAGE)
  })
  it("이미지가 없으면 필수 안내", () => {
    expect(validateCaseDetail(FORM, 0)).toBe("이미지와 사건 번호는 필수 입력 사항입니다.")
  })
  it("둘 다 있으면 통과", () => {
    expect(validateCaseDetail(FORM, 1)).toBeNull()
  })
})

describe("imageSeq", () => {
  it("파일명 끝 숫자로 읽는다(_10 > _2)", () => {
    expect(imageSeq("00001-25-0649_10.jpg")).toBeGreaterThan(imageSeq("00001-25-0649_2.jpg"))
  })
})
