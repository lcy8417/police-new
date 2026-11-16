// S00 로그인 진열용 가짜 값. 문구는 서버가 주는 한국어 detail 모양을 흉내 낸 것이다(진열 전용).

// 진열 케이스(frame/dev-screens.ts): 기본 상태에 로그인 전용(failed · locked · password-change)을 더한다.

/** 아이디 · 비밀번호 불일치(401) — 서버 문구 모양 */
export const LOGIN_FAILED_MESSAGE = "아이디 또는 비밀번호가 올바르지 않습니다"

/**
 * 계정 잠금(423) — 서버 문구 그대로(police-server 2026-11-03 설계서 §5, 3회차 검수).
 * 서버는 비밀번호가 맞았을 때만 잠김을 알리고, 틀리면 잠긴 계정이어도 401 「아이디 또는 비밀번호가 올바르지 않습니다」
 */
export const LOCKED_MESSAGE = "계정이 잠겼습니다. 관리자에게 문의하세요"

/** 서버에 닿지 못했을 때 */
export const NETWORK_MESSAGE = "서버에 연결할 수 없습니다. 잠시 후 다시 시도하세요"

/** 비밀번호 변경 화면에 보일 계정(이름은 가림) */
export const MOCK_ACCOUNT = { userNm: "박○○", userId: "park0412" } as const

// ── r2(시안 r3 +α) 예시 값 — 시안 s00-login.js 그대로 ──

/** 연속 실패 잠금 규칙(시안 핀 2): failed = 남은 시도 3회, locked = 0회 */
export const ATTEMPT_LIMIT = 5
export const FAILED_REMAINING = 3

/** 지난 로그인 · 그 뒤 실패 횟수(시안 핀 4) */
export const MOCK_LAST_LOGIN = { at: "2025-07-24 17:58", ip: "10.14.43.***", failCount: 2 } as const

/** 시연 그림의 상 · 중 · 하 무늬(시안 sole zones: dots · herring · grid)와 후보 4켤레 무늬(시안 ZS) */
export const DEMO_SOLE_ZONES = ["dots", "herring", "grid"] as const
export const DEMO_CANDIDATE_ZONES = [
  ["blocks", "wave", "grid"],
  ["herring", "lines", "blocks"],
  ["dots", "blocks", "lines"],
  ["tri", "herring", "grid"],
] as const

/** 상 · 중 · 하 「AI 제안」 문양 이름(시안 n21_15 타원 배열 · n32_04 헤링본 · n21_05 사각 배열) */
export const DEMO_PATTERN_NAMES = { top: "n21_15", mid: "n32_04", bottom: "n21_05" } as const
