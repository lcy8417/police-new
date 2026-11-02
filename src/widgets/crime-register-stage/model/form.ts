/**
 * `/crimeRegister` 사건(감정물) 등록 폼의 입력값(설계서 §4-4, SCAS 감정물 필드).
 *
 * `aprthngSn`(감정물 순번)은 **화면 전용** 값이다 — 서버로는 보내지 않고,
 * `buildAprthngNo(apprslReqestNo, aprthngSn)`로 만든 감정물 번호 `aprthngNo`만 보낸다.
 */
export interface CrimeRegisterForm {
  /** 감정의뢰번호(필수, 최대 20자, 영문·숫자·`-`·`_`). 예 `05019-24-0017`. */
  apprslReqestNo: string
  /** 감정물 순번(화면 전용, 기본값 `"1"`). 감정물 번호의 `_` 뒤 부분. */
  aprthngSn: string
  /** 채취 일시: 빈 값, `YYYY-MM-DD HH:mm`, `YYYY-MM-DD HH:mm:ss`. */
  pickDt: string
  /** 채취 장소(최대 200자). */
  pickPlace: string
  /** 채취 방법 코드(최대 8자). */
  pickMthCode: string
  /** 사건명(최대 300자). */
  crimeNm: string
  /** 의뢰관서명(최대 300자). */
  rqestGrfcNm: string
}

/**
 * 등록 화면 작업 상태 = 텍스트 입력값 + 증거 이미지. `image`는 비어 있는 동안 `null`이고,
 * 제출 시점에 null이 아님을 확인한 뒤 `CrimeRegisterInput`으로 옮긴다.
 */
export interface CrimeFormData extends CrimeRegisterForm {
  /** 증거 이미지 data URL(`data:image/...;base64,...`). 업로드 전에는 null. */
  image: string | null
}

export const EMPTY_FORM: CrimeFormData = {
  image: null,
  apprslReqestNo: "",
  aprthngSn: "1",
  pickDt: "",
  pickPlace: "",
  pickMthCode: "",
  crimeNm: "",
  rqestGrfcNm: "",
}

/** 감정물 번호 = `<감정의뢰번호>_<순번>`(설계서 §3, 예 `05019-24-0017_5`). */
export function buildAprthngNo(apprslReqestNo: string, aprthngSn: string): string {
  return `${apprslReqestNo}_${aprthngSn}`
}
