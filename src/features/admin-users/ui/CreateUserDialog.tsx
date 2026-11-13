import { useId, useState, type FormEvent } from "react"
import { Loader2, UserPlus } from "lucide-react"

import {
  FEATURE_LABELS,
  FEATURE_ORDER,
  passwordRuleError,
  type FeatureCode,
  type UserSe,
} from "@/entities/session"
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  NativeSelect,
} from "@/shared/ui"

import { adminErrorMessage } from "../model/error-message"
import { useCreateUser, type AdminUserMutationOptions } from "../model/use-admin-users"
import {
  USER_FORM_MESSAGES,
  USER_ID_PATTERN,
  grantsNationwidePhotos,
  isImpliedFeature,
  toggleFeature,
} from "../model/user-rules"
import { AdminField, AdminFormError, AdminTextField } from "./AdminFormField"

export interface CreateUserDialogProps extends AdminUserMutationOptions {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 추가에 성공한 사용자 ID — 페이지가 표에서 그 사용자를 고른다. */
  onCreated?: (userId: string) => void
}

interface FormState {
  userId: string
  userNm: string
  userSe: UserSe
  initialPassword: string
  features: FeatureCode[]
}

const EMPTY_FORM: FormState = {
  userId: "",
  userNm: "",
  userSe: "USER",
  initialPassword: "",
  features: [],
}

/** 화면에서 먼저 막는 규칙(서버도 같은 검사). 통과하면 `null`. */
function validate(form: FormState): string | null {
  if (!USER_ID_PATTERN.test(form.userId)) return USER_FORM_MESSAGES.userId
  if (form.userNm.trim() === "") return USER_FORM_MESSAGES.userNm
  return passwordRuleError(form.initialPassword)
}

/**
 * 사용자 추가 대화 상자 — 아이디(영문·숫자·_ 4~20자), 이름, 구분, 임시 비밀번호(8자+,
 * 72바이트 이하), 기능 체크박스 4개. 관리자를 고르면 기능 선택 대신 안내를 보인다
 * (관리자는 모든 기능 사용). 실패는 서버 문구 그대로(예: 409 "이미 등록된 아이디입니다").
 */
export function CreateUserDialog({ open, onOpenChange, onCreated, onUserChanged }: CreateUserDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [localError, setLocalError] = useState<string | null>(null)
  const create = useCreateUser({ onUserChanged })
  const baseId = useId()

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setForm(EMPTY_FORM)
      setLocalError(null)
      create.reset()
    }
    onOpenChange(next)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (create.isPending) return
    const ruleError = validate(form)
    setLocalError(ruleError)
    if (ruleError) return
    const input = {
      userId: form.userId,
      userNm: form.userNm.trim(),
      userSe: form.userSe,
      initialPassword: form.initialPassword,
      features: form.userSe === "ADMIN" ? [] : form.features,
    }
    create.mutate(input, {
      onSuccess: () => {
        onCreated?.(input.userId)
        handleOpenChange(false)
      },
    })
  }

  const error = localError ?? adminErrorMessage(create.error)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>사용자 추가</DialogTitle>
            <DialogDescription>
              첫 로그인 때 임시 비밀번호를 새 비밀번호로 바꾸도록 안내됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <AdminTextField
              id={`${baseId}-id`}
              label="아이디"
              autoComplete="off"
              spellCheck={false}
              value={form.userId}
              onChange={(event) => update("userId", event.target.value)}
              hint="영문·숫자·_ 4~20자"
            />
            <AdminTextField
              id={`${baseId}-name`}
              label="이름"
              autoComplete="off"
              value={form.userNm}
              onChange={(event) => update("userNm", event.target.value)}
            />
            <AdminField id={`${baseId}-se`} label="구분">
              <NativeSelect
                id={`${baseId}-se`}
                value={form.userSe}
                onChange={(event) => update("userSe", event.target.value as UserSe)}
              >
                <option value="USER">사용자</option>
                <option value="ADMIN">관리자</option>
              </NativeSelect>
            </AdminField>
            <AdminTextField
              id={`${baseId}-pw`}
              label="임시 비밀번호"
              type="password"
              autoComplete="new-password"
              value={form.initialPassword}
              onChange={(event) => update("initialPassword", event.target.value)}
              hint="8자 이상, 72바이트 이하"
            />
          </div>
          {/* 새 계정의 기본 소속은 본청 — 비직원은 의뢰를 볼 수 없으므로 만든 뒤 상세에서 관서를 바꾼다(서버 R7) */}
          <p className="text-[12px] text-warn">{USER_FORM_MESSAGES.newUserHq}</p>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-[12px] font-medium text-[#A9B3C4]">기능 권한</legend>
            {form.userSe === "ADMIN" ? (
              <p className="rounded-md border border-[#3B82F6]/30 bg-[#152238]/50 px-3 py-2 text-[12px] text-[#9CC3FF]">
                관리자는 모든 기능을 사용할 수 있습니다
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {FEATURE_ORDER.map((code) => {
                  const id = `${baseId}-${code}`
                  const implied = isImpliedFeature(form.features, code)
                  return (
                    <div
                      key={code}
                      className="flex items-center gap-2 rounded-md border border-[#1E2A3C] bg-[#0D1420]/50 px-3 py-2"
                    >
                      <Checkbox
                        id={id}
                        checked={implied || form.features.includes(code)}
                        disabled={implied}
                        onCheckedChange={(on) =>
                          update("features", toggleFeature(form.features, code, on === true))
                        }
                      />
                      <label htmlFor={id} className="cursor-pointer text-[13px] text-[#E5E9F0]">
                        {FEATURE_LABELS[code]}
                      </label>
                    </div>
                  )
                })}
              </div>
            )}
            {/* 새 사용자는 역할이 없어 비직원 — 개인 사건 조회는 전국 사건 사진 열람이 된다 */}
            {form.userSe !== "ADMIN" && grantsNationwidePhotos(false, form.features) && (
              <p className="text-[12px] text-warn">{USER_FORM_MESSAGES.nationwidePhotos}</p>
            )}
          </fieldset>

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
              disabled={create.isPending}
              className="bg-[#3B82F6] text-white hover:bg-[#2563EB] focus-visible:ring-[#3B82F6]/50"
            >
              {create.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <UserPlus aria-hidden="true" />}
              추가
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
