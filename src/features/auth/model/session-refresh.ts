/**
 * 세션 재확인 — `GET /auth/me`를 다시 읽어 store를 갱신한다(시작·창 포커스·화면 이동·403 때).
 *
 * 동시에 여러 번 불러도 요청은 하나로 합친다(진행 중이면 같은 Promise). 결과 해석:
 *  - 이미 로그인된 상태인데 세션이 없음(`null`) → `handleSessionEnded()`(전체 새로고침으로 로그인 화면)
 *  - 돌려받은 `userId`가 지금과 다름(다른 탭에서 다른 계정 로그인) → store를 바꾸지 않고 새로고침
 *  - 같은 사용자 → 바뀐 값(권한 회수 등)만 반영 → 현재 화면의 권한 가드가 다시 판단
 *  - 아직 로그인 전·확인 중 → 사용자가 있으면 로그인 상태로, 없으면 비로그인 상태로
 */
import { fetchMe, type SessionUser } from "@/entities/session";
import { handleSessionEnded } from "@/shared/api";
import { reloadPage } from "./browser-navigation";
import { useSessionStore } from "./session-store";

let inflight: Promise<void> | null = null;

function sameUser(a: SessionUser, b: SessionUser): boolean {
  return (
    a.userId === b.userId &&
    a.userNm === b.userNm &&
    a.userSe === b.userSe &&
    a.passwordChangeRequired === b.passwordChangeRequired &&
    a.features.length === b.features.length &&
    a.features.every((code, index) => b.features[index] === code)
  );
}

function applyFetchedUser(me: SessionUser | null): void {
  const { status, user, setUser, clear } = useSessionStore.getState();
  if (status === "authenticated" && user) {
    if (!me) {
      handleSessionEnded();
      return;
    }
    if (me.userId !== user.userId) {
      reloadPage();
      return;
    }
    if (!sameUser(user, me)) setUser(me);
    return;
  }
  if (me) setUser(me);
  else clear();
}

/** 세션을 다시 확인해 store에 반영한다. 서버에 닿지 못하면(네트워크 오류) 판단하지 않는다. */
// @MX:ANCHOR: [AUTO] refreshSession - 세션 재확인 단일 진입점(시작·포커스·화면 이동·403·비밀번호 변경·관리자 자기 수정)
// @MX:REASON: 계정 전환 감지(reload)·만료 감지(handleSessionEnded)·권한 갱신 판단이 여기 집중 — fetchMe 결과를 store에 직접 넣지 말 것
export function refreshSession(): Promise<void> {
  if (inflight) return inflight;
  const startUser = useSessionStore.getState().user;
  inflight = (async () => {
    try {
      let me: SessionUser | null;
      try {
        me = await fetchMe();
      } catch {
        // 서버에 닿지 못함: 시작 확인 중이었다면 로그인 화면으로, 로그인 상태면 그대로 둔다.
        if (useSessionStore.getState().status === "loading") useSessionStore.getState().clear();
        return;
      }
      // 확인하는 사이 로그인 화면에서 새로 로그인했으면(사용자 교체) 이 결과는 낡았다 → 버린다.
      if (useSessionStore.getState().user !== startUser) return;
      applyFetchedUser(me);
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}
