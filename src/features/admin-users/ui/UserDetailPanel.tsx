import { useId, useMemo, useState, type FormEvent, type ReactNode } from "react"
import { KeyRound, Loader2, LockOpen, Power, PowerOff, ShieldCheck, UserRound } from "lucide-react"

import type { AdminUser, Org, RoleCode, RoleInfo, UpdateUserInput } from "@/entities/admin"
import { FEATURE_LABELS, type UserSe } from "@/entities/session"
import { formatKstDateTime } from "@/shared/lib"
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
  TechCorners,
} from "@/shared/ui"

import { adminErrorMessage } from "../model/error-message"
import {
  useOrgsQuery,
  useReplaceFeatures,
  useReplaceRoles,
  useRolesQuery,
  useUnlockUser,
  useUpdateUser,
  type AdminUserMutationOptions,
} from "../model/use-admin-users"
import { USER_FORM_MESSAGES, sameRoles, toggleRole } from "../model/user-rules"
import { AdminField, AdminFormError, AdminTextField } from "./AdminFormField"
import { FeatureToggles } from "./FeatureToggles"
import { PasswordResetDialog } from "./PasswordResetDialog"
import { UserSeChip, UserStatusChip } from "./UserTable"

export interface UserDetailPanelProps extends AdminUserMutationOptions {
  /** 선택한 사용자. 다른 사용자를 고르면 상위에서 `key`를 바꿔 편집 상태를 새로 시작한다. */
  user: AdminUser
  /** 지금 로그인한 관리자 ID — 본인 계정은 구분·사용 여부를 바꿀 수 없다(서버도 400). */
  currentUserId: string | null
}

const OUTLINE_BUTTON_CLASS =
  "border-[#26334A] bg-transparent text-[#C7CEDB] hover:bg-white/5 hover:text-white focus-visible:border-[#3B82F6] focus-visible:ring-[#3B82F6]/40"

/** 패널 안 구역 — 제목 한 줄 + 내용(간격 8px 단위). */
function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-[#141D2C] px-6 py-5">
      <h3 className="text-[11px] font-semibold tracking-[0.2em] text-[#5B6B85]">{title}</h3>
      {children}
    </section>
  )
}

