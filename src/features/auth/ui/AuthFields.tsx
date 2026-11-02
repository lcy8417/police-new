import { useState, type ComponentProps, type ReactNode } from "react"
import { AlertTriangle, Eye, EyeOff, Loader2, type LucideIcon } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Button, Input } from "@/shared/ui"

/** 커맨드센터 입력칸 톤 + 오류 시 빨간 테두리. 포커스는 파란 테두리 + 링(키보드 사용자도 위치가 보이게). */
const authInputClass =
  "h-11 border-[#1E2A3C] bg-[#0D1420]/70 text-[14px] text-[#E5E9F0] placeholder:text-[#4C5670] focus-visible:border-[#3B82F6] focus-visible:ring-[#3B82F6]/35 aria-invalid:border-[#EF4444]/70 aria-invalid:ring-[#EF4444]/20"

type InputProps = Omit<ComponentProps<"input">, "id" | "type" | "className">

interface AuthTextFieldProps extends InputProps {
  /** 입력칸 `id`(라벨 `htmlFor`와 연결). */
  id: string
  /** 화면에 보이는 라벨 — 접근성 이름도 이 값. */
  label: string
  /** 입력칸 왼쪽 아이콘. */
  icon?: LucideIcon
  /** 입력칸 아래 보조 설명(`aria-describedby`로 연결). */
  hint?: ReactNode
}

function FieldShell({
  id,
  label,
  hint,
  children,
}: {
  id: string
  label: string
  hint?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[12px] font-medium text-[#A9B3C4]">
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-[11px] text-[#5B6B85]">
          {hint}
        </p>
      )}
    </div>
  )
}

function describedBy(id: string, hint: ReactNode | undefined, extra: string | undefined): string | undefined {
  const ids = [hint ? `${id}-hint` : null, extra ?? null].filter(Boolean)
  return ids.length > 0 ? ids.join(" ") : undefined
}

/** 라벨이 붙은 글자 입력칸. */
export function AuthTextField({ id, label, icon: Icon, hint, ...props }: AuthTextFieldProps) {
  return (
    <FieldShell id={id} label={label} hint={hint}>
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#4C5670]"
            aria-hidden="true"
          />
        )}
        <Input
          {...props}
          id={id}
          type="text"
          aria-describedby={describedBy(id, hint, props["aria-describedby"])}
          className={cn(authInputClass, Icon && "pl-9")}
        />
      </div>
    </FieldShell>
  )
}

/** 라벨이 붙은 비밀번호 입력칸 + 표시/숨김 토글(토글 이름: "<라벨> 표시" / "<라벨> 숨기기"). */
export function AuthPasswordField({ id, label, icon: Icon, hint, ...props }: AuthTextFieldProps) {
  const [visible, setVisible] = useState(false)
  const ToggleIcon = visible ? EyeOff : Eye

  return (
    <FieldShell id={id} label={label} hint={hint}>
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#4C5670]"
            aria-hidden="true"
          />
        )}
        <Input
          {...props}
          id={id}
          type={visible ? "text" : "password"}
          spellCheck={false}
          autoCapitalize="none"
          aria-describedby={describedBy(id, hint, props["aria-describedby"])}
          className={cn(authInputClass, "pr-11", Icon && "pl-9")}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={`${label} ${visible ? "숨기기" : "표시"}`}
          aria-controls={id}
          className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-[#5B6B85] transition-colors outline-none hover:text-[#C7CEDB] focus-visible:text-[#C7CEDB] focus-visible:ring-[3px] focus-visible:ring-[#3B82F6]/45"
        >
          <ToggleIcon className="size-4" aria-hidden="true" />
        </button>
      </div>
    </FieldShell>
  )
}

/** 제출 버튼 바로 위의 오류 문구(서버 `detail` 그대로). 나타나는 순간 화면 낭독기가 읽는다. */
export function AuthFormError({ id, message }: { id: string; message: string | null }) {
  if (!message) return null
  return (
    <p
      id={id}
      role="alert"
      aria-live="assertive"
      className="flex items-start gap-2 rounded-md border border-[#EF4444]/40 bg-[#EF4444]/10 px-3 py-2.5 text-[13px] leading-snug text-[#EF4444]"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  )
}

interface AuthSubmitButtonProps {
  /** 평소 문구(접근성 이름). */
  label: string
  /** 요청 중 문구(예 "로그인 중…"). */
  busyLabel: string
  busy: boolean
}

/** 파란 그라디언트 주 버튼. 요청 중에는 돌아가는 아이콘 + `busyLabel`, 다시 누를 수 없음. */
export function AuthSubmitButton({ label, busyLabel, busy }: AuthSubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={busy}
      aria-busy={busy}
      className="h-11 w-full bg-gradient-to-b from-[#2563EB] to-[#1D4ED8] text-[14px] font-semibold text-white shadow-[0_0_20px_rgba(37,99,235,0.45)] hover:from-[#3b74f2] hover:to-[#2154d8] focus-visible:ring-[3px] focus-visible:ring-[#4A9EFF]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B121D] disabled:opacity-70"
    >
      {busy ? (
        <>
          <Loader2 className="animate-spin" aria-hidden="true" />
          {busyLabel}
        </>
      ) : (
        label
      )}
    </Button>
  )
}
