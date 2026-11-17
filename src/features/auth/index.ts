// features/auth — 로그인 세션 상태·세션 재확인·라우트 가드(설계서 §2·§7).
export { useSessionStore, hasFeature, hasAnyFeature, isAdmin, type SessionStatus } from "./model/session-store";
export {
  CASES_ROUTE_FEATURES,
  CASE_VIEW_FEATURES,
  FEATURE_ROUTES,
  LOGIN_PATH,
  PASSWORD_PATH,
  firstAllowedPath,
  postLoginPath,
  safeInternalPath,
} from "./model/feature-routes";
export { refreshSession } from "./model/session-refresh";
export { logoutAndReload } from "./model/logout";
export {
  assignPage,
  reloadPage,
  setBrowserNavigation,
  type BrowserNavigation,
} from "./model/browser-navigation";
export { SessionProvider } from "./ui/SessionProvider";
export { RequireAuth } from "./ui/RequireAuth";
export { RequireFeature } from "./ui/RequireFeature";
export { RequireAdmin } from "./ui/RequireAdmin";
export { NoPermissionNotice } from "./ui/NoPermissionNotice";
export { FirstAllowedRedirect } from "./ui/FirstAllowedRedirect";
export { SessionLoadingScreen } from "./ui/SessionLoadingScreen";
export { authErrorMessage } from "./model/error-message";
export { AuthScreen } from "./ui/AuthScreen";
export {
  AuthFormError,
  AuthPasswordField,
  AuthSubmitButton,
  AuthTextField,
} from "./ui/AuthFields";
