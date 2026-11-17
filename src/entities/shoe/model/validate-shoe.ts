import type { Shoe } from "./types"

/**
 * 신발 등록·수정 입력 검증 — 설계서 §5(SCAS `tbf_ftwrinfo` 열 길이) 규칙을 서버로 보내기
 * 전에 화면에서 먼저 확인한다. 위반이 있으면 **첫 위반**의 한국어 메시지를, 없으면 `null`.
 *
 * - 새 등록(`"new"`)만 `ftwrId`를 검사한다: 필수·1~8자·영문·숫자·`-`·`_`·예약어 `count` 금지
 *   (`GET /shoes/count`와 겹침 — 서버 `schemas/shoes.py`처럼 대소문자 무시).
 *   수정(`"edit"`)에서는 ID가 URL 키라 잠겨 있으므로 검사하지 않는다.
 * - 메타데이터는 SCAS에 비어 있는(NULL) 값이 많아 `null`·빈 문자열이면 통과하고,
 *   값이 있을 때만 수집연도 형식·최대 길이를 본다.
 */

/** URL 경로·파일명에 쓰이는 ID의 허용 문자(설계서 §5). */
const ID_PATTERN = /^[0-9A-Za-z_-]+$/

const MAX_FTWR_ID_LENGTH = 8

/** `GET /shoes/count` · `GET /shoes/stages`와 겹쳐 신발 ID로 쓸 수 없는 이름(소문자 기준 비교 — 서버 `RESERVED_FTWR_IDS`와 같음). */
const RESERVED_FTWR_IDS = new Set(["count", "stages"])

const COLCT_YEAR_PATTERN = /^[0-9]{4}$/

/** 글자 수 — 서버(Python `len`)와 같게 코드포인트 단위로 센다. */
const charCount = (value: string) => Array.from(value).length

type ShoeMetaKey = "modlNm" | "brandCode" | "makrCode" | "colctPlace"

/** 최대 길이 규칙(필드 → 한도·메시지). 화면 입력칸 순서대로 검사한다. */
const MAX_LENGTH_RULES: ReadonlyArray<{ key: ShoeMetaKey; max: number; message: string }> = [
  { key: "modlNm", max: 500, message: "모델명은 500자 이내입니다" },
  { key: "brandCode", max: 9, message: "상표코드는 9자 이내입니다" },
  { key: "makrCode", max: 8, message: "제조사코드는 8자 이내입니다" },
  { key: "colctPlace", max: 200, message: "수집처는 200자 이내입니다" },
]

function validateFtwrId(ftwrId: string): string | null {
  if (ftwrId.trim() === "") return "신발ID를 입력하세요"
  if (!ID_PATTERN.test(ftwrId)) return "번호는 영문·숫자·-·_만 쓸 수 있습니다"
  if (charCount(ftwrId) > MAX_FTWR_ID_LENGTH) return "신발ID는 8자 이내여야 합니다"
  if (RESERVED_FTWR_IDS.has(ftwrId.toLowerCase())) {
    return `'${ftwrId}'은(는) 신발 ID로 쓸 수 없습니다`
  }
  return null
}

export function validateShoeForm(form: Shoe, mode: "new" | "edit"): string | null {
  if (mode === "new") {
    const idError = validateFtwrId(form.ftwrId ?? "")
    if (idError) return idError
  }

  const colctYear = form.colctYear ?? ""
  if (colctYear !== "" && !COLCT_YEAR_PATTERN.test(colctYear)) {
    return "수집연도는 숫자 4자리여야 합니다"
  }

  for (const rule of MAX_LENGTH_RULES) {
    if (charCount(form[rule.key] ?? "") > rule.max) return rule.message
  }

  return null
}
