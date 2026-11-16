// S00 로그인 진열용 가짜 값. 문구는 서버가 주는 한국어 detail 모양을 흉내 낸 것이다(진열 전용).

// 진열 케이스(frame/dev-screens.ts): 기본 상태에 로그인 전용(failed · locked · password-change)을 더한다.

/** 아이디 · 비밀번호 불일치(401) — 서버 문구 모양 */
export const LOGIN_FAILED_MESSAGE = "아이디 또는 비밀번호가 올바르지 않습니다"

/** 계정 잠금(423) — 서버가 주는 문구를 그대로 보이는 자리의 가짜 값 */
export const LOCKED_MESSAGE = "연속 로그인 실패로 계정이 잠겼습니다. 관리자에게 잠금 해제를 요청하세요"

/** 서버에 닿지 못했을 때 */
export const NETWORK_MESSAGE = "서버에 연결할 수 없습니다. 잠시 후 다시 시도하세요"

/** 비밀번호 변경 화면에 보일 계정(이름은 가림) */
export const MOCK_ACCOUNT = { userNm: "박○○", userId: "park0412" } as const
