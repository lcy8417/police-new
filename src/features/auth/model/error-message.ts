import { ApiError } from "@/shared/api";

/** 서버에 닿지 못했을 때(네트워크 오류·중계 서버 다운) 보일 문구. */
const NETWORK_ERROR_MESSAGE = "서버에 연결할 수 없습니다. 잠시 후 다시 시도하세요";

/**
 * 로그인·비밀번호 변경 실패 문구 — 서버 한국어 `detail`(401 로그인 실패·423 잠김·403 중지·
 * 400 비밀번호 규칙)을 그대로, 없으면 `ApiError.message`, 서버에 닿지 못했으면 연결 안내.
 */
export function authErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.detail ?? error.message;
  return NETWORK_ERROR_MESSAGE;
}
