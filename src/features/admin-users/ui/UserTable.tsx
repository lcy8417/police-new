import type { KeyboardEvent } from "react"
import { Loader2, UserPlus, Users } from "lucide-react"

import type { AdminUser, RoleInfo } from "@/entities/admin"
import { formatKstDateTime } from "@/shared/lib"
import { cn } from "@/shared/lib/utils"
import { Button, StatusChip, TechCorners, type StatusChipTone } from "@/shared/ui"

import { USER_STATUS_LABELS, roleNames, userStatus, type UserStatus } from "../model/user-rules"

const STATUS_TONE: Record<UserStatus, StatusChipTone> = {
  ACTIVE: "teal",
  LOCKED: "amber",
  DISABLED: "gray",
}

// 새 열은 맨 끝에(SCAS 열 순서 유지 — police-ui-design 원칙).
const COLUMNS = ["아이디", "이름", "구분", "상태", "마지막 로그인", "관서", "역할"] as const

export interface UserTableProps {
  users: AdminUser[]
  /** 선택된 사용자 ID(없으면 `null`). */
  selectedUserId: string | null
  isLoading: boolean
  onSelect: (userId: string) => void
  /** "사용자 추가" 버튼. */
  onCreate: () => void
  /** 역할 이름표(`GET /admin/roles`) — 아직 못 읽었으면 빈 목록(역할 코드를 그대로 보인다). */
  roles?: RoleInfo[]
}

/** 계정 구분 칩 — 관리자 = blue, 사용자 = 회색. */
export function UserSeChip({ userSe }: { userSe: AdminUser["userSe"] }) {
  return userSe === "ADMIN" ? (
    <StatusChip tone="blue">관리자</StatusChip>
  ) : (
    <StatusChip tone="gray">사용자</StatusChip>
  )
}

/** 계정 상태 칩 — 사용 = teal / 잠금 = amber / 중지 = 회색. */
export function UserStatusChip({ user }: { user: Pick<AdminUser, "useAt" | "lockAt"> }) {
  const status = userStatus(user)
  return <StatusChip tone={STATUS_TONE[status]}>{USER_STATUS_LABELS[status]}</StatusChip>
}

/**
 * 사용자 표(`/manage/users` 왼쪽) — 아이디·이름·구분·상태·마지막 로그인(KST)·관서·역할.
 * 행을 누르거나(키보드: Enter·Space) 고르면 오른쪽 상세 패널이 열린다.
 */
export function UserTable({
  users,
  selectedUserId,
  isLoading,
  onSelect,
  onCreate,
  roles = [],
}: UserTableProps) {
  const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, userId: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onSelect(userId)
    }
  }

  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
      <TechCorners size={22} />

      <div className="flex items-center justify-between gap-3 border-b border-[#141D2C] bg-[#0D1420]/60 px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold text-[#E5E9F0]">사용자</span>
          <span className="rounded-md border border-[#3B82F6]/40 bg-[#152238] px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-[#4A9EFF]">
            {isLoading ? "…" : `${users.length}명`}
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={onCreate}
          className="bg-[#3B82F6] text-white hover:bg-[#2563EB] focus-visible:ring-[#3B82F6]/50"
        >
          <UserPlus aria-hidden="true" />
          사용자 추가
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table aria-label="사용자 목록" className="w-full border-collapse text-left text-[13px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#0D1420]">
              {COLUMNS.map((label) => (
                <th
                  key={label}
                  scope="col"
                  className="border-b border-[#1E2A3C] px-4 py-2.5 text-[12px] font-medium whitespace-nowrap text-[#8A93A6]"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-[#5B6B85]">
                    <Loader2 className="size-7 animate-spin text-[#4A9EFF]" aria-hidden="true" />
                    <span className="text-[13px] font-medium">사용자 목록을 불러오는 중...</span>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-[#5B6B85]">
                    <Users className="size-7" aria-hidden="true" />
                    <span className="text-[13px] font-medium">등록된 사용자가 없습니다.</span>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isSelected = user.userId === selectedUserId
                return (
                  <tr
                    key={user.userId}
                    tabIndex={0}
                    aria-selected={isSelected}
                    onClick={() => onSelect(user.userId)}
                    onKeyDown={(event) => handleRowKeyDown(event, user.userId)}
                    className={cn(
                      "cursor-pointer border-b border-[#141D2C] transition-colors outline-none focus-visible:bg-[#141F30] focus-visible:shadow-[inset_0_0_0_1px_rgba(59,130,246,0.7)]",
                      isSelected
                        ? "bg-[#152238]/60 shadow-[inset_2px_0_0_0_rgba(74,158,255,0.9)]"
                        : "hover:bg-[#141F30] hover:shadow-[inset_2px_0_0_0_rgba(59,130,246,0.6)]"
                    )}
                  >
                    <td className="px-4 py-2.5 font-mono font-medium whitespace-nowrap text-[#4A9EFF]">
                      {user.userId}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-2.5 whitespace-nowrap",
                        isSelected ? "text-[#E5E9F0]" : "text-[#C7CEDB]"
                      )}
                    >
                      {user.userNm}
                    </td>
                    <td className="px-4 py-2.5">
                      <UserSeChip userSe={user.userSe} />
                    </td>
                    <td className="px-4 py-2.5">
                      <UserStatusChip user={user} />
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[12px] whitespace-nowrap tabular-nums text-[#8A93A6]">
                      {user.lastLoginDt ? formatKstDateTime(user.lastLoginDt) : "—"}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-fg-2">{user.orgNm}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">
                      {roleNames(user.roles, roles) ?? "—"}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
