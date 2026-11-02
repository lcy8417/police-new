/**
 * 로그아웃 — 서버 세션을 닫고(실패해도) `/login`으로 전체 새로고침 이동한다.
 * 전체 새로고침이라 이전 계정의 진행 중 요청·쿼리 캐시·전역 상태가 한 번에 끊긴다(설계서 §7).
 */
import { logout } from "@/entities/session";
import { assignPage } from "./browser-navigation";
import { LOGIN_PATH } from "./feature-routes";

export async function logoutAndReload(): Promise<void> {
  try {
    await logout();
  } catch {
    // 서버 요청이 실패해도 화면은 로그인으로 보낸다(계획 Task 4). 세션이 서버에 그대로
    // 살아 있으면 로그인 화면이 다시 첫 화면으로 보내므로, 그때 다시 로그아웃하면 된다.
  }
  assignPage(LOGIN_PATH);
}
