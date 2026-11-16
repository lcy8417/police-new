import { useId, useState, type FormEvent, type ReactNode } from "react"
import { Eye, EyeOff, Info, KeyRound, Lock, Monitor, ShieldCheck, UserRound, type LucideIcon } from "lucide-react"

import { PASSWORD_MAX_BYTES, PASSWORD_MIN_LENGTH } from "@/entities/session"
import { cn } from "@/shared/lib/utils"
import { Button, Chip, Field, InlineError } from "@/shared/ui/kit"
import { Panel } from "@/shared/ui/panel"

import type { LoginScreenProps } from "../model/types"
import { LoginBackdrop } from "./LoginBackdrop"
import { LoginDemo } from "./LoginDemo"

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

/** 위 띠: 기관 표시 + 내부망 연결 · 판(시안 r3 위 띠) */
function AgencyBand() {
  return (
    <header
      data-plus
      className="relative z-[2] flex h-[64px] items-center gap-[12px] border-b border-solid border-line-2 bg-canvas/80 px-[44px] backdrop-blur-md"
    >
      <span
        aria-hidden="true"
        className={
          "grid size-[36px] place-items-center rounded-full text-brand " +
          "bg-[radial-gradient(circle_at_35%_30%,var(--t-emblem-from),var(--t-emblem-to))] " +
          "[box-shadow:0_0_18px_0_var(--t-brand-glow),inset_0_0_0_1px_var(--t-brand-line)]"
        }
      >
        <ShieldCheck className="size-[22px]" strokeWidth={1.7} />
      </span>
      <span className="grid leading-[1.25]">
        <b className="text-[14px]">경찰청 과학수사 · 족윤적 감정 플랫폼</b>
        <span className="font-code text-[10px] font-semibold tracking-[0.22em] text-brand">FORENSIC FOOTWEAR AI PLATFORM</span>
      </span>
      <span className="ml-auto flex items-center gap-[8px] text-[11.5px] text-muted-foreground">
        <Chip>
          <span aria-hidden="true" className="text-ok">
            ●
          </span>
          내부망 연결됨
        </Chip>
        <span className="font-code text-dim">v3.0 · 모델 FP-2025.07</span>
      </span>
    </header>
  )
}

const FLOW = ["현장 족적", "이진화", "문양 추출", "신발 검색", "정밀 대조", "감정서"] as const

