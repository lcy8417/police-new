/**
 * 비밀번호 규칙 — 설계서 §3(서버 `validate_password`와 같은 규칙·문구).
 * 8자 이상, UTF-8 기준 72바이트 이하(bcrypt가 72바이트 뒤를 무시하므로 초과는 거부, 자르지 않음).
 * 서버도 같은 검사를 하지만, 화면에서 먼저 막아 왕복 없이 바로 알려 준다.
 */

/** 화면에 보일 비밀번호 오류 문구. `tooShort`·`tooLong`·`sameAsCurrent`는 서버 문구와 같다. */
export const PASSWORD_MESSAGES = {
  tooShort: "비밀번호는 8자 이상이어야 합니다",
  tooLong: "비밀번호는 UTF-8 기준 72바이트 이하여야 합니다",
  mismatch: "새 비밀번호가 일치하지 않습니다",
  sameAsCurrent: "현재와 다른 비밀번호를 입력하세요",
} as const;

/** 최소 글자 수(코드 포인트 기준 — 서버 Python `len`과 같음). */
export const PASSWORD_MIN_LENGTH = 8;
/** 최대 UTF-8 바이트 수(bcrypt 한계). */
export const PASSWORD_MAX_BYTES = 72;

/** UTF-8로 인코딩했을 때의 바이트 수(한글 1자 = 3바이트). */
export function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

/** 비밀번호 규칙 위반 문구, 통과하면 `null`. */
export function passwordRuleError(value: string): string | null {
  if ([...value].length < PASSWORD_MIN_LENGTH) return PASSWORD_MESSAGES.tooShort;
  if (utf8ByteLength(value) > PASSWORD_MAX_BYTES) return PASSWORD_MESSAGES.tooLong;
  return null;
}
