import { useId, useState, type FormEvent, type ReactNode } from "react"
import { Eye, EyeOff, Info, KeyRound, Lock, UserRound, type LucideIcon } from "lucide-react"

import { PASSWORD_MAX_BYTES, PASSWORD_MIN_LENGTH } from "@/entities/session"
import { Button, Field, GlowOrb, InlineError } from "@/shared/ui/kit"
import { Panel } from "@/shared/ui/panel"

import type { LoginScreenProps } from "../model/types"

const NETWORK_ERROR = "서버에 연결할 수 없습니다. 잠시 후 다시 시도하세요"

// 라벨 + 왼쪽 아이콘 + (비밀번호면) 표시 토글이 붙은 큰 입력 칸(시안 S00 `field()`: 높이 42).
function AuthField({
  id,
  label,
  icon: Icon,
  hint,
  secret = false,
  invalid,
  value,
  onChange,
  autoComplete,
  autoFocus,
  maxLength,
}: {
  id: string
  label: string
  icon: LucideIcon
  hint?: ReactNode
  secret?: boolean
  invalid: boolean
  value: string
  onChange: (value: string) => void
  autoComplete: string
  autoFocus?: boolean
  maxLength?: number
}) {
  const [visible, setVisible] = useState(false)
  const ToggleIcon = visible ? EyeOff : Eye
  return (
    <div className="grid gap-[6px]">
      <label htmlFor={id} className="text-[12.5px] font-semibold text-fg-2">
        {label}
      </label>
      <div className="relative">
        <Icon aria-hidden="true" className="pointer-events-none absolute top-1/2 left-[12px] size-[15px] -translate-y-1/2 text-dim" />
        <Field
          id={id}
          type={secret && !visible ? "password" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          maxLength={maxLength}
          spellCheck={false}
          autoCapitalize="none"
          invalid={invalid}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={`h-[42px] pl-[36px] text-[14px] ${secret ? "pr-[40px]" : ""}`}
        />
        {secret && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={`${label} ${visible ? "숨기기" : "표시"}`}
            aria-controls={id}
            className="absolute top-1/2 right-[6px] grid size-[30px] -translate-y-1/2 cursor-pointer place-items-center rounded-[6px] border-0 bg-transparent text-dim hover:text-fg-2"
          >
            <ToggleIcon aria-hidden="true" className="size-[15px]" />
          </button>
        )}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="m-0 text-[11px] text-dim">
          {hint}
        </p>
      )}
    </div>
  )
}

/**
 * S00 로그인 · 비밀번호 변경(같은 카드의 두 상태). 셸 밖 전체 화면이라 바탕은 이 화면이 그린다.
 * 값은 모두 props(제어형)이고 서버 호출은 없다. 거절 문구는 서버가 준 그대로 InlineError 로 보인다.
 * 시안의 AI 시연 · 지난 로그인 · 내부망 안내 · 역할별 첫 화면은 담지 않는다(spec §5-3).
 */
