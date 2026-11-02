/**
 * 로그인 세션 상태(Zustand) — "지금 누가 로그인해 있고, 무엇을 할 수 있나"의 단일 출처.
 *
 * - `loading`: 앱 시작 직후 `GET /auth/me`로 세션을 확인하는 중
 * - `authenticated`: 로그인됨(`user`가 있음)
 * - `anonymous`: 로그인 안 됨 → 보호 화면은 `/login?from=`으로 보낸다
 *
 * 세션이 끝날 때(로그아웃·401)는 이 store를 비우지 않고 페이지 전체를 새로 불러온다
 * (`handleSessionEnded`) — 이전 계정의 상태가 다음 계정 화면에 섞이지 않게.
 */
import { create } from "zustand";
import type { FeatureCode, SessionUser } from "@/entities/session";

/** 세션 확인 상태. */
export type SessionStatus = "loading" | "authenticated" | "anonymous";

interface SessionState {
  /** 로그인한 사용자(로그인 전·확인 중이면 `null`). */
  user: SessionUser | null;
  /** 세션 확인 상태. */
  status: SessionStatus;
  /** 로그인 성공·세션 재확인 결과를 반영한다(상태 = `authenticated`). */
  setUser: (user: SessionUser) => void;
  /** 로그인 안 됨으로 표시한다(상태 = `anonymous`). */
  clear: () => void;
}

// @MX:ANCHOR: [AUTO] useSessionStore - 로그인 사용자·권한의 단일 출처, 라우트 가드·사이드바·사건 등록·로그인 화면이 구독
// @MX:REASON: 권한 판정(hasFeature)과 화면 접근 가드가 모두 이 값을 본다 — 다른 곳에 사용자 정보를 복사해 두지 말 것
export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  status: "loading",
  setUser: (user) => set({ user, status: "authenticated" }),
  clear: () => set({ user: null, status: "anonymous" }),
}));

/**
 * 이 사용자가 기능을 쓸 수 있나. 관리자는 항상 true.
 * 서버의 `features`는 이미 실효 권한(`SHOE_EDIT`면 `SHOE_VIEW` 포함)이라 다시 펼치지 않는다.
 */
export function hasFeature(user: SessionUser | null | undefined, code: FeatureCode): boolean {
  if (!user) return false;
  if (user.userSe === "ADMIN") return true;
  return user.features.includes(code);
}

/** 관리자인가(`/manage/*` 화면·관리 메뉴). */
export function isAdmin(user: SessionUser | null | undefined): boolean {
  return user?.userSe === "ADMIN";
}
