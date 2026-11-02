/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * 백엔드 주소. 비우면(권장) 같은 주소 중계 — 모든 백엔드 URL이 상대 경로(`/crime/...`)가 된다.
   * 읽는 곳은 `shared/api/backend-fetch.ts`의 `apiBaseUrl()` 한 곳뿐.
   */
  readonly VITE_API_URL?: string;
  /** 개발/미리보기 서버의 중계 대상(vite.config.js 전용, 앱 코드는 읽지 않음). */
  readonly VITE_PROXY_TARGET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
