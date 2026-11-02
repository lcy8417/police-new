import { useCallback, useMemo, useState } from "react"
import { MousePointerClick } from "lucide-react"

import {
  CreateUserDialog,
  UserDetailPanel,
  UserTable,
  useUsersQuery,
} from "@/features/admin-users"
import { refreshSession, useSessionStore } from "@/features/auth"
import { usePageHeader } from "@/widgets/app-shell"
import { DotGrid, GlowOrb, TechCorners } from "@/shared/ui"

/**
 * 관리자 화면 `/manage/users`(설계서 §7-3) — 왼쪽 사용자 표 + 오른쪽 선택한 사용자 상세.
 * 본인 계정을 고친 경우에만 세션을 다시 확인한다(`refreshSession` — 이름·권한이 메뉴에 반영).
 */
export function ManageUsersPage() {
  const me = useSessionStore((s) => s.user)
  const usersQuery = useUsersQuery()
  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const selectedUser = users.find((user) => user.userId === selectedUserId)
  const myUserId = me?.userId ?? null

  const handleUserChanged = useCallback(
    (userId: string) => {
      if (userId === myUserId) void refreshSession()
    },
    [myUserId]
  )

  const headerTitle = useMemo(
    () => (
      <div className="flex flex-col justify-center gap-1">
        <span className="text-[28px] leading-none font-bold text-white">사용자·권한 관리</span>
        <span className="text-[13px] leading-none font-normal text-[#8A93A6]">
          계정을 추가하고, 사용자마다 쓸 수 있는 기능을 켜고 끕니다.
        </span>
      </div>
    ),
    []
  )
  usePageHeader({ title: headerTitle })

  return (
    <div className="relative h-[calc(100vh-110px)] w-full overflow-hidden bg-background px-6 py-6">
      <DotGrid />
      <GlowOrb className="-top-24 right-1/4 h-72 w-72 bg-[#2563EB]/10" />
      <GlowOrb className="bottom-0 left-1/3 h-64 w-64 bg-[#4A9EFF]/8" />

      <div className="relative grid h-full min-h-0 grid-cols-[minmax(0,1fr)_420px] gap-4">
        <UserTable
          users={users}
          selectedUserId={selectedUserId}
          isLoading={usersQuery.isLoading}
          onSelect={setSelectedUserId}
          onCreate={() => setCreateOpen(true)}
        />

        {selectedUser ? (
          <UserDetailPanel
            key={selectedUser.userId}
            user={selectedUser}
            currentUserId={myUserId}
            onUserChanged={handleUserChanged}
          />
        ) : (
          <section
            aria-label="사용자 상세"
            className="relative flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#1E2A3C] bg-[#0B121D]/70 text-center"
          >
            <TechCorners size={22} />
            <MousePointerClick className="size-8 text-[#2A3850]" aria-hidden="true" />
            <p className="text-[13px] font-medium text-[#8A93A6]">왼쪽 표에서 사용자를 선택하세요.</p>
            <p className="text-[11px] text-[#5B6B85]">기능 권한·비밀번호·잠금 상태를 여기서 바꿉니다.</p>
          </section>
        )}
      </div>

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={setSelectedUserId}
        onUserChanged={handleUserChanged}
      />
    </div>
  )
}
