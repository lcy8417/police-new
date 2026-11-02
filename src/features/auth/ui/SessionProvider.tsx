import { useEffect, useRef, type ReactNode } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"

import { useCrimeStore } from "@/entities/crime"
import { FEATURES } from "@/entities/session"
import { onForbidden } from "@/shared/api"

import { reloadPage } from "../model/browser-navigation"
import { LOGIN_PATH, PASSWORD_PATH, postLoginPath } from "../model/feature-routes"
import { refreshSession } from "../model/session-refresh"
import { hasFeature, useSessionStore } from "../model/session-store"
import { PROTECTED_ROOT_SELECTOR } from "./RequireAuth"
import { SessionLoadingScreen } from "./SessionLoadingScreen"

/** 서버가 비밀번호 변경 전 요청을 막을 때 주는 403 문구. */
const PASSWORD_CHANGE_DETAIL = "비밀번호를 변경해야 합니다"

interface SessionProviderProps {
  children: ReactNode
}

/**
 * 로그인 세션 담당(`BrowserRouter` 안, `App` 바깥).
 *
 * - 시작 시 `GET /auth/me`로 세션 복원(확인 중에는 전체 화면 로딩)
 * - 창 포커스·화면 이동·403 때 세션 재확인(`refreshSession` — 동시 호출은 하나로 합침)
 * - 403 `"비밀번호를 변경해야 합니다"` → `/password`
 * - 이미 로그인된 채 `/login`에 오면 첫 화면으로(같은 문서에서 다른 계정 로그인 금지)
 * - 뒤로 가기 캐시(bfcache): `pagehide`에 보호 화면을 숨기고, 되살아나면(`persisted`) 새로고침
 * - 사건 목록 로딩 자격(로그인 + 비밀번호 변경 완료 + 사건 조회 권한)이 생기면 목록을 부르고,
 *   사라지면 비운다
 */
// @MX:ANCHOR: [AUTO] SessionProvider - 세션 복원·재확인·계정 전환·bfcache·사건 목록 자격을 한곳에서 관리(main.jsx에서 App을 감쌈)
// @MX:REASON: 화면마다 세션을 따로 확인하면 계정 전환·권한 회수 감지가 어긋난다 — 이 컴포넌트가 단일 담당
export function SessionProvider({ children }: SessionProviderProps) {
  const status = useSessionStore((s) => s.status)
  const user = useSessionStore((s) => s.user)
  const location = useLocation()
  const navigate = useNavigate()
  // 403 구독은 한 번만 걸고, 그 안에서는 항상 최신 navigate를 쓴다.
  const navigateRef = useRef(navigate)
  useEffect(() => {
    navigateRef.current = navigate
  }, [navigate])

  // 시작 시 세션 복원 + 창 포커스 재확인 + 403 재확인 + bfcache.
  useEffect(() => {
    void refreshSession()

    const handleFocus = () => {
      void refreshSession()
    }
    const handlePageHide = () => {
      document.querySelectorAll(PROTECTED_ROOT_SELECTOR).forEach((el) => el.classList.add("invisible"))
    }
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) reloadPage()
    }
    const unsubscribeForbidden = onForbidden((info) => {
      if (info.detail === PASSWORD_CHANGE_DETAIL) navigateRef.current(PASSWORD_PATH, { replace: true })
      void refreshSession()
    })

    window.addEventListener("focus", handleFocus)
    window.addEventListener("pagehide", handlePageHide)
    window.addEventListener("pageshow", handlePageShow)
    return () => {
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("pagehide", handlePageHide)
      window.removeEventListener("pageshow", handlePageShow)
      unsubscribeForbidden()
    }
  }, [])

  // 화면 이동 시 재확인(첫 렌더 제외, 로그인 상태일 때만).
  const firstPathRef = useRef(true)
  useEffect(() => {
    if (firstPathRef.current) {
      firstPathRef.current = false
      return
    }
    if (useSessionStore.getState().status === "authenticated") void refreshSession()
  }, [location.pathname])

  // 사건 목록 로딩 자격: false→true(또는 사용자 교체) 때 1회 로딩, true→false 때 비움.
  const eligible =
    status === "authenticated" &&
    !!user &&
    !user.passwordChangeRequired &&
    hasFeature(user, FEATURES.CRIME_SEARCH)
  const userId = user?.userId ?? null
  const prevEligibilityRef = useRef<{ eligible: boolean; userId: string | null }>({
    eligible: false,
    userId: null,
  })
  useEffect(() => {
    const before = prevEligibilityRef.current
    prevEligibilityRef.current = { eligible, userId }
    if (eligible && (!before.eligible || before.userId !== userId)) {
      void useCrimeStore.getState().refetch()
    } else if (!eligible && before.eligible) {
      useCrimeStore.getState().reset()
    }
  }, [eligible, userId])

  if (status === "loading") return <SessionLoadingScreen />

  if (status === "authenticated" && user && location.pathname === LOGIN_PATH) {
    return <Navigate to={postLoginPath(user, location.search)} replace />
  }

  return <>{children}</>
}
