import { useId, useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Info, KeyRound, Lock } from "lucide-react"
import { toast } from "sonner"

import {
  PASSWORD_MAX_BYTES,
  PASSWORD_MESSAGES,
  PASSWORD_MIN_LENGTH,
  changePassword,
  passwordRuleError,
} from "@/entities/session"
import {
  AuthFormError,
  AuthPasswordField,
  AuthScreen,
  AuthSubmitButton,
  authErrorMessage,
  firstAllowedPath,
  logoutAndReload,
  refreshSession,
  useSessionStore,
} from "@/features/auth"

/** 화면에서 먼저 막는 검사(설계서 §3 문구). 통과하면 `null`. */
function validate(current: string, next: string, confirm: string): string | null {
  if (!current) return "현재 비밀번호를 입력하세요"
  const rule = passwordRuleError(next)
  if (rule) return rule
  if (next !== confirm) return PASSWORD_MESSAGES.mismatch
  if (next === current) return PASSWORD_MESSAGES.sameAsCurrent
  return null
}

/**
 * 비밀번호 변경 `/password`(설계서 §7) — 로그인 화면과 같은 카드. 관리자가 초기화한 임시
 * 비밀번호로 로그인하면 이 화면으로 강제 이동한다. 성공하면 세션을 다시 읽어(변경 필요 표시 해제)
 * 허용된 첫 화면으로 간다.
 */
export function PasswordChangePage() {
  const navigate = useNavigate()
  const user = useSessionStore((s) => s.user)
  const forced = user?.passwordChangeRequired ?? false
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const errorId = useId()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return

    const invalid = validate(current, next, confirm)
    if (invalid) {
      setError(invalid)
      return
    }

    setError(null)
    setSubmitting(true)
    try {
      await changePassword({ currentPassword: current, newPassword: next })
    } catch (err) {
      setError(authErrorMessage(err))
      setSubmitting(false)
      return
    }

    // 변경 필요 표시가 풀린 세션 정보를 다시 읽는다. 변경 전에 출발한 재확인과 합쳐져
    // 낡은 값이 들어왔으면 한 번 더 읽는다.
    await refreshSession()
    if (useSessionStore.getState().user?.passwordChangeRequired) await refreshSession()

    toast.success("비밀번호가 변경되었습니다")
    navigate(firstAllowedPath(useSessionStore.getState().user) ?? "/", { replace: true })
  }

  const handleSecondary = () => {
    if (forced) {
      void logoutAndReload()
      return
    }
    navigate(firstAllowedPath(user) ?? "/", { replace: true })
  }

  const describedBy = error ? errorId : undefined

  return (
    <AuthScreen
      title="비밀번호 변경"
      description={
        user ? (
          <>
            <span className="text-[#C7CEDB]">{user.userNm}</span>
            <span className="ml-1.5 font-mono text-[12px] text-[#5B6B85]">{user.userId}</span>
          </>
        ) : null
      }
    >
      {forced && (
        <div className="mb-5 flex items-start gap-2 rounded-md border border-[#F59E0B]/35 bg-[#F59E0B]/10 px-3 py-2.5 text-[12px] leading-snug text-[#FBBF24]">
          <Info className="mt-0.5 size-4 shrink-0 text-[#F59E0B]" aria-hidden="true" />
          <span>임시 비밀번호로 로그인했습니다. 새 비밀번호를 설정해야 계속 사용할 수 있습니다.</span>
        </div>
      )}

      <form aria-label="비밀번호 변경" noValidate onSubmit={handleSubmit} className="space-y-5">
        <AuthPasswordField
          id="password-current"
          label="현재 비밀번호"
          icon={Lock}
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
          autoFocus
          aria-describedby={describedBy}
        />
        <AuthPasswordField
          id="password-new"
          label="새 비밀번호"
          icon={KeyRound}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          autoComplete="new-password"
          hint={`${PASSWORD_MIN_LENGTH}자 이상, UTF-8 기준 ${PASSWORD_MAX_BYTES}바이트 이하(한글 1자 = 3바이트)`}
          aria-describedby={describedBy}
        />
        <AuthPasswordField
          id="password-confirm"
          label="새 비밀번호 확인"
          icon={KeyRound}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          aria-describedby={describedBy}
        />

        <div className="space-y-3 pt-1">
          <AuthFormError id={errorId} message={error} />
          <AuthSubmitButton label="비밀번호 변경" busyLabel="변경 중…" busy={submitting} />
          <button
            type="button"
            onClick={handleSecondary}
            className="block w-full rounded-md py-1.5 text-center text-[12px] text-[#8A93A6] transition-colors outline-none hover:text-[#E5E9F0] focus-visible:text-[#E5E9F0] focus-visible:ring-[3px] focus-visible:ring-[#3B82F6]/45"
          >
            {forced ? "로그아웃" : "취소"}
          </button>
        </div>
      </form>
    </AuthScreen>
  )
}
