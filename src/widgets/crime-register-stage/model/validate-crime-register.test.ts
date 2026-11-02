import { describe, expect, it } from "vitest"

import { buildAprthngNo, type CrimeRegisterForm } from "./form"
import { validateCrimeRegister } from "./validate-crime-register"

const VALID: CrimeRegisterForm = {
  apprslReqestNo: "05019-24-0017",
  aprthngSn: "5",
  pickDt: "2024-01-29 05:31",
  pickPlace: "서울 종로구",
  pickMthCode: "FT001",
  crimeNm: "절도",
  rqestGrfcNm: "서울청",
}

const BAD_CHARS = "번호는 영문·숫자·-·_만 쓸 수 있습니다"
const BAD_PICK_DT = "채취 일시 형식은 YYYY-MM-DD HH:mm 입니다"

const withForm = (patch: Partial<CrimeRegisterForm>) =>
  validateCrimeRegister({ ...VALID, ...patch })

describe("buildAprthngNo", () => {
  it("감정의뢰번호와 순번을 `_`로 잇는다", () => {
    expect(buildAprthngNo("05019-24-0017", "5")).toBe("05019-24-0017_5")
  })
})

describe("validateCrimeRegister", () => {
  it("정상 입력이면 null", () => {
    expect(validateCrimeRegister(VALID)).toBeNull()
  })

  it("감정의뢰번호가 비면 필수 메시지", () => {
    expect(withForm({ apprslReqestNo: "" })).toBe("감정의뢰번호를 입력하세요")
  })

  it("감정물 순번이 비면 필수 메시지", () => {
    expect(withForm({ aprthngSn: "" })).toBe("감정물 순번을 입력하세요")
  })

  it("감정의뢰번호가 20자를 넘으면 길이 메시지", () => {
    expect(withForm({ apprslReqestNo: "A".repeat(21) })).toBe(
      "감정의뢰번호는 20자 이내여야 합니다"
    )
  })

  it("조합 번호 21자면 감정물 번호 길이 메시지", () => {
    // 16자 + "_" + 4자 = 21자
    const form = { apprslReqestNo: "05019-24-0017-12", aprthngSn: "1234" }
    expect(buildAprthngNo(form.apprslReqestNo, form.aprthngSn)).toHaveLength(21)
    expect(withForm(form)).toBe("감정물 번호는 20자 이내여야 합니다")
    // 정확히 20자는 통과
    expect(withForm({ apprslReqestNo: "05019-24-0017-12", aprthngSn: "123" })).toBeNull()
  })

  it("rejects bad characters", () => {
    expect(withForm({ apprslReqestNo: "05019/24" })).toBe(BAD_CHARS)
    expect(withForm({ apprslReqestNo: "05019 24" })).toBe(BAD_CHARS)
    expect(withForm({ apprslReqestNo: "05019#24" })).toBe(BAD_CHARS)
    expect(withForm({ aprthngSn: "1.5" })).toBe(BAD_CHARS)
  })

  it("pickDt 형식 오류는 형식 메시지", () => {
    expect(withForm({ pickDt: "어제" })).toBe(BAD_PICK_DT)
    expect(withForm({ pickDt: "2024-01-29T05:31" })).toBe(BAD_PICK_DT)
    expect(withForm({ pickDt: "2024-1-29 05:31" })).toBe(BAD_PICK_DT)
  })

  it("pickDt는 빈 값·분까지·초까지 형식을 받는다", () => {
    expect(withForm({ pickDt: "" })).toBeNull()
    expect(withForm({ pickDt: "2024-01-29 05:31" })).toBeNull()
    expect(withForm({ pickDt: "2024-01-29 05:31:07" })).toBeNull()
    expect(withForm({ pickDt: "2024-02-29 23:59:59" })).toBeNull() // 윤년
  })

  it("존재하지 않는 날짜·시각은 형식 메시지", () => {
    expect(withForm({ pickDt: "2024-02-30 10:00" })).toBe(BAD_PICK_DT)
    expect(withForm({ pickDt: "2023-02-29 10:00" })).toBe(BAD_PICK_DT)
    expect(withForm({ pickDt: "2024-13-01 10:00" })).toBe(BAD_PICK_DT)
    expect(withForm({ pickDt: "2024-01-29 24:00" })).toBe(BAD_PICK_DT)
    expect(withForm({ pickDt: "2024-01-29 10:60" })).toBe(BAD_PICK_DT)
    expect(withForm({ pickDt: "2024-01-29 10:00:60" })).toBe(BAD_PICK_DT)
  })

  it("pickMthCode 9자면 길이 메시지", () => {
    expect(withForm({ pickMthCode: "A".repeat(9) })).toBe("채취 방법 코드는 8자 이내입니다")
    expect(withForm({ pickMthCode: "A".repeat(8) })).toBeNull()
  })

  it("채취 장소·사건명·의뢰관서 최대 길이", () => {
    expect(withForm({ pickPlace: "가".repeat(201) })).toBe("채취 장소는 200자 이내입니다")
    expect(withForm({ pickPlace: "가".repeat(200) })).toBeNull()
    expect(withForm({ crimeNm: "가".repeat(301) })).toBe("사건명은 300자 이내입니다")
    expect(withForm({ rqestGrfcNm: "가".repeat(301) })).toBe("의뢰관서는 300자 이내입니다")
    expect(withForm({ crimeNm: "가".repeat(300), rqestGrfcNm: "가".repeat(300) })).toBeNull()
  })
})
