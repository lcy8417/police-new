/**
 * 공용 백엔드 요청 함수 — 앱의 모든 서버 요청(API·보호된 이미지)이 이 한 곳을 지난다.
 *
 * 왜 하나로 모으나(설계서 §3·§7):
 *  - 로그인 세션은 `httpOnly` 쿠키라, 매 요청에 `credentials: "include"`를 붙여야 한다.
 *  - 어느 요청이든 401(세션 끝남)이면 페이지 전체를 새로 불러 `/login?from=<원래 주소>`로
 *    보낸다. 전체 새로고침이라 이전 계정의 진행 중 요청·쿼리 캐시·전역 상태가 한 번에 끊긴다.
 *  - 403(권한 바뀜)이면 `forbidden` 이벤트를 내서, 세션 담당(`SessionProvider`)이
 *    `/auth/me`를 다시 읽어 메뉴·화면 권한을 갱신하게 한다.
 */

/** 세션 종료 시 이동 함수 — 기본은 전체 새로고침 이동, 테스트는 바꿔 끼운다. */
export type SessionEndedHandler = (loginUrl: string) => void;

/** 403 응답 정보 — `detail`은 서버 문구(문자열일 때만, 예 `"비밀번호를 변경해야 합니다"`). */
export interface ForbiddenInfo {
  status: 403;
  detail: string | null;
}

type ForbiddenHandler = (info: ForbiddenInfo) => void;

/**
 * 401·403을 "세션 끝남/권한 바뀜"으로 해석하지 않는 경로.
 * - `/auth/login`: 401 = 아이디·비밀번호 틀림, 403 = 사용 중지 계정(화면이 문구를 보여 줌).
 * - `/auth/me`: 세션 확인 자체라 호출부가 결과를 직접 처리한다(403 이벤트를 내면
 *   `SessionProvider`의 재확인이 다시 `/auth/me`를 불러 끝없이 반복될 수 있음).
 */
const SESSION_CHECK_PATHS = new Set(["/auth/login", "/auth/me"]);

const defaultSessionEndedHandler: SessionEndedHandler = (loginUrl) => {
  window.location.assign(loginUrl);
};

let sessionEndedHandler: SessionEndedHandler = defaultSessionEndedHandler;
/** 이미 로그인 화면으로 보내는 중이면 true — 여러 요청이 동시에 401이어도 이동은 한 번만. */
let sessionEnding = false;
const forbiddenHandlers = new Set<ForbiddenHandler>();
let revalidating: Promise<void> | null = null;

/** 호출 시점의 `VITE_API_URL`(끝 `/` 제거). 비우면 같은 주소 중계(상대 경로). */
export function apiBaseUrl(): string {
  return (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
}

/** 쿼리·해시를 뗀 경로 — 예외 경로 비교용. */
function pathOnly(path: string): string {
  return path.split(/[?#]/, 1)[0];
}

/** 테스트용: 세션 종료 이동 함수를 바꾼다(`null`이면 기본값). 중복 방지 상태도 초기화한다. */
export function setSessionEndedHandler(handler: SessionEndedHandler | null): void {
  sessionEndedHandler = handler ?? defaultSessionEndedHandler;
  sessionEnding = false;
}

/**
 * 세션이 끝났을 때(401, 로그아웃 후 재확인 실패 등) 로그인 화면으로 전체 새로고침 이동한다.
 * `from`에는 지금 주소(경로 + 쿼리)를 담아 다시 로그인하면 돌아오게 한다. 두 번째 호출부터는 무시.
 */
export function handleSessionEnded(): void {
  if (sessionEnding) return;
  sessionEnding = true;
  const { pathname, search } = window.location;
  // 이미 로그인 화면이면 기존 `from`을 그대로 둔다(`from`이 겹겹이 쌓이지 않게).
  const loginUrl =
    pathname === "/login"
      ? `/login${search}`
      : `/login?from=${encodeURIComponent(pathname + search)}`;
  sessionEndedHandler(loginUrl);
}

/** 403 이벤트 구독. 반환 함수를 부르면 구독 해제. */
export function onForbidden(handler: ForbiddenHandler): () => void {
  forbiddenHandlers.add(handler);
  return () => {
    forbiddenHandlers.delete(handler);
  };
}

/** 403 이벤트를 구독자 전체에 알린다. */
export function emitForbidden(info: ForbiddenInfo): void {
  for (const handler of [...forbiddenHandlers]) handler(info);
}

/** 403 본문의 `detail` 문자열을 복제본에서 읽는다(원래 응답 본문은 호출부 몫으로 보존). */
async function readForbiddenDetail(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.clone().json();
    if (body && typeof body === "object" && "detail" in body && typeof body.detail === "string") {
      return body.detail;
    }
  } catch {
    // 본문이 JSON이 아니면 문구 없이 알린다.
  }
  return null;
}

/**
 * 백엔드 요청. `path`는 루트 기준 상대 경로(`/crime/...`)만 받는다 — 절대 주소·`//host`를
 * 막아 쿠키가 다른 서버로 새지 않게 한다. 응답 객체는 상태와 무관하게 그대로 돌려준다
 * (`ok` 판정·오류 문구는 호출부 몫).
 */
// @MX:ANCHOR: [AUTO] backendFetch - 앱의 모든 백엔드 요청(apiGet/apiSend·services/*.js·match-api·이미지 로더)이 지나는 단일 fetch
// @MX:REASON: 쿠키 전송·401 세션 종료·403 권한 재확인 계약이 여기 집중 — 우회하면 세션 만료가 감지되지 않는다
export async function backendFetch(path: string, init?: RequestInit): Promise<Response> {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error(`backendFetch는 루트 기준 상대 경로만 받습니다: ${path}`);
  }

  const response = await fetch(`${apiBaseUrl()}${path}`, { ...init, credentials: "include" });
  const isSessionCheck = SESSION_CHECK_PATHS.has(pathOnly(path));

  if (response.status === 401 && !isSessionCheck) {
    handleSessionEnded();
  } else if (response.status === 403 && !isSessionCheck) {
    emitForbidden({ status: 403, detail: await readForbiddenDetail(response) });
  }

  return response;
}

/**
 * 세션이 아직 살아 있는지 `GET /auth/me`로 한 번 확인하고, 끝났으면(401) 로그인 화면으로 보낸다.
 * `<img>`처럼 응답 상태를 볼 수 없는 이미지 로드가 실패했을 때 부른다. 동시에 여러 번 불러도
 * 요청은 하나로 합친다(진행 중이면 같은 Promise 반환). 네트워크 오류는 조용히 무시한다.
 */
export function revalidateSession(): Promise<void> {
  if (revalidating) return revalidating;
  revalidating = (async () => {
    try {
      const response = await backendFetch("/auth/me");
      if (response.status === 401) handleSessionEnded();
    } catch {
      // 서버에 닿지 못하면 세션 판단을 하지 않는다(다음 요청이 다시 판단).
    } finally {
      revalidating = null;
    }
  })();
  return revalidating;
}
