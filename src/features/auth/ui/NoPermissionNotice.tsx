import { useState } from "react"
import { LogOut, ShieldAlert } from "lucide-react"

import { Button, TechCorners } from "@/shared/ui"

import { logoutAndReload } from "../model/logout"

/**
 * 허용된 화면이 하나도 없는 사용자에게 보이는 안내(설계서 §2) — 사이드바 메뉴도 모두 숨겨진
 * 상태라, 할 수 있는 일은 관리자에게 권한을 받는 것과 로그아웃뿐이다.
 */
export function NoPermissionNotice() {
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = () => {
    setLoggingOut(true)
    void logoutAndReload()
  }

  return (
    <div className="flex h-full min-h-[60vh] w-full items-center justify-center p-6">
      <section
        role="alert"
        className="relative w-full max-w-[400px] rounded-lg border border-[#1E2A3C] bg-[#0B121D] px-8 py-10 text-center shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
      >
        <TechCorners size={14} />
        <ShieldAlert className="mx-auto size-10 text-[#F59E0B]" aria-hidden="true" />
        <p className="mt-4 text-[15px] font-semibold text-[#E5E9F0]">
          권한이 없습니다. 관리자에게 문의하세요
        </p>
        <p className="mt-2 text-[12px] text-[#8A93A6]">
          사용할 수 있는 기능이 아직 지정되지 않은 계정입니다.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-6 h-10 w-full border-[#26334A] bg-transparent text-[#C7CEDB] hover:bg-white/5 hover:text-white focus-visible:border-[#3B82F6] focus-visible:ring-[#3B82F6]/40"
        >
          <LogOut aria-hidden="true" />
          로그아웃
        </Button>
      </section>
    </div>
  )
}
