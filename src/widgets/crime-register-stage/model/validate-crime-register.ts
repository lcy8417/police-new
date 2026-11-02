import { buildAprthngNo, type CrimeRegisterForm } from "./form"

/**
 * 사건(감정물) 등록 입력 검증 — 설계서 §5(SCAS 열 길이) 규칙을 서버로 보내기 전에
 * 화면에서 먼저 확인한다. 위반이 있으면 **첫 위반**의 한국어 메시지를, 없으면 `null`.
 *
 * 순서: 필수 → 허용 문자 → 번호 길이 → 채취 일시 → 나머지 최대 길이.
 * 같은 규칙을 서버도 400으로 검사하므로, 여기서 놓친 것은 서버 `detail`이 화면에 뜬다.
 */

/** URL 경로·파일명에 쓰이는 번호의 허용 문자(설계서 §5). */
const ID_PATTERN = /^[0-9A-Za-z_-]+$/

/** `YYYY-MM-DD HH:mm` 또는 `YYYY-MM-DD HH:mm:ss`. */
const PICK_DT_PATTERN = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})(?::(\d{2}))?$/

const MAX_ID_LENGTH = 20

const MSG_BAD_CHARS = "번호는 영문·숫자·-·_만 쓸 수 있습니다"
const MSG_BAD_PICK_DT = "채취 일시 형식은 YYYY-MM-DD HH:mm 입니다"

/**
 * 글자 수 — 서버(Python `len`)와 같게 코드포인트 단위로 센다(이모지 등 서로게이트 쌍을
 * 2자로 세지 않도록).
 */
const charCount = (value: string) => Array.from(value).length

/** 형식이 맞고 실제로 존재하는 날짜·시각인가(2월 30일·24시·60분 등 거절). */
function isValidPickDt(value: string): boolean {
  const match = PICK_DT_PATTERN.exec(value)
  if (!match) return false
  const [, y, mo, d, h, mi, s = "00"] = match
  const [year, month, day, hour, minute, second] = [y, mo, d, h, mi, s].map(Number)
  if (hour > 23 || minute > 59 || second > 59) return false
  // Date.UTC는 범위를 넘는 월·일을 다음 달로 넘기므로, 되돌려 읽어 같은지 비교한다.
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

/** 최대 길이 규칙(필드 → 한도·메시지). 순서대로 검사한다. */
const MAX_LENGTH_RULES: ReadonlyArray<{
  key: keyof CrimeRegisterForm
  max: number
  message: string
}> = [
  { key: "pickPlace", max: 200, message: "채취 장소는 200자 이내입니다" },
  { key: "pickMthCode", max: 8, message: "채취 방법 코드는 8자 이내입니다" },
  { key: "crimeNm", max: 300, message: "사건명은 300자 이내입니다" },
  { key: "rqestGrfcNm", max: 300, message: "의뢰관서는 300자 이내입니다" },
]

export function validateCrimeRegister(form: CrimeRegisterForm): string | null {
  if (form.apprslReqestNo.trim() === "") return "감정의뢰번호를 입력하세요"
  if (form.aprthngSn.trim() === "") return "감정물 순번을 입력하세요"

  if (!ID_PATTERN.test(form.apprslReqestNo) || !ID_PATTERN.test(form.aprthngSn)) {
    return MSG_BAD_CHARS
  }

  if (charCount(form.apprslReqestNo) > MAX_ID_LENGTH) {
    return "감정의뢰번호는 20자 이내여야 합니다"
  }
  if (charCount(buildAprthngNo(form.apprslReqestNo, form.aprthngSn)) > MAX_ID_LENGTH) {
    return "감정물 번호는 20자 이내여야 합니다"
  }

  if (form.pickDt !== "" && !isValidPickDt(form.pickDt)) return MSG_BAD_PICK_DT

  for (const rule of MAX_LENGTH_RULES) {
    if (charCount(form[rule.key]) > rule.max) return rule.message
  }

  return null
}
