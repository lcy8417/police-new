import { useState, type ReactNode } from "react"
import { toast } from "sonner"

import { PASSWORD_MESSAGES, passwordRuleError } from "@/entities/session"
import { LoginScreen } from "@/widgets/login-screen"

import { DevScreenFrame, devScreen, useDevCase, useDevNavigate } from "../frame"
import { LOCKED_MESSAGE, LOGIN_FAILED_MESSAGE, MOCK_ACCOUNT } from "./mock-cases"

const info = devScreen("s00")

// 로그인 화면은 위쪽 진열 막대(30px)를 뺀 나머지 높이를 채운다
function Stage({ children }: { children: ReactNode }) {
  return <div className="flex min-h-[calc(100vh-30px)] flex-col">{children}</div>
}

// S00 로그인 진열 페이지: 케이스(ready · loading · failed · locked · error · password-change)로 상태를 바꿔 본다.
// 입력 값은 여기서 들고(제어형), 제출은 검사 문구를 보이거나 다음 진열 화면으로 이동한다.
export function S00DevPage() {
  const to = useDevNavigate()
  const activeCase = useDevCase(info.cases, "ready")
  const [userId, setUserId] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(true)
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  // 입력 검사 문구는 만든 케이스에서만 보인다(케이스를 바꾸면 사라짐)
  const [local, setLocal] = useState<{ at: string; message: string } | null>(null)
  const localError = local && local.at === activeCase ? local.message : null
  const setLocalError = (message: string | null) => setLocal(message === null ? null : { at: activeCase, message })

  const fixed =
    activeCase === "failed" ? LOGIN_FAILED_MESSAGE : activeCase === "locked" ? LOCKED_MESSAGE : null
  const errorMessage = localError ?? fixed
  const status = activeCase === "loading" ? "loading" : activeCase === "error" ? "error" : "ready"
  const common = {
    status,
    errorMessage: activeCase === "error" ? localError : errorMessage,
    errorAt: "14:05",
    onRetry: () => {
      setLocalError(null)
      toast("다시 시도합니다(진열용)")
      to("/dev/s00", { case: "ready" })
    },
  } as const

  if (activeCase === "password-change") {
    const handleSubmit = () => {
      if (!current) return setLocalError("현재 비밀번호를 입력하세요")
      const rule = passwordRuleError(next)
      if (rule) return setLocalError(rule)
      if (next !== confirm) return setLocalError(PASSWORD_MESSAGES.mismatch)
      if (next === current) return setLocalError(PASSWORD_MESSAGES.sameAsCurrent)
      setLocalError(null)
      toast.success("비밀번호가 변경되었습니다")
      to("/dev/s01")
    }
    return (
      <DevScreenFrame screen={info.screen} title={info.title} cases={info.cases} bare>
        <Stage>
        <LoginScreen
          {...common}
          mode="password-change"
          currentPassword={current}
          onCurrentPasswordChange={setCurrent}
          newPassword={next}
          onNewPasswordChange={setNext}
          confirmPassword={confirm}
          onConfirmPasswordChange={setConfirm}
          forced
          account={MOCK_ACCOUNT}
          onSecondary={() => to("/dev/s00", { case: "ready" })}
          onSubmit={handleSubmit}
        />
        </Stage>
      </DevScreenFrame>
    )
  }

  const handleSubmit = () => {
    if (!userId.trim() || !password) return setLocalError("아이디와 비밀번호를 입력하세요")
    setLocalError(null)
    toast.success("로그인 시안 — 사건관리로 이동합니다")
    to("/dev/s01")
  }

  return (
    <DevScreenFrame screen={info.screen} title={info.title} cases={info.cases} bare>
      <Stage>
      <LoginScreen
        {...common}
        mode="login"
        userId={userId}
        onUserIdChange={setUserId}
        password={password}
        onPasswordChange={setPassword}
        remember={remember}
        onRememberChange={setRemember}
        onSubmit={handleSubmit}
      />
      </Stage>
    </DevScreenFrame>
  )
}
