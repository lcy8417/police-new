import { useId, type ReactNode } from "react"
import { KeyRound, LockOpen, Power, PowerOff, Save, ShieldCheck } from "lucide-react"

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
import { Avatar, Checkbox, Combobox, Field, Segmented, StatePill, Switch, WorkbenchButton } from "@/shared/ui/kit"
import { PaneHead } from "@/shared/ui/panel"

import { DUTY_COLUMNS, effectiveRow, type DutyColumn } from "../model/effective-permissions"
import type { ShoeDuty, UserDraft } from "../model/types"
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
  /** 신규(+α) — 역할 프리셋 · 신발 DB 분업 · 「그 뒤 실패 n회」 · 프리셋 비교 칩 */
  showPlus?: boolean
  /** 이 사람에게 맡긴 분업(문양 입력 · 신발 승인) */
  assignedDuties?: ShoeDuty[]
  onToggleDuty?: (duty: ShoeDuty, on: boolean) => void
  /** 상세 머리의 PC 주소 · 그 뒤 실패 횟수 */
  loginMeta?: { ip: string; failCount: number }
  /** 역할 프리셋 줄 아래 설명 */
  presetHint?: string
}

// 구역 한 칸: 칸 머리(PaneHead — 사건 창과 같은 밑줄 탭 모양 소제목) + 내용. aside = 머리 오른쪽 끝 알약(신규).
function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section aria-label={title} className="grid gap-[10px] px-[16px] pb-[14px]">
      <PaneHead title={title} end={aside} />
      {children}
    </section>
  )
}

