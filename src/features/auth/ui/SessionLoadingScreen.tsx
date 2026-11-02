import { Loader2 } from "lucide-react"

import { DotGrid } from "@/shared/ui/glow-fx"

/** 세션 확인 중(앱 시작 직후 `GET /auth/me`) 전체 화면 로딩. */
export function SessionLoadingScreen() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[#060B14]"
    >
      <DotGrid />
      <div className="relative flex items-center gap-3 text-[13px] text-[#8A93A6]">
        <Loader2 className="size-4 animate-spin text-[#4A9EFF]" aria-hidden="true" />
        세션 확인 중…
      </div>
    </div>
  )
}
