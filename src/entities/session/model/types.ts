/**
 * 로그인 세션 타입 — 서버 `/auth/login`·`/auth/me` 응답(설계서 §6).
 * 서버는 snake로 응답하고(`*Dto`), 프론트는 `convertKeysToCamelCase`로 바꿔 쓴다.
 */
import type { FeatureCode } from "./features";

/** 계정 구분 — 관리자 / 사용자. */
export type UserSe = "ADMIN" | "USER";

/**
 * 역할 코드(서버 `app.role` — 0005). 관리자는 역할이 아니라 `userSe="ADMIN"`.
 * 감정관 · 검증자 = 직원(전체 관서), 수사관 = 자기 관서만. 검증자 = 화면 「기술책임자」(보기 전용 `EXAM_VIEW` + 발송).
 */
export type RoleCode = "INVESTIGATOR" | "EXAMINER" | "REVIEWER";

/** `/auth/login`·`/auth/me` 200 응답(snake). */
export interface SessionUserDto {
  /** 로그인 ID(영문·숫자·`_`, 4~20자). */
  user_id: string;
  /** 사용자 이름. */
  user_nm: string;
  /** 계정 구분. */
  user_se: UserSe;
  /** 실효 기능 권한(관리자는 서버가 비워 줄 수 있음 — 관리자는 항상 전부 허용). */
  features: FeatureCode[];
  /** true면 로그인 직후 비밀번호 변경 화면으로 강제 이동. */
  password_change_required: boolean;
  /** 역할(서버 0005부터 늘 줌 — 옛 서버 · 옛 테스트 고정값 호환으로 선택). */
  roles?: RoleCode[];
  /** 현재 소속 관서 번호(0005부터). */
  org_id?: number | null;
  /** 현재 소속 관서 이름(B 단계 0단계 — 위 막대 표시). */
  org_nm?: string | null;
}

/** 로그인한 사용자(camel). */
export interface SessionUser {
  /** 로그인 ID. */
  userId: string;
  /** 사용자 이름. */
  userNm: string;
  /** 계정 구분. */
  userSe: UserSe;
  /** 실효 기능 권한(`SHOE_EDIT`면 `SHOE_VIEW` 포함 — 프론트에서 다시 펼치지 않음). */
  features: FeatureCode[];
  /** true면 비밀번호 변경 전까지 다른 화면 사용 불가. */
  passwordChangeRequired: boolean;
  /** 역할(없으면 빈 배열로 읽는다 — `rolesOf`). 화면 잠금은 편의일 뿐, 최종 판단은 서버(403). */
  roles?: RoleCode[];
  /** 현재 소속 관서 번호. */
  orgId?: number | null;
  /** 현재 소속 관서 이름(위 막대). 모르면 `null` → 표시 안 함. */
  orgNm?: string | null;
}

/** `POST /auth/login` 본문. */
export interface LoginInput {
  /** 로그인 ID. */
  userId: string;
  /** 비밀번호(평문 — HTTPS로만 전송, 기록·로그 금지). */
  password: string;
}

/** `POST /auth/password` 본문. */
export interface ChangePasswordInput {
  /** 현재 비밀번호. */
  currentPassword: string;
  /** 새 비밀번호(8자 이상, UTF-8 72바이트 이하). */
  newPassword: string;
}