export function LoginScreen(props: LoginScreenProps) {
  const { status, errorMessage, errorAt, onRetry, onSubmit } = props
  const baseId = useId()
  const busy = status === "loading"
  const isLogin = props.mode === "login"

  // error = 서버에 닿지 못함(다시 시도), 그 밖의 거절 문구는 칸을 고쳐 다시 제출한다
  const message = status === "error" ? (errorMessage ?? NETWORK_ERROR) : errorMessage
  const invalid = message !== null

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!busy) onSubmit()
  }

  const title = isLogin ? "족적 감정 플랫폼" : "비밀번호 변경"
  const titleId = `${baseId}-title`

  return (
    <main className="relative flex flex-1 w-full items-center justify-center overflow-hidden bg-canvas px-[16px] py-[40px] text-foreground">
      <GlowOrb className="-top-40 left-[8%] h-[28rem] w-[28rem] bg-brand-3/15" />
      <GlowOrb className="-right-24 -bottom-32 h-96 w-96 bg-ai/10" />

      <div className="relative w-full max-w-[400px]">
        <Panel corners aria-labelledby={titleId} role="region" className="px-[32px] pt-[36px] pb-[32px]">
          <header className="mb-[24px]">
            <div className="mb-[18px] grid size-[40px] place-items-center rounded-[10px] border border-solid border-brand-line bg-brand-bg text-brand">
              <Lock aria-hidden="true" className="size-[16px]" />
            </div>
            <p className="m-0 font-code text-[10px] font-semibold tracking-[0.28em] text-brand">FORENSIC FOOTWEAR PLATFORM</p>
            <h1 id={titleId} className="mt-[8px] mb-0 text-[20px] font-semibold">
              {title}
            </h1>
            <div className="mt-[4px] text-[12.5px] text-muted-foreground">
              {isLogin ? (
                "등록된 계정으로 로그인하세요."
              ) : props.account ? (
                <>
                  <span className="text-fg-2">{props.account.userNm}</span>
                  <span className="ml-[6px] font-code text-[12px] text-dim">{props.account.userId}</span>
                </>
              ) : null}
            </div>
          </header>

          {!isLogin && props.forced && (
            <div className="mb-[18px] flex items-start gap-[8px] rounded-[8px] border border-solid border-warn-line bg-warn-bg px-[12px] py-[10px] text-[12px] leading-snug text-warn">
              <Info aria-hidden="true" className="mt-[2px] size-[15px] shrink-0" />
              <span>임시 비밀번호로 로그인했습니다. 새 비밀번호를 설정해야 계속 사용할 수 있습니다.</span>
            </div>
          )}

          <form aria-label={isLogin ? "로그인" : "비밀번호 변경"} aria-busy={busy} noValidate onSubmit={handleSubmit} className="grid gap-[14px]">
            {props.mode === "login" ? (
              <>
                <AuthField
                  id={`${baseId}-user`}
                  label="아이디"
                  icon={UserRound}
                  value={props.userId}
                  onChange={props.onUserIdChange}
                  autoComplete="username"
                  maxLength={20}
                  invalid={invalid}
                />
                <AuthField
                  id={`${baseId}-pw`}
                  label="비밀번호"
                  icon={Lock}
                  secret
                  value={props.password}
                  onChange={props.onPasswordChange}
                  autoComplete="current-password"
                  invalid={invalid}
                />
                <label className="flex w-fit cursor-pointer items-center gap-[6px] text-[12px] text-muted-foreground select-none">
                  <input
                    type="checkbox"
                    checked={props.remember}
                    onChange={(e) => props.onRememberChange(e.target.checked)}
                    className="size-[14px] cursor-pointer accent-brand-2"
                  />
                  아이디 저장
                </label>
              </>
            ) : (
              <>
                <AuthField
                  id={`${baseId}-cur`}
                  label="현재 비밀번호"
                  icon={Lock}
                  secret
                  value={props.currentPassword}
                  onChange={props.onCurrentPasswordChange}
                  autoComplete="current-password"
                  invalid={invalid}
                />
                <AuthField
                  id={`${baseId}-new`}
                  label="새 비밀번호"
                  icon={KeyRound}
                  secret
                  value={props.newPassword}
                  onChange={props.onNewPasswordChange}
                  autoComplete="new-password"
                  hint={`${PASSWORD_MIN_LENGTH}자 이상, UTF-8 기준 ${PASSWORD_MAX_BYTES}바이트 이하(한글 1자 = 3바이트)`}
                  invalid={invalid}
                />
                <AuthField
                  id={`${baseId}-confirm`}
                  label="새 비밀번호 확인"
                  icon={KeyRound}
                  secret
                  value={props.confirmPassword}
                  onChange={props.onConfirmPasswordChange}
                  autoComplete="new-password"
                  invalid={invalid}
                />
              </>
            )}

            {message !== null && (
              <div role="alert" aria-live="assertive" className="rounded-[8px] border border-solid border-line-3 bg-strip px-[12px] py-[8px]">
                <InlineError message={message} at={status === "error" ? errorAt : undefined} onRetry={status === "error" ? onRetry : undefined} />
              </div>
            )}

            <Button type="submit" variant="pri" disabled={busy} aria-busy={busy} className="h-[42px] w-full justify-center text-[14px] font-semibold">
              {isLogin ? (busy ? "로그인 중…" : "로그인") : busy ? "변경 중…" : "비밀번호 변경"}
            </Button>
            {!isLogin && (
              <button
                type="button"
                onClick={props.onSecondary}
                className="cursor-pointer border-0 bg-transparent py-[6px] text-center text-[12px] text-muted-foreground hover:text-foreground"
              >
                {props.forced ? "로그아웃" : "취소"}
              </button>
            )}
          </form>
        </Panel>

        <p className="mt-[20px] mb-0 text-center text-[11px] text-dim">인가된 사용자만 접근할 수 있으며, 모든 사용 기록이 저장됩니다.</p>
      </div>
    </main>
  )
}
