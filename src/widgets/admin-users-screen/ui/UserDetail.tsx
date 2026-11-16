import { useId, type ReactNode } from "react"
import { KeyRound, LockOpen, Power, PowerOff, ShieldCheck } from "lucide-react"

import {
  USER_FORM_MESSAGES,
  grantsNationwidePhotos,
  isImpliedFeature,
  isStaffUser,
  needsOrgAssignment,
  sameFeatures,
  sameRoles,
  toggleFeature,
  toggleRole,
  userStatus,
} from "@/features/admin-users"
import { FEATURES } from "@/entities/session"
import type { AdminUser, FeatureInfo, Org, RoleInfo } from "@/entities/admin"
import { formatKstDateTime } from "@/shared/lib"
import { Avatar, Button, Checkbox, Chip, Combobox, Field, Segmented, Switch } from "@/shared/ui/kit"
import { Panel } from "@/shared/ui/panel"

import type { UserDraft } from "../model/types"
import { UserStatusChip } from "./UserStatusChip"

interface UserDetailProps {
  user: AdminUser
  draft: UserDraft
  featureList: FeatureInfo[]
  roles: RoleInfo[]
  orgs: Org[]
  isSelf: boolean
  onDraftChange: (patch: Partial<UserDraft>) => void
  onSaveInfo: () => void
  onSaveRoles: () => void
  onSaveFeatures: () => void
  onUnlock: () => void
  onResetPassword: () => void
  onSetUseAt: (useAt: "Y" | "N") => void
}

// 구역 한 칸: 작은 영문 느낌의 제목 + 내용(시안 S13 `sec()`).
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-[10px] border-t border-solid border-line-2 px-[18px] py-[14px]">
      <h3 className="m-0 font-code text-[10px] font-semibold tracking-[0.2em] text-dim">{title}</h3>
      {children}
    </section>
  )
}

function ActionRow({ title, description, action }: { title: string; description: string; action: ReactNode }) {
  return (
    <div className="flex items-center gap-[12px]">
      <span className="grid min-w-0 gap-[1px]">
        <span className="text-[13px] font-semibold text-foreground">{title}</span>
        <span className="text-[11.5px] text-dim">{description}</span>
      </span>
      <span className="ml-auto shrink-0">{action}</span>
    </div>
  )
}

/**
 * 선택한 사용자 상세(오른쪽): 기본 정보 · 역할 · 기능 권한 스위치 · 계정 관리.
 * 관리자 계정이면 스위치 대신 안내, 잠금 해제는 잠긴 사용자에게만 보인다. 값은 모두 draft(제어형).
 */
