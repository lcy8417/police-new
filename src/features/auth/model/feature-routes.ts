/**
 * 기능 권한 ↔ 화면 주소 대응과 "어디로 보낼까" 계산(설계서 §2·§7).
 *
 * 권한 없는 주소로 들어오면 허용된 첫 화면으로, 로그인 후에는 원래 가려던 주소(`from`)로
 * 보낸다. 모두 순수 함수라 라우트 가드·로그인 화면·세션 담당이 같은 답을 낸다.
 */
import { FEATURES, type FeatureCode, type SessionUser } from "@/entities/session";
import { hasFeature } from "./session-store";

/** 로그인 화면 주소. */
export const LOGIN_PATH = "/login";
/** 비밀번호 변경 화면 주소. */
export const PASSWORD_PATH = "/password";

/** 기능 권한별 대표 화면 — 사이드바 메뉴 순서와 같다(첫 번째 허용 항목이 "첫 화면"). */
export const FEATURE_ROUTES: readonly { code: FeatureCode; path: string }[] = [
  { code: FEATURES.CRIME_REGISTER, path: "/crimeRegister" },
  { code: FEATURES.CRIME_SEARCH, path: "/search" },
  { code: FEATURES.SHOE_VIEW, path: "/shoesRepository" },
];

/** 이 사용자가 열 수 있는 첫 화면. 하나도 없거나 로그인 전이면 `null`(권한 없음 안내). */
export function firstAllowedPath(user: SessionUser | null | undefined): string | null {
  if (!user) return null;
  return FEATURE_ROUTES.find((route) => hasFeature(user, route.code))?.path ?? null;
}

/**
 * 로그인 후 돌아갈 주소(`from`)가 같은 사이트 내부 경로면 그대로, 아니면 `null`.
 * `//evil.example`·`/\evil.example`(브라우저가 다른 사이트 주소로 읽음)·절대 주소는 버리고,
 * 로그인 화면 자신도 버린다(로그인 → 로그인 반복 방지).
 */
export function safeInternalPath(from: string | null | undefined): string | null {
  if (!from || !from.startsWith("/")) return null;
  if (from.startsWith("//") || from.startsWith("/\\")) return null;
  const pathname = from.split(/[?#]/, 1)[0];
  if (pathname === LOGIN_PATH) return null;
  return from;
}

/**
 * 로그인(또는 이미 로그인된 채 `/login` 진입) 직후 보낼 주소.
 * 비밀번호 변경이 필요하면 `/password`, 아니면 쿼리 `from` → 허용된 첫 화면 → `/`(권한 없음 안내) 순.
 * `search`는 `location.search`(`?from=...`).
 */
export function postLoginPath(user: SessionUser, search: string): string {
  if (user.passwordChangeRequired) return PASSWORD_PATH;
  const from = safeInternalPath(new URLSearchParams(search).get("from"));
  return from ?? firstAllowedPath(user) ?? "/";
}
