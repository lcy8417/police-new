/**
 * 로그인 세션 타입 — 서버 `/auth/login`·`/auth/me` 응답(설계서 §6).
 * 서버는 snake로 응답하고(`*Dto`), 프론트는 `convertKeysToCamelCase`로 바꿔 쓴다.
 */
import type { FeatureCode } from "./features";

/** 계정 구분 — 관리자 / 사용자. */
export type UserSe = "ADMIN" | "USER";

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