/** 계정 관리 한 줄 — 설명 + 오른쪽 버튼. */
function ActionRow({ title, description, action }: { title: string; description: string; action: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[13px] font-medium text-[#E5E9F0]">{title}</span>
        <span className="text-[11px] text-[#5B6B85]">{description}</span>
      </div>
      {action}
    </div>
  )
}

/** 관서 고르기 선택지 — 사용 중인 관서 + (사용 중지됐더라도) 지금 소속. 목록을 못 읽었으면 지금 소속만. */
function orgChoices(orgs: Org[] | undefined, user: AdminUser): Array<{ orgId: number; label: string }> {
  const usable = (orgs ?? []).filter((org) => org.useAt === "Y" || org.orgId === user.orgId)
  const choices = usable.map((org) => ({
    orgId: org.orgId,
    label: org.useAt === "Y" ? org.orgNm : `${org.orgNm} (사용 중지)`,
  }))
  return choices.some((choice) => choice.orgId === user.orgId)
    ? choices
    : [{ orgId: user.orgId, label: user.orgNm }, ...choices]
}

interface RoleChecksProps {
  /** 서버에 저장된 역할(편집 시작값). */
  value: RoleCode[]
  /** 역할 선택지(`GET /admin/roles`). */
  roles: RoleInfo[]
  saving: boolean
  onSave: (roles: RoleCode[]) => void
}

/**
 * 역할 체크(서버 역할 목록 — 지금은 수사관 · 감정관 · 검증자) + "역할 저장". 각 줄 아래에 그 역할이 주는
 * 기능 권한을 보인다. 바뀐 것이 없으면 저장 버튼이 꺼져 있다. 색은 토큰 이름만(새 hex 금지) —
 * 값은 위 기능 권한 목록과 같다.
 */
function RoleChecks({ value, roles, saving, onSave }: RoleChecksProps) {
  const [draft, setDraft] = useState<RoleCode[]>(value)
  const baseId = useId()
  const order = roles.map((role) => role.roleCode)
  const dirty = !sameRoles(draft, value)

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col divide-y divide-line-2 rounded-lg border border-border bg-strip/50">
        {roles.map((role) => {
          const id = `${baseId}-${role.roleCode}`
          return (
            <li key={role.roleCode} className="flex items-center gap-3 px-4 py-3">
              <Checkbox
                id={id}
                checked={draft.includes(role.roleCode)}
                disabled={saving}
                onCheckedChange={(on) =>
                  setDraft((prev) => toggleRole(prev, role.roleCode, on === true, order))
                }
              />
              <div className="flex min-w-0 flex-col gap-0.5">
                <label htmlFor={id} className="cursor-pointer text-[13px] font-medium text-foreground">
                  {role.roleNm}
                </label>
                <span className="text-[11px] text-dim">
                  {role.features.map((code) => FEATURE_LABELS[code] ?? code).join(" · ")}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!dirty || saving}
          onClick={() => onSave(draft)}
          className={OUTLINE_BUTTON_CLASS}
        >
          {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
          역할 저장
        </Button>
      </div>
    </div>
  )
}

/**
 * 선택한 사용자 상세(`/manage/users` 오른쪽) — 기본 정보(이름·구분·소속 관서) 저장, 역할 체크,
 * 기능 권한 스위치, 비밀번호 초기화·잠금 해제(잠긴 경우만)·사용 중지/다시 사용. 관리자 계정이면 스위치 대신
 * "관리자는 모든 기능을 사용할 수 있습니다". 서버 거절 문구(마지막 관리자 보호 등)는 패널 안에.
 */
export function UserDetailPanel({ user, currentUserId, onUserChanged }: UserDetailPanelProps) {
  const [userNm, setUserNm] = useState(user.userNm)
  const [userSe, setUserSe] = useState<UserSe>(user.userSe)
  const [orgId, setOrgId] = useState(user.orgId)
  const [localError, setLocalError] = useState<string | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [disableOpen, setDisableOpen] = useState(false)
  const baseId = useId()

  const update = useUpdateUser({ onUserChanged })
  const features = useReplaceFeatures({ onUserChanged })
  const roles = useReplaceRoles({ onUserChanged })
  const unlock = useUnlockUser({ onUserChanged })
  const rolesQuery = useRolesQuery()
  const orgsQuery = useOrgsQuery()
  const orgOptions = useMemo(() => orgChoices(orgsQuery.data, user), [orgsQuery.data, user])

  const isSelf = user.userId === currentUserId
  const isAdminUser = user.userSe === "ADMIN"
  const disabled = user.useAt === "N"
  const locked = user.lockAt === "Y"
  const orgChanged = orgId !== user.orgId
  const infoDirty = userNm.trim() !== user.userNm || userSe !== user.userSe || orgChanged
  const busy = update.isPending || features.isPending || roles.isPending || unlock.isPending

  /** 새 작업을 시작하기 전에 이전 오류 문구를 지운다(한 번에 하나만 보이게). */
  const clearErrors = () => {
    setLocalError(null)
    update.reset()
    features.reset()
    roles.reset()
    unlock.reset()
  }

  /** `onSettled`: 성공·실패와 무관하게 끝나면(확인 대화 상자 닫기 — 오류는 패널에 보인다). */
  const saveUser = (input: UpdateUserInput, onSettled?: () => void) => {
    clearErrors()
    update.mutate({ userId: user.userId, input }, { onSettled })
  }

  const handleInfoSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy || !infoDirty) return
    const name = userNm.trim()
    if (name === "") {
      clearErrors()
      setLocalError(USER_FORM_MESSAGES.userNm)
      return
    }
    // 소속 관서는 바꿨을 때만 보낸다(안 보내면 서버가 그대로 둔다).
    saveUser({ userNm: name, userSe, useAt: user.useAt, ...(orgChanged && { orgId }) })
  }

  const setUseAt = (useAt: "Y" | "N", onSettled?: () => void) =>
    saveUser({ userNm: user.userNm, userSe: user.userSe, useAt }, onSettled)

  const error =
    localError ?? adminErrorMessage(update.error ?? features.error ?? roles.error ?? unlock.error)

  return (
    <section
      aria-label="사용자 상세"
      className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]"
    >
      <TechCorners size={22} />

      {/* 머리 — 이름·구분·상태·아이디·마지막 로그인 */}
      <header className="flex items-start gap-4 bg-[#0D1420]/60 px-6 py-5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#16233B] ring-1 ring-[#26334A]">
          <UserRound className="size-5 text-[#8A93A6]" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-[17px] font-semibold text-white">{user.userNm}</h2>
            <UserSeChip userSe={user.userSe} />
            <UserStatusChip user={user} />
            {isSelf && <span className="text-[11px] text-[#5B6B85]">(나)</span>}
          </div>
          <span className="font-mono text-[12px] text-[#4A9EFF]">{user.userId}</span>
          <span className="text-[11px] text-[#5B6B85] tabular-nums">
            마지막 로그인 {user.lastLoginDt ? formatKstDateTime(user.lastLoginDt) : "기록 없음"}
          </span>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {error && (
          <div className="px-6 pb-4">
            <AdminFormError message={error} />
          </div>
        )}

        <PanelSection title="기본 정보">
          <form onSubmit={handleInfoSubmit} noValidate className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <AdminTextField
                id={`${baseId}-name`}
                label="이름"
                autoComplete="off"
                value={userNm}
                onChange={(event) => setUserNm(event.target.value)}
              />
              <AdminField id={`${baseId}-se`} label="구분">
                <NativeSelect
                  id={`${baseId}-se`}
                  value={userSe}
                  disabled={isSelf}
                  aria-describedby={isSelf ? `${baseId}-self` : undefined}
                  onChange={(event) => setUserSe(event.target.value as UserSe)}
                >
                  <option value="USER">사용자</option>
                  <option value="ADMIN">관리자</option>
                </NativeSelect>
              </AdminField>
            </div>
            <AdminField
              id={`${baseId}-org`}
              label="소속 관서"
              hint={
                orgsQuery.isError ? "관서 목록을 확인하지 못했습니다 — 지금 소속만 보입니다" : undefined
              }
            >
              <NativeSelect
                id={`${baseId}-org`}
                value={String(orgId)}
                aria-describedby={orgsQuery.isError ? `${baseId}-org-hint` : undefined}
                onChange={(event) => setOrgId(Number(event.target.value))}
              >
                {orgOptions.map((choice) => (
                  <option key={choice.orgId} value={String(choice.orgId)}>
                    {choice.label}
                  </option>
                ))}
              </NativeSelect>
            </AdminField>
            {isSelf && (
              <p id={`${baseId}-self`} className="text-[11px] text-[#5B6B85]">
                본인 계정의 구분·사용 여부는 바꿀 수 없습니다.
              </p>
            )}
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                variant="outline"
                disabled={!infoDirty || busy}
                className={OUTLINE_BUTTON_CLASS}
              >
                {update.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
                정보 저장
              </Button>
            </div>
          </form>
        </PanelSection>

        <PanelSection title="역할">
          {rolesQuery.data ? (
            <RoleChecks
              value={user.roles}
              roles={rolesQuery.data}
              saving={roles.isPending}
              onSave={(next) => {
                clearErrors()
                roles.mutate({ userId: user.userId, roles: next })
              }}
            />
          ) : rolesQuery.isError ? (
            <p className="flex items-center gap-2 text-[12px] text-muted-foreground">
              역할 목록을 확인하지 못했습니다
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void rolesQuery.refetch()}
                className={OUTLINE_BUTTON_CLASS}
              >
                다시
              </Button>
            </p>
          ) : (
            <p className="flex items-center gap-2 text-[12px] text-dim">
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              역할 목록을 불러오는 중…
            </p>
          )}
        </PanelSection>

        <PanelSection title="기능 권한">
          {isAdminUser ? (
            <p className="flex items-center gap-2 rounded-lg border border-[#3B82F6]/30 bg-[#152238]/50 px-4 py-3 text-[13px] text-[#9CC3FF]">
              <ShieldCheck className="size-4 shrink-0 text-[#4A9EFF]" aria-hidden="true" />
              관리자는 모든 기능을 사용할 수 있습니다
            </p>
          ) : (
            <FeatureToggles
              value={user.features}
              saving={features.isPending}
              onSave={(next) => {
                clearErrors()
                features.mutate({ userId: user.userId, features: next })
              }}
            />
          )}
        </PanelSection>

        <PanelSection title="계정 관리">
          <ActionRow
            title="비밀번호 초기화"
            description="임시 비밀번호를 정하고, 열린 로그인을 모두 끝냅니다"
            action={
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => setResetOpen(true)}
                className={OUTLINE_BUTTON_CLASS}
              >
                <KeyRound aria-hidden="true" />
                비밀번호 초기화
              </Button>
            }
          />
          {locked && (
            <ActionRow
              title="잠금 해제"
              description="연속 실패로 잠긴 계정을 다시 로그인할 수 있게 합니다"
              action={
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    clearErrors()
                    unlock.mutate(user.userId)
                  }}
                  className="border-[#F59E0B]/40 bg-transparent text-[#F59E0B] hover:bg-[#F59E0B]/10 hover:text-[#FBBF24] focus-visible:ring-[#F59E0B]/40"
                >
                  {unlock.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <LockOpen aria-hidden="true" />}
                  잠금 해제
                </Button>
              }
            />
          )}
          {disabled ? (
            <ActionRow
              title="다시 사용"
              description="중지된 계정이 다시 로그인할 수 있게 합니다"
              action={
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setUseAt("Y")}
                  className="border-[#2DD4BF]/40 bg-transparent text-[#2DD4BF] hover:bg-[#2DD4BF]/10 hover:text-[#5EEAD4] focus-visible:ring-[#2DD4BF]/40"
                >
                  <Power aria-hidden="true" />
                  다시 사용
                </Button>
              }
            />
          ) : (
            <ActionRow
              title="사용 중지"
              description="로그인할 수 없게 하고, 열린 로그인을 모두 끝냅니다"
              action={
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy || isSelf}
                  onClick={() => setDisableOpen(true)}
                  className="border-[#EF4444]/40 bg-transparent text-[#EF4444] hover:bg-[#EF4444]/10 hover:text-[#F87171] focus-visible:ring-[#EF4444]/40"
                >
                  <PowerOff aria-hidden="true" />
                  사용 중지
                </Button>
              }
            />
          )}
        </PanelSection>
      </div>

      <PasswordResetDialog
        user={user}
        open={resetOpen}
        onOpenChange={setResetOpen}
        onUserChanged={onUserChanged}
      />

      <Dialog open={disableOpen} onOpenChange={setDisableOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>사용 중지</DialogTitle>
            <DialogDescription>
              {user.userNm}({user.userId})은(는) 더 이상 로그인할 수 없고, 열린 로그인도 모두 종료됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDisableOpen(false)} className={OUTLINE_BUTTON_CLASS}>
              취소
            </Button>
            <Button
              type="button"
              disabled={update.isPending}
              onClick={() => setUseAt("N", () => setDisableOpen(false))}
              className="bg-[#EF4444] text-white hover:bg-[#DC2626] focus-visible:ring-[#EF4444]/50"
            >
              {update.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
              중지
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
