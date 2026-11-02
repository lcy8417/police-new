import { ApiError } from "@/shared/api"

/**
 * 관리자 변경 요청 실패 문구 — 서버 한국어 `detail`(400 자기 자신·마지막 관리자 보호, 409 중복,
 * 400 이름·비밀번호·아이디 규칙)을 그대로, 없으면 `ApiError.message`, 서버에 닿지 못했으면 연결 안내.
 */
export function adminErrorMessage(error: unknown): string | null {
  if (!error) return null
  if (error instanceof ApiError) return error.detail ?? error.message
  return "서버에 연결할 수 없습니다. 잠시 후 다시 시도하세요"
}
