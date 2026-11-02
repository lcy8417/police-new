/**
 * 로그인 세션 API — `/auth/*`(설계서 §6). 응답은 `convertKeysToCamelCase`로 camel 변환.
 * 실패는 `ApiError`(서버 한국어 `detail` 포함 — 401 로그인 실패·423 잠김·403 중지·400 비밀번호 규칙).
 */
import { ApiError, apiGet, apiSend } from "@/shared/api";
import { convertKeysToCamelCase } from "@/shared/lib";
import type { ChangePasswordInput, LoginInput, SessionUser, SessionUserDto } from "../model/types";

/** POST /auth/login — 성공하면 서버가 세션 쿠키를 심고 사용자 정보를 돌려준다. */
export async function login(input: LoginInput): Promise<SessionUser> {
  const response = await apiSend("/auth/login", "POST", {
    userId: input.userId,
    password: input.password,
  });
  const data = (await response.json()) as SessionUserDto;
  return convertKeysToCamelCase<SessionUser>(data);
}

/** POST /auth/logout — 204, 서버가 쿠키를 지우고 세션을 닫는다. */
export async function logout(): Promise<void> {
  await apiSend("/auth/logout", "POST");
}

/**
 * GET /auth/me — 지금 세션의 사용자. 로그인하지 않았거나 세션이 끝났으면(401) `null`.
 * (`/auth/me`의 401은 `backendFetch`가 세션 종료 이동을 하지 않는다 — 판단은 호출부 몫.)
 */
export async function fetchMe(): Promise<SessionUser | null> {
  try {
    const data = await apiGet<SessionUserDto>("/auth/me");
    return convertKeysToCamelCase<SessionUser>(data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

/** POST /auth/password — 204. 현재 세션만 남기고 다른 세션은 서버가 종료한다. */
export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await apiSend("/auth/password", "POST", {
    currentPassword: input.currentPassword,
    newPassword: input.newPassword,
  });
}
