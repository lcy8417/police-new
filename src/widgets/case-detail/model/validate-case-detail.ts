import type { CaseDetailForm } from "./types"

/** 지금 앱 문구 그대로(사용자 매뉴얼 PART 1) */
export const REQUIRED_MESSAGE = "이미지와 사건 번호는 필수 입력 사항입니다."

/** 저장 전 필수 확인: 이미지가 없거나 사건번호가 비면 첫 위반 문구, 아니면 null */
export function validateCaseDetail(form: CaseDetailForm, imageCount: number): string | null {
  if (imageCount === 0 || form.apprslReqestNo.trim() === "") return REQUIRED_MESSAGE
  return null
}

/** 파일명 끝 `_숫자` 로 정렬(문자열 정렬이면 _1 _10 _11 _12 _2 로 뒤섞인다). 숫자가 없으면 이름순 */
export function imageSeq(fileName: string): number {
  const m = /_(\d+)(?:\.[^.]+)?$/.exec(fileName)
  return m ? Number(m[1]) : Number.POSITIVE_INFINITY
}