/** 이 플랫폼이 무엇인지 — 홍보 문구 대신 하는 일과 처리 순서만(사용자 피드백 2026-11-16) */
function PlatformIntro() {
  return (
    <div
      data-plus
      className="mb-[16px] w-full rounded-[14px] border border-solid border-line-2 bg-panel/75 px-[24px] pt-[18px] pb-[16px] text-center backdrop-blur-md [box-shadow:0_12px_40px_-12px_var(--t-ai-tag-drop)]"
    >
      <h1 className="m-0 text-[24px] leading-[1.3] font-bold tracking-[-0.01em]">족윤적 감정 플랫폼</h1>
      <p className="mx-auto mt-[6px] mb-0 max-w-[36em] text-[13px] leading-[1.6] [text-wrap:balance] text-fg-2">
        현장 족적 이미지로 문양을 추출하고 신발 DB를 검색해 대조합니다. AI는 추천만 하고, 판정은 감정관이 합니다.
      </p>
      <ol aria-label="처리 순서" className="mx-auto mt-[12px] mb-0 flex list-none flex-nowrap items-center justify-center gap-[4px] p-0">
        {FLOW.map((step, i) => (
          <li key={step} className="flex shrink-0 items-center gap-[4px]">
            <Chip className="h-[22px] border-brand-line bg-panel text-[11.5px] text-fg-2">
              <b className="font-code text-[10px] text-brand">{i + 1}</b>
              {step}
            </Chip>
            {i < FLOW.length - 1 && (
              <span aria-hidden="true" className="text-[11px] text-dim">
                →
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}

/**
 * S00 로그인 · 비밀번호 변경(같은 카드의 두 상태). 셸 밖 전체 화면이라 바탕은 이 화면이 그린다.
 * 값은 모두 props(제어형)이고 서버 호출은 없다. 거절 문구는 서버가 준 그대로 보인다.
 * r2: 시안 r3 구성 — 위 띠 · 첫 문장과 목표 숫자 · 「AI 감정 시연」(14초 반복) · 남은 시도 · 지난 로그인 · 내부망 안내 ·
 * 역할별 첫 화면. 이 신규 요소는 모두 `showPlus` 하나로 숨고(`data-plus`), 끄면 1차 모양(가운데 카드 하나)이다.
 */
export function LoginScreen(props: LoginScreenProps) {
  const { status, errorMessage, errorAt, onRetry, onSubmit, showPlus = true } = props
  const baseId = useId()
  const busy = status === "loading"
  const isLogin = props.mode === "login"

  // error = 서버에 닿지 못함(다시 시도), 그 밖의 거절 문구는 칸을 고쳐 다시 제출한다
  const message = status === "error" ? (errorMessage ?? NETWORK_ERROR) : errorMessage
  const invalid = message !== null
  const attempts = props.mode === "login" && showPlus && status !== "error" ? (props.attempts ?? null) : null

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!busy) onSubmit()
  }

  const title = isLogin ? "로그인" : "비밀번호 변경"
  const titleId = `${baseId}-title`
  // 소개(플랫폼 이름)가 있으면 그것이 첫 제목, 없으면(신규 끔) 로그인 카드 제목이 첫 제목.
  const Heading = showPlus ? "h2" : "h1"

  const alert =
    message === null ? null : attempts ? (
      // 시안 핀 2: 빨간 칸 — 서버 문구 + 남은 시도 + 잠금 규칙
      <div
        role="alert"
        aria-live="assertive"
        className="rounded-[8px] border border-solid border-danger/35 bg-danger-bg px-[11px] py-[8px] text-[12px] leading-[1.5] text-fg-2"
      >
        <b className="text-danger">{message}</b>
        <span data-plus>
          {attempts.remaining > 0 && (
            <>
              {" "}
              남은 시도 <b className="tabular-nums">{attempts.remaining}</b>회
            </>
          )}
          <br />
          <span className="text-muted-foreground">{attempts.limit}회 연속 틀리면 잠기고, 관리자만 풀 수 있습니다.</span>
        </span>
      </div>
    ) : (
      <div role="alert" aria-live="assertive" className="rounded-[8px] border border-solid border-line-3 bg-strip px-[12px] py-[8px]">
        <InlineError message={message} at={status === "error" ? errorAt : undefined} onRetry={status === "error" ? onRetry : undefined} />
      </div>
    )

  const card = (
    <Panel
      corners
      aria-labelledby={titleId}
      role="region"
      className={cn(
        "px-[28px] pt-[26px] pb-[20px]",
        // 뒤에 깔린 AI 감정 흐름이 은은하게 비치는 유리 카드
        showPlus &&
          "border-brand-line/60 bg-panel/80 backdrop-blur-xl backdrop-saturate-150 " +
            "[box-shadow:inset_0_1px_0_0_var(--t-panel-edge),0_30px_90px_-10px_var(--t-ai-tag-drop),0_0_0_1px_var(--t-brand-line)]",
      )}
    >
      {showPlus && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-[40px] left-[40px] h-px bg-[linear-gradient(90deg,transparent,var(--t-brand),transparent)] opacity-70"
        />
      )}
      <header className="mb-[18px] flex items-center gap-[12px]">
        <div className="grid size-[40px] shrink-0 place-items-center rounded-[10px] border border-solid border-brand-line bg-brand-bg text-brand [box-shadow:0_0_24px_0_var(--t-brand-glow)]">
          <Lock aria-hidden="true" className="size-[15px]" />
        </div>
        <div className="min-w-0">
          <Heading id={titleId} className="m-0 text-[20px] font-semibold">
            {title}
          </Heading>
          <div className="text-[12.5px] text-muted-foreground">
            {isLogin ? (
              "등록된 계정으로 로그인하세요."
            ) : props.account ? (
              <>
                <span className="text-fg-2">{props.account.userNm}</span>
                <span className="ml-[6px] font-code text-[12px] text-dim">{props.account.userId}</span>
              </>
            ) : null}
          </div>
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
            <div className="flex items-center justify-between gap-[8px] text-[12px] text-muted-foreground">
              <label className="flex w-fit cursor-pointer items-center gap-[6px] select-none">
                <input
                  type="checkbox"
                  checked={props.remember}
                  onChange={(e) => props.onRememberChange(e.target.checked)}
                  className="size-[14px] cursor-pointer accent-brand-2"
                />
                아이디 저장
              </label>
              {showPlus && (
                <span data-plus className="text-[11.5px] text-dim">
                  분실 시 관리자에게 초기화 요청
                </span>
              )}
            </div>
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

        {alert}

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

      {showPlus && props.mode === "login" && (
        <div data-plus className="mt-[16px] grid gap-[6px] border-t border-solid border-line-2 pt-[12px] pr-[18px] text-[11.5px] leading-[1.5] text-dim">
          {props.lastLogin && (
            <span data-plus>
              지난 로그인 <span className="font-code text-fg-2">{props.lastLogin.at}</span> · PC{" "}
              <span className="font-code text-fg-2">{props.lastLogin.ip}</span> · 그 뒤 실패{" "}
              <b className="tabular-nums text-warn">{props.lastLogin.failCount}</b>회
            </span>
          )}
          <span data-plus className="flex items-start gap-[7px] pr-[10px]">
            <Monitor aria-hidden="true" className="mt-[2px] size-[14px] shrink-0 text-brand" />
            <span>
              <b className="text-fg-2">경찰 내부망 전용</b> · 조회·다운로드·출력까지 모든 사용 기록이 저장됩니다.
            </span>
          </span>
        </div>
      )}
    </Panel>
  )

  return (
    <main className="relative min-h-0 w-full flex-1 overflow-x-hidden overflow-y-auto bg-canvas text-foreground">
      <div className="relative min-h-full">
        <LoginBackdrop showPlus={showPlus} />
        {showPlus ? (
          <div className="relative flex min-h-full flex-col">
            <AgencyBand />
            <div className="relative flex flex-1 items-center justify-center px-[24px] py-[40px]">
              {/* 배경: AI 감정 흐름(어떻게 돌아가는지)을 크게 · 흐리게 깔아 둔다. 장식이라 누를 수 없고 화면 낭독기도 건너뛴다. */}
              {props.demoArt && (
                <div
                  data-plus
                  data-login-backdrop-demo
                  aria-hidden="true"
                  inert
                  className={
                    "pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none " +
                    "[mask-image:radial-gradient(ellipse_90%_85%_at_50%_50%,black_55%,transparent_100%)]"
                  }
                >
                  {/* 화면을 가득 채우게 크게(대문짝만하게) — 흐림 없이 투명도만 */}
                  {/* 시연 원래 폭(카드 898px + 여백) 그대로 가운데 두고 1.6배로 키운다 */}
                  <div className="w-[932px] shrink-0 origin-center scale-[1.6] opacity-70">
                    <LoginDemo art={props.demoArt} reducedMotion={props.reducedMotion} />
                  </div>
                </div>
              )}
              {/* 카드 바로 뒤만 살짝 밝혀 글자를 읽기 쉽게 — 배경은 그대로 보이게 약하게 */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-1/2 h-[720px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--t-bg)_55%,transparent),transparent)]"
              />
              <div className="relative z-[1] flex w-full max-w-[640px] flex-col items-center">
                <PlatformIntro />
                <div className="w-full max-w-[420px]">{card}</div>
                <p className="mt-[14px] mb-0 rounded-[8px] bg-panel/70 px-[10px] py-[4px] text-center text-[11px] leading-[1.6] text-dim backdrop-blur-sm">
                  뒤 화면은 AI 감정 흐름 예시입니다 · AI 결과는 「추천」으로만 표시되며 감정관이 확인해야 사건 결과에 들어갑니다.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative flex min-h-full items-center justify-center px-[16px] py-[40px]">
            <div className="relative w-full max-w-[400px]">
              {card}
              <p className="mt-[20px] mb-0 text-center text-[11px] text-dim">인가된 사용자만 접근할 수 있으며, 모든 사용 기록이 저장됩니다.</p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
