import { useId, useRef, useState, type FormEvent } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Lock, UserRound } from "lucide-react"

import { login } from "@/entities/session"
import {
  AuthFormError,
  AuthPasswordField,
  AuthScreen,
  AuthSubmitButton,
  AuthTextField,
  authErrorMessage,
  postLoginPath,
  useSessionStore,
} from "@/features/auth"

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

/**
 * 로그인 화면 `/login`(설계서 §7) — 앱 셸 없이 전체 화면 카드 1장.
 * 성공하면 세션 store를 채우고 `from`(같은 사이트 내부 경로만) 또는 허용된 첫 화면으로 간다.
 * 비밀번호 변경이 필요한 계정은 `/password`로. 이미 로그인된 상태면 `SessionProvider`가
 * 이 화면을 열지 않고 첫 화면으로 보낸다(같은 문서에서 다른 계정 로그인 금지).
 */
export function LoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [initialUserId] = useState(readRememberedUserId)
  const [userId, setUserId] = useState(initialUserId)
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(initialUserId !== "")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const passwordRef = useRef<HTMLInputElement>(null)
  const errorId = useId()
  const rememberId = useId()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return

    const trimmedId = userId.trim()
    if (!trimmedId || !password) {
      setError("아이디와 비밀번호를 입력하세요")
      return
    }

    setError(null)
    setSubmitting(true)
    try {
      const user = await login({ userId: trimmedId, password })
      writeRememberedUserId(remember ? trimmedId : null)
      useSessionStore.getState().setUser(user)
      navigate(postLoginPath(user, location.search), { replace: true })
    } catch (err) {
      setError(authErrorMessage(err))
      setPassword("")
      setSubmitting(false)
      passwordRef.current?.focus()
    }
  }

  const invalid = error !== null

  return (
    <AuthScreen title="족적 감정 플랫폼" description="등록된 계정으로 로그인하세요.">
      <form aria-label="로그인" noValidate onSubmit={handleSubmit} className="space-y-5">
        <AuthTextField
          id="login-user-id"
          label="아이디"
          icon={UserRound}
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={20}
          autoFocus={initialUserId === ""}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
        />

        <AuthPasswordField
          ref={passwordRef}
          id="login-password"
          label="비밀번호"
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          autoFocus={initialUserId !== ""}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
        />

        <label
          htmlFor={rememberId}
          className="flex w-fit cursor-pointer items-center gap-2 text-[12px] text-[#A9B3C4] select-none"
        >
          <input
            id={rememberId}
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="size-4 cursor-pointer rounded border-[#26334A] accent-[#3B82F6] outline-none focus-visible:ring-[3px] focus-visible:ring-[#3B82F6]/45"
          />
          아이디 저장
        </label>

        <div className="space-y-3 pt-1">
          <AuthFormError id={errorId} message={error} />
          <AuthSubmitButton label="로그인" busyLabel="로그인 중…" busy={submitting} />
        </div>
      </form>
    </AuthScreen>
  )
}
