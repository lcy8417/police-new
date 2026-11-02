import { useId, type ReactNode } from "react"
import { Footprints } from "lucide-react"

import { TechCorners } from "@/shared/ui"
import { DotGrid, EdgeGlow, GlowOrb } from "@/shared/ui/glow-fx"

interface AuthScreenProps {
  /** 카드 제목(예 "족적 감정 플랫폼"). */
  title: string
  /** 제목 아래 보조 설명. */
  description?: ReactNode
  children: ReactNode
}

/**
 * 로그인·비밀번호 변경 화면 공통 틀 — 앱 셸 없이 전체 화면 `#060B14` 바탕(점 격자 + 빛 번짐 2개)
 * 가운데에 최대 400px 카드 1장(설계서 §7). 카드 모서리는 커맨드센터 시그니처 `TechCorners`.
 */
export function AuthScreen({ title, description, children }: AuthScreenProps) {
  const titleId = useId()

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#060B14] px-4 py-10 text-[#E5E9F0] [color-scheme:dark]">
      <DotGrid />
      <GlowOrb className="-top-40 left-[8%] h-[28rem] w-[28rem] bg-[#2563EB]/15" />
      <GlowOrb className="-right-24 -bottom-32 h-96 w-96 bg-[#4A9EFF]/10" />

      <div className="relative w-full max-w-[400px]">
        <section
          aria-labelledby={titleId}
          className="relative rounded-xl border border-[#1E2A3C] bg-[#0B121D]/95 px-8 pt-9 pb-8 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-sm"
        >
          <TechCorners size={16} />
          <EdgeGlow className="inset-x-10 top-0" />

          <header className="mb-7">
            <div className="mb-5 flex size-11 items-center justify-center rounded-lg border border-[#3B82F6]/40 bg-[#152238] shadow-[0_0_24px_rgba(37,99,235,0.3)]">
              <Footprints className="size-5 text-[#4A9EFF]" aria-hidden="true" />
            </div>
            <p className="text-[10px] font-semibold tracking-[0.28em] text-[#4A9EFF]">
              FORENSIC FOOTWEAR PLATFORM
            </p>
            <h1 id={titleId} className="mt-2 text-[22px] font-semibold tracking-tight text-[#F1F4F9]">
              {title}
            </h1>
            {description && <div className="mt-1.5 text-[13px] text-[#8A93A6]">{description}</div>}
          </header>

          {children}
        </section>

        <p className="mt-5 text-center text-[11px] text-[#4C5670]">
          인가된 사용자만 접근할 수 있으며, 모든 사용 기록이 저장됩니다.
        </p>
      </div>
    </main>
  )
}