// 분업 스위치 한 줄(시안 tog()): 이름(+신규) · 코드 · 메모 + 스위치
function DutyToggle({ id, col, checked, onChange }: { id: string; col: DutyColumn; checked: boolean; onChange: (on: boolean) => void }) {
  return (
    <li className="flex items-center gap-[10px] border-b border-solid border-line-2 py-[6px]">
      <span className="grid min-w-0 gap-0">
        <label htmlFor={id} className="cursor-pointer text-[12.5px] text-fg-2">
          {col.name} {col.isNew && <span className="text-[10px] font-bold text-ai">신규</span>}
        </label>
        <span className="text-[10px] text-dim">
          <span className="font-code">{col.key}</span> · {col.memo}
        </span>
      </span>
      <Switch id={id} className="ml-auto" checked={checked} onCheckedChange={onChange} />
    </li>
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
  showPlus = false,
  assignedDuties = [],
  onToggleDuty,
  loginMeta,
  presetHint,
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
  // 편집 값 기준 역할 프리셋과 비교(시안 「프리셋과 같음」 칩)
  const presetDiff = effectiveRow({ ...user, features: draft.features, roles: draft.roles, userSe: draft.userSe }, roles, assignedDuties).diff
  const presetChip =
    showPlus && !isAdminUser ? (
      <span data-plus>
        {presetDiff === 0 ? (
          <StatePill tone="fact">프리셋과 같음</StatePill>
        ) : (
          <StatePill tone="fact" className="bg-warn-bg text-warn">
            프리셋과 다름 {presetDiff}칸
          </StatePill>
        )}
      </span>
    ) : null
  const orgItems = orgs
    .filter((o) => o.useAt === "Y" || o.orgId === user.orgId)
    .map((o) => ({ value: String(o.orgId), label: o.orgNm }))

  return (
    <section role="region" aria-label="사용자 상세" className="grid min-w-0 gap-[4px] pb-[4px]">
      <header className="flex items-start gap-[10px] border-0 border-b border-solid border-border px-[16px] py-[12px]">
        <Avatar name={user.userNm} tone={isAdminUser ? "blue" : undefined} className="size-[32px] text-[13px]" />
        <div className="grid min-w-0 gap-[2px]">
          <div className="flex flex-wrap items-center gap-[6px]">
            <h2 className="m-0 min-w-0 break-all text-[13px] font-bold">{user.userNm}</h2>
            <StatePill tone="fact" className={isAdminUser ? "bg-brand-bg text-brand-3" : undefined}>
              {isAdminUser ? "관리자" : "사용자"}
            </StatePill>
            <UserStatusChip user={user} />
            {isSelf && <span className="text-[11px] text-dim">(나)</span>}
            <span className="font-code text-[11px] text-brand-3">{user.userId}</span>
          </div>
          <span className="text-[11px] text-dim">
            마지막 로그인 <span className="font-code tabular-nums">{user.lastLoginDt ? formatKstDateTime(user.lastLoginDt) : "기록 없음"}</span>
            {showPlus && loginMeta && (
              <span data-plus>
                {" "}
                · <span className="font-code">{loginMeta.ip}</span> · 그 뒤 실패 <span className="tabular-nums">{loginMeta.failCount}</span>회
              </span>
            )}
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
        {orgHint && <p className="m-0 text-[11px] text-warn">{USER_FORM_MESSAGES.hqNonStaff}</p>}
        {isSelf && <p className="m-0 text-[11px] text-dim">본인 계정의 구분·사용 여부는 바꿀 수 없습니다.</p>}
        <div className="flex justify-end">
          <WorkbenchButton size="sm" icon={Save} disabled={!infoDirty} onClick={onSaveInfo}>
            정보 저장
          </WorkbenchButton>
        </div>
      </Section>

      <Section title="역할">
        {showPlus && (
          // 시안 「역할 프리셋」: 하나를 고르면 편집 값의 역할이 그 하나로 바뀐다(관리자는 구분을 관리자로). 저장은 아래 버튼 그대로.
          <div data-plus className="grid gap-[6px]">
            <span aria-disabled={(isSelf && isAdminUser) || undefined} className="w-fit">
              <Segmented
                aria-label="역할 프리셋"
                items={[...roles.map((r) => ({ value: r.roleCode, label: r.roleNm })), { value: "ADMIN", label: "관리자" }]}
                value={draft.userSe === "ADMIN" ? "ADMIN" : (draft.roles[0] ?? "")}
                onValueChange={(v) => {
                  if (v === "ADMIN") {
                    if (!isSelf) onDraftChange({ userSe: "ADMIN" })
                  } else if (!(isSelf && draft.userSe === "ADMIN")) {
                    onDraftChange({ roles: [v], ...(draft.userSe === "ADMIN" ? { userSe: "USER" as const } : {}) })
                  }
                }}
              />
            </span>
            {presetHint && <span className="text-[11px] text-dim">{presetHint}</span>}
          </div>
        )}
        <ul className="m-0 grid list-none gap-0 divide-y divide-line-2 rounded-[8px] border border-solid border-border p-0">
          {roles.map((role) => {
            const id = `${baseId}-role-${role.roleCode}`
            return (
              <li key={role.roleCode} className="flex items-center gap-[10px] px-[12px] py-[7px]">
                <Checkbox
                  id={id}
                  checked={draft.roles.includes(role.roleCode)}
                  onCheckedChange={(on) => onDraftChange({ roles: toggleRole(draft.roles, role.roleCode, on === true, roleOrder) })}
                />
                <div className="grid min-w-0 gap-[2px]">
                  <label htmlFor={id} className="cursor-pointer text-[12.5px] font-bold">
                    {role.roleNm}
                  </label>
                  <span className="text-[11px] text-dim">{role.features.map((c) => featureList.find((f) => f.featureCode === c)?.featureNm ?? c).join(" · ")}</span>
                </div>
              </li>
            )
          })}
        </ul>
        <div className="flex justify-end">
          <WorkbenchButton size="sm" icon={Save} disabled={!rolesDirty} onClick={onSaveRoles}>
            역할 저장
          </WorkbenchButton>
        </div>
      </Section>

      <Section title="기능 권한" aside={presetChip}>
        {isAdminUser ? (
          <p className="m-0 flex items-center gap-[8px] rounded-[8px] bg-brand-bg px-[12px] py-[8px] text-[12.5px] text-brand-3">
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
                      <span className="break-all font-code text-[10px] text-dim">
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
              <WorkbenchButton size="sm" variant="primary" icon={Save} disabled={!featuresDirty} onClick={onSaveFeatures}>
                권한 저장
              </WorkbenchButton>
            </div>
          </>
        )}
      </Section>

      {showPlus && !isAdminUser && (
        <div data-plus>
          <Section
            title="신발 DB 분업"
            aside={<StatePill tone="fact">사람마다 지정</StatePill>}
          >
            <ul className="m-0 grid list-none p-0">
              {DUTY_COLUMNS.map((col) => {
                const id = `${baseId}-duty-${col.key}`
                // 신발 등록 = 서버 기능 SHOE_EDIT(위 기능 권한과 같은 값), 나머지 둘 = 분업 지정(쓰는 쪽 값)
                const checked = col.key === FEATURES.SHOE_EDIT ? draft.features.includes(FEATURES.SHOE_EDIT) : assignedDuties.includes(col.key as ShoeDuty)
                const onChange = (on: boolean) =>
                  col.key === FEATURES.SHOE_EDIT
                    ? onDraftChange({ features: toggleFeature(draft.features, FEATURES.SHOE_EDIT, on) })
                    : onToggleDuty?.(col.key as ShoeDuty, on)
                return <DutyToggle key={col.key} id={id} col={col} checked={checked} onChange={onChange} />
              })}
            </ul>
            <span className="text-[11px] text-dim">여러 개 켤 수 있음 · 신발 DB 「승인」은 신발 승인이 켜진 사람만</span>
          </Section>
        </div>
      )}

      {/* R6: 설명 줄 대신 단추 한 줄 — 무엇을 하는지는 마우스 설명(title) */}
      <Section title="계정 관리">
        <div className="flex flex-wrap items-center gap-[6px]">
          <WorkbenchButton size="sm" icon={KeyRound} title="임시 비밀번호를 정하고, 열린 로그인을 모두 끝냅니다" onClick={onResetPassword}>
            비밀번호 초기화
          </WorkbenchButton>
          {status === "LOCKED" && (
            <WorkbenchButton size="sm" variant="primary" icon={LockOpen} title="연속 실패로 잠긴 계정을 다시 로그인할 수 있게 합니다" onClick={onUnlock}>
              잠금 해제
            </WorkbenchButton>
          )}
          {user.useAt === "N" ? (
            <WorkbenchButton size="sm" icon={Power} title="중지된 계정이 다시 로그인할 수 있게 합니다" onClick={() => onSetUseAt("Y")}>
              다시 사용
            </WorkbenchButton>
          ) : (
            !isSelf && (
              <WorkbenchButton
                size="sm"
                variant="ghost"
                icon={PowerOff}
                title="로그인할 수 없게 합니다. 지난 기록은 그대로 남습니다"
                className="ml-auto hover:text-danger"
                onClick={() => onSetUseAt("N")}
              >
                사용 중지
              </WorkbenchButton>
            )
          )}
        </div>
      </Section>
    </section>
  )
}
