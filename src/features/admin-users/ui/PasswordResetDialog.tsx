import { useId, useState, type FormEvent } from "react"
import { KeyRound, Loader2 } from "lucide-react"

import type { AdminUser } from "@/entities/admin"
import { passwordRuleError } from "@/entities/session"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui"

import { adminErrorMessage } from "../model/error-message"
import { useResetPassword, type AdminUserMutationOptions } from "../model/use-admin-users"
import { AdminFormError, AdminTextField } from "./AdminFormField"

export interface PasswordResetDialogProps extends AdminUserMutationOptions {
  user: AdminUser
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * 비밀번호 초기화 — 관리자가 임시 비밀번호를 정해 준다. 그 사용자의 열린 로그인은 모두
 * 끝나고, 다음 로그인 때 비밀번호 변경 화면으로 안내된다. 규칙(8자+, 72바이트 이하)은
 * 보내기 전에 화면에서 먼저 검사한다.
 */
export function PasswordResetDialog({ user, open, onOpenChange, onUserChanged }: PasswordResetDialogProps) {
  const [tempPassword, setTempPassword] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)
  const reset = useResetPassword({ onUserChanged })
  const inputId = useId()

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setTempPassword("")
      setLocalError(null)
      reset.reset()
    }
    onOpenChange(next)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (reset.isPending) return
    const ruleError = passwordRuleError(tempPassword)
    setLocalError(ruleError)
    if (ruleError) return
    reset.mutate(
      { userId: user.userId, tempPassword },
      { onSuccess: () => handleOpenChange(false) }
    )
  }

  const error = localError ?? adminErrorMessage(reset.error)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>비밀번호 초기화</DialogTitle>
            <DialogDescription>
              {user.userNm}({user.userId})의 열린 로그인은 모두 종료되고, 다음 로그인 때 새 비밀번호를
              정하도록 안내됩니다.
            </DialogDescription>
          </DialogHeader>
          <AdminTextField
            id={inputId}
            label="임시 비밀번호"
            type="password"
            autoComplete="new-password"
            value={tempPassword}
            aria-invalid={localError ? true : undefined}
            onChange={(event) => setTempPassword(event.target.value)}
            hint="8자 이상, UTF-8 기준 72바이트 이하"
          />
          <AdminFormError message={error} />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="border-[#26334A] bg-transparent text-[#C7CEDB] hover:bg-white/5 hover:text-white"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={reset.isPending}
              className="bg-[#3B82F6] text-white hover:bg-[#2563EB] focus-visible:ring-[#3B82F6]/50"
            >
              {reset.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <KeyRound aria-hidden="true" />}
              초기화
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
