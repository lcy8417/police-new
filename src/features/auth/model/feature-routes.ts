/**
 * 기능 권한 ↔ 화면 주소 대응과 "어디로 보낼까" 계산(설계서 §2·§7).
 *
 * 권한 없는 주소로 들어오면 허용된 첫 화면으로, 로그인 후에는 원래 가려던 주소(`from`)로
 * 보낸다. 모두 순수 함수라 라우트 가드·로그인 화면·세션 담당이 같은 답을 낸다.
 */
import { FEATURES, type FeatureCode, type SessionUser } from "@/entities/session";
import { hasAnyFeature } from "./session-store";

/** 로그인 화면 주소. */
export const LOGIN_PATH = "/login";
/** 비밀번호 변경 화면 주소. */
export const PASSWORD_PATH = "/password";

/** 사건관리(`/cases` 목록 · 사건 창)를 볼 수 있는 권한 — 하나라도 있으면(화면 이식 계획 §1 r2). */
export const CASE_VIEW_FEATURES: readonly FeatureCode[] = [
  FEATURES.CASE_STATUS_VIEW,
  FEATURES.CRIME_SEARCH,
  FEATURES.EXAM_VIEW,
];

/**
 * `/cases` 라우트 가드 — 사건 보기 권한 또는 신발 보기(분업 담당이 `/cases?shoe=1` 신발 DB 패널로 들어오게).
 * 신발 분업 권한(`SHOE_EDIT` · `SHOE_PATTERN` · `SHOE_APPROVE`)은 서버가 `SHOE_VIEW`를 함께 준다.
 */
export const CASES_ROUTE_FEATURES: readonly FeatureCode[] = [...CASE_VIEW_FEATURES, FEATURES.SHOE_VIEW];

/**
 * 기능 권한별 대표 화면 — 첫 번째 허용 항목이 "첫 화면"(r2 — 새 사건관리 `/cases`를 맨 앞에. 지금 첫 항목이
 * 사건 등록이면 수사관 · 감정관이 로그인 직후 등록 화면으로 간다). `codes` 중 하나라도 있으면 허용.
 * 옛 화면(`/crimeRegister` · `/search`)은 넘겨주기 전까지 그대로 남긴다(사건 보기 권한 없이 등록만 가진 사람).
 */
export const FEATURE_ROUTES: readonly { codes: readonly FeatureCode[]; path: string }[] = [
  { codes: CASE_VIEW_FEATURES, path: "/cases" },
  { codes: [FEATURES.CRIME_REGISTER], path: "/crimeRegister" },
  { codes: [FEATURES.CRIME_SEARCH], path: "/search" },
  { codes: [FEATURES.SHOE_VIEW], path: "/cases?shoe=1" },
];

/** 이 사용자가 열 수 있는 첫 화면. 하나도 없거나 로그인 전이면 `null`(권한 없음 안내). */
export function firstAllowedPath(user: SessionUser | null | undefined): string | null {
  if (!user) return null;
  return FEATURE_ROUTES.find((route) => hasAnyFeature(user, route.codes))?.path ?? null;
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
