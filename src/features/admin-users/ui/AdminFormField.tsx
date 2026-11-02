import type { ComponentProps, ReactNode } from "react"
import { AlertTriangle } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Input } from "@/shared/ui"

/** 관리자 폼 입력칸 톤 — 포커스 = 파란 테두리 + 링, 오류 = 빨간 테두리. */
export const adminInputClass =
  "h-9 border-[#1E2A3C] bg-[#0D1420] text-[13px] text-[#E5E9F0] placeholder:text-[#4C5670] focus-visible:border-[#3B82F6] focus-visible:ring-[#3B82F6]/35 aria-invalid:border-[#EF4444]/70 aria-invalid:ring-[#EF4444]/20"

interface FieldProps {
  id: string
  label: string
  /** 입력칸 아래 보조 설명. */
  hint?: ReactNode
  children: ReactNode
  className?: string
}

/** 라벨 + 입력 + 보조 설명 묶음(간격 8px 단위). */
export function AdminField({ id, label, hint, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[12px] font-medium text-[#A9B3C4]">
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

type TextFieldProps = Omit<ComponentProps<"input">, "id" | "className"> & {
  id: string
  label: string
  hint?: ReactNode
}

/** 라벨이 붙은 글자 입력칸. */
export function AdminTextField({ id, label, hint, ...props }: TextFieldProps) {
  return (
    <AdminField id={id} label={label} hint={hint}>
      <Input
        {...props}
        id={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={adminInputClass}
      />
    </AdminField>
  )
}

/** 폼·패널 안 오류 문구(서버 `detail` 그대로). 나타나는 순간 화면 낭독기가 읽는다. */
export function AdminFormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-md border border-[#EF4444]/35 bg-[#2A1215]/60 px-3 py-2 text-[12px] leading-5 text-[#FCA5A5]"
    >
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-[#EF4444]" aria-hidden="true" />
      <span>{message}</span>
    </p>
  )
}
