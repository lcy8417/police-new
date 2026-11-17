import { useState } from "react"
import { KeyRound, LogOut } from "lucide-react"
import { Link } from "react-router-dom"

import { PASSWORD_PATH, logoutAndReload } from "@/features/auth"
import { cn } from "@/shared/lib/utils"

// 위 막대 오른쪽 계정 단추 둘 — 비밀번호 변경 · 로그아웃(옛 사이드바 아래 칸을 옮긴 것).
// 막대 단추와 같은 결(높이 30 · 모서리 9 · 종이색 75%, 남색 위 초점 = 종이색 테).
const BAR_ICON_BTN =
  "inline-flex h-[30px] shrink-0 cursor-pointer items-center gap-1.5 rounded-[9px] border-0 bg-transparent px-2 text-[12px] font-bold whitespace-nowrap text-paper/75 no-underline transition-colors duration-150 hover:bg-paper/14 hover:text-paper disabled:cursor-default disabled:opacity-50 motion-reduce:transition-none " +
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-paper"

export function AccountActions() {
  const [loggingOut, setLoggingOut] = useState(false)

  // 서버 세션을 닫고 `/login` 으로 전체 새로고침(옛 사이드바와 같은 동작)
  const handleLogout = () => {
    if (loggingOut) return
    setLoggingOut(true)
    void logoutAndReload()
  }

  return (
    <span className="flex shrink-0 items-center gap-0.5">
      <Link to={PASSWORD_PATH} aria-label="비밀번호 변경" title="비밀번호 변경" className={BAR_ICON_BTN}>
        <KeyRound aria-hidden className="size-[15px]" strokeWidth={1.8} />
      </Link>
      <button
        type="button"
        aria-label="로그아웃"
        title="로그아웃"
        disabled={loggingOut}
        onClick={handleLogout}
        className={cn(BAR_ICON_BTN)}
      >
        <LogOut aria-hidden className="size-[15px]" strokeWidth={1.8} />
      </button>
    </span>
  )
}
