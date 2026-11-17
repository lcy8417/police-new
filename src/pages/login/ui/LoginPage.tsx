import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { login } from "@/entities/session"
import { authErrorMessage, postLoginPath, useSessionStore } from "@/features/auth"
import { LoginScreen } from "@/widgets/login-screen"
import { ApiError } from "@/shared/api"
import { formatKstDateTime } from "@/shared/lib"

/** "아이디 저장" localStorage 키. 비밀번호는 절대 저장하지 않는다. */
const REMEMBER_KEY = "police.rememberedUserId"

/** 저장된 아이디(사생활 보호 모드 등으로 저장소를 못 쓰면 빈 값). */
function readRememberedUserId(): string {
  try {
    return window.localStorage.getItem(REMEMBER_KEY) ?? ""
  } catch {
    return ""
  }
}

/** 아이디를 저장하거나(`userId`) 지운다(`null`). 저장소를 못 쓰면 조용히 넘어간다. */
function writeRememberedUserId(userId: string | null): void {
  try {
    if (userId) window.localStorage.setItem(REMEMBER_KEY, userId)
    else window.localStorage.removeItem(REMEMBER_KEY)
  } catch {
    // 저장 실패는 로그인 자체와 무관하다.
  }
}

const nowHhmm = () => formatKstDateTime(new Date().toISOString()).slice(11, 16)

/**
 * 로그인 화면 `/login`(설계서 §7) — S00 로그인 위젯(`LoginScreen`, 1차 모양 — 시연 · 소개 등 신규 요소는 끔).
 * 성공하면 세션 store를 채우고 `from`(같은 사이트 내부 경로만) 또는 허용된 첫 화면으로 간다.
 * 비밀번호 변경이 필요한 계정은 `/password`로. 서버 거절 문구(401 불일치 · 423 잠금 …)는 그대로,
 * 서버에 닿지 못했으면 「다시」 줄. 남은 시도 · 지난 로그인은 서버가 주지 않아 그리지 않는다.
 */
export function LoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [userId, setUserId] = useState(readRememberedUserId)
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(() => readRememberedUserId() !== "")
  const [message, setMessage] = useState<string | null>(null)
  const [unreachable, setUnreachable] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (submitting) return
    const trimmedId = userId.trim()
    if (!trimmedId || !password) {
      setUnreachable(null)
      setMessage("아이디와 비밀번호를 입력하세요")
      return
    }
    setMessage(null)
    setUnreachable(null)
    setSubmitting(true)
    try {
      const user = await login({ userId: trimmedId, password })
      writeRememberedUserId(remember ? trimmedId : null)
      useSessionStore.getState().setUser(user)
      navigate(postLoginPath(user, location.search), { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        setMessage(authErrorMessage(err))
        setPassword("")
      } else {
        // 서버에 닿지 못함 — 칸은 그대로 두고 「다시」(조회 실패를 거절로 보이지 않는다)
        setUnreachable(nowHhmm())
      }
      setSubmitting(false)
    }
  }

  return (
    <LoginScreen
      mode="login"
      showPlus={false}
      status={submitting ? "loading" : unreachable ? "error" : "ready"}
      errorMessage={unreachable ? null : message}
      errorAt={unreachable ?? undefined}
      onRetry={() => void submit()}
      onSubmit={() => void submit()}
      userId={userId}
      onUserIdChange={setUserId}
      password={password}
      onPasswordChange={setPassword}
      remember={remember}
      onRememberChange={setRemember}
    />
  )
}