export function UserDetail({
  user,
  draft,
  featureList,
  roles,
  orgs,
  isSelf,
  onDraftChange,
  onSaveInfo,
  onSaveRoles,
  onSaveFeatures,
  onUnlock,
  onResetPassword,
  onSetUseAt,
}: UserDetailProps) {
  const baseId = useId()
  const status = userStatus(user)
  const isAdminUser = user.userSe === "ADMIN"
  const infoDirty = draft.userNm.trim() !== user.userNm || draft.userSe !== user.userSe || draft.orgId !== user.orgId
  const rolesDirty = !sameRoles(draft.roles, user.roles)
  const featuresDirty = !sameFeatures(draft.features, user.features)
  // 저장된 소속이 본청인 비직원은 의뢰를 볼 수 없다 · 비직원의 개인 사건 조회는 전국 사건 사진 열람이 된다
  const orgHint = needsOrgAssignment(user, orgs.find((o) => o.orgId === user.orgId)?.orgSe)
  const nationwide = grantsNationwidePhotos(isStaffUser(user), draft.features)
  const roleOrder = roles.map((r) => r.roleCode)
  const orgItems = orgs
    .filter((o) => o.useAt === "Y" || o.orgId === user.orgId)
    .map((o) => ({ value: String(o.orgId), label: o.orgNm }))

  return (
    <Panel corners role="region" aria-label="사용자 상세" className="min-w-0">
      <header className="flex items-start gap-[14px] rounded-t-[14px] bg-[var(--t-panel-head)] px-[18px] py-[16px]">
        <Avatar name={user.userNm} tone={isAdminUser ? "blue" : undefined} className="size-[44px] text-[16px]" />
        <div className="grid min-w-0 gap-[4px]">
          <div className="flex flex-wrap items-center gap-[6px]">
            <h2 className="m-0 min-w-0 break-all text-[17px] font-semibold">{user.userNm}</h2>
            <Chip variant={isAdminUser ? "blue" : "default"}>{isAdminUser ? "관리자" : "사용자"}</Chip>
            <UserStatusChip user={user} />
            {isSelf && <span className="text-[11px] text-dim">(나)</span>}
          </div>
          <span className="break-all font-code text-[12px] text-brand">{user.userId}</span>
          <span className="text-[11.5px] text-dim">
            마지막 로그인 <span className="font-code tabular-nums">{user.lastLoginDt ? formatKstDateTime(user.lastLoginDt) : "기록 없음"}</span>
          </span>
        </div>
      </header>

      <Section title="기본 정보">
        <div className="grid grid-cols-[84px_minmax(0,1fr)] items-center gap-x-[10px] gap-y-[8px]">
          <label htmlFor={`${baseId}-nm`} className="text-[12.5px] text-muted-foreground">
            이름
          </label>
          <Field id={`${baseId}-nm`} value={draft.userNm} onChange={(e) => onDraftChange({ userNm: e.target.value })} />
          <span className="text-[12.5px] text-muted-foreground">구분</span>
          <span aria-disabled={isSelf || undefined} inert={isSelf} className={isSelf ? "opacity-60" : undefined}>
            <Segmented
              aria-label="구분"
              items={[
                { value: "USER", label: "사용자" },
                { value: "ADMIN", label: "관리자" },
              ]}
              value={draft.userSe}
              onValueChange={(v) => !isSelf && onDraftChange({ userSe: v as UserDraft["userSe"] })}
            />
          </span>
          <span className="text-[12.5px] text-muted-foreground">소속 관서</span>
          <Combobox
            items={orgItems}
            value={String(draft.orgId)}
            onValueChange={(v) => onDraftChange({ orgId: Number(v) })}
            placeholder="관서 이름으로 검색"
          />
        </div>
        {orgHint && <p className="m-0 text-[11.5px] text-warn">{USER_FORM_MESSAGES.hqNonStaff}</p>}
        {isSelf && <p className="m-0 text-[11.5px] text-dim">본인 계정의 구분·사용 여부는 바꿀 수 없습니다.</p>}
        <div className="flex justify-end">
          <Button size="sm" disabled={!infoDirty} onClick={onSaveInfo}>
            정보 저장
          </Button>
        </div>
      </Section>

      <Section title="역할">
        <ul className="m-0 grid list-none gap-0 divide-y divide-line-2 rounded-[8px] border border-solid border-border bg-strip p-0">
          {roles.map((role) => {
            const id = `${baseId}-role-${role.roleCode}`
            return (
              <li key={role.roleCode} className="flex items-center gap-[12px] px-[14px] py-[10px]">
                <Checkbox
                  id={id}
                  checked={draft.roles.includes(role.roleCode)}
                  onCheckedChange={(on) => onDraftChange({ roles: toggleRole(draft.roles, role.roleCode, on === true, roleOrder) })}
                />
                <div className="grid min-w-0 gap-[2px]">
                  <label htmlFor={id} className="cursor-pointer text-[13px] font-medium">
                    {role.roleNm}
                  </label>
                  <span className="text-[11px] text-dim">{role.features.map((c) => featureList.find((f) => f.featureCode === c)?.featureNm ?? c).join(" · ")}</span>
                </div>
              </li>
            )
          })}
        </ul>
        <div className="flex justify-end">
          <Button size="sm" disabled={!rolesDirty} onClick={onSaveRoles}>
            역할 저장
          </Button>
        </div>
      </Section>

      <Section title="기능 권한">
        {isAdminUser ? (
          <p className="m-0 flex items-center gap-[8px] rounded-[8px] border border-solid border-brand-line bg-brand-bg px-[14px] py-[10px] text-[13px] text-brand">
            <ShieldCheck aria-hidden="true" className="size-[16px] shrink-0" />
            관리자는 모든 기능을 사용할 수 있습니다
          </p>
        ) : (
          <>
            <ul className="m-0 grid list-none p-0">
              {featureList.map((f) => {
                const id = `${baseId}-feat-${f.featureCode}`
                const implied = isImpliedFeature(draft.features, f.featureCode)
                const checked = implied || draft.features.includes(f.featureCode)
                return (
                  <li key={f.featureCode} className="flex items-center gap-[10px] border-b border-solid border-line-2 py-[6px]">
                    <span className="grid min-w-0 gap-0">
                      <label htmlFor={id} className="cursor-pointer text-[12.5px] text-fg-2">
                        {f.featureNm}
                      </label>
                      <span className="break-all font-code text-[10.5px] text-dim">
                        {f.featureCode}
                        {implied ? " · 신발 등록·수정에 포함됩니다" : ""}
                      </span>
                      {f.featureCode === FEATURES.CRIME_SEARCH && nationwide && (
                        <span className="text-[11px] text-warn">{USER_FORM_MESSAGES.nationwidePhotos}</span>
                      )}
                    </span>
                    <Switch
                      id={id}
                      className="ml-auto"
                      checked={checked}
                      disabled={implied}
                      onCheckedChange={(on) => onDraftChange({ features: toggleFeature(draft.features, f.featureCode, on) })}
                    />
                  </li>
                )
              })}
            </ul>
            <div className="flex justify-end">
              <Button size="sm" variant="pri" disabled={!featuresDirty} onClick={onSaveFeatures}>
                권한 저장
              </Button>
            </div>
          </>
        )}
      </Section>

      <Section title="계정 관리">
        <ActionRow
          title="비밀번호 초기화"
          description="임시 비밀번호를 정하고, 열린 로그인을 모두 끝냅니다"
          action={
            <Button size="sm" onClick={onResetPassword}>
              <KeyRound aria-hidden="true" className="size-[12px]" />
              비밀번호 초기화
            </Button>
          }
        />
        {status === "LOCKED" && (
          <ActionRow
            title="잠금 해제"
            description="연속 실패로 잠긴 계정을 다시 로그인할 수 있게 합니다"
            action={
              <Button size="sm" variant="warn" onClick={onUnlock}>
                <LockOpen aria-hidden="true" className="size-[12px]" />
                잠금 해제
              </Button>
            }
          />
        )}
        {user.useAt === "N" ? (
          <ActionRow
            title="다시 사용"
            description="중지된 계정이 다시 로그인할 수 있게 합니다"
            action={
              <Button size="sm" variant="ok" onClick={() => onSetUseAt("Y")}>
                <Power aria-hidden="true" className="size-[12px]" />
                다시 사용
              </Button>
            }
          />
        ) : (
          !isSelf && (
            <ActionRow
              title="사용 중지"
              description="로그인할 수 없게 합니다. 지난 기록은 그대로 남습니다"
              action={
                <Button size="sm" variant="danger" onClick={() => onSetUseAt("N")}>
                  <PowerOff aria-hidden="true" className="size-[12px]" />
                  사용 중지
                </Button>
              }
            />
          )
        )}
      </Section>
    </Panel>
  )
}
