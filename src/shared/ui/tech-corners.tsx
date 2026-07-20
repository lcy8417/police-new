import { cn } from "@/shared/lib/utils"

interface TechCornersProps {
  className?: string
  size?: number
  active?: boolean
}

/**
 * Signature "command-center" accent: four L-shaped cyan/blue corner brackets
 * anchored to the corners of the nearest positioned ancestor. Purely
 * decorative (aria-hidden) — layer it over any panel or active nav item to
 * read as a live forensic console readout.
 */
// @MX:ANCHOR: [AUTO] TechCorners - forensic 커맨드센터 시그니처 UI, 코드베이스 전역 16개 위치에서 참조되는 장식 컴포넌트
// @MX:REASON: fan_in 16 — shared/ui 중 가장 널리 재사용되는 컴포넌트, 패널/네비 아이템 강조 표현의 단일 출처
export function TechCorners({ className, size = 18, active = false }: TechCornersProps) {
  // @MX:NOTE: [AUTO] 헥스 컬러 하드코딩(#4A9EFF/#3B82F6) - CLAUDE.md에 문서화된 의도적 forensic 다크 팔레트 관례(액센트 blue), Tailwind 토큰화 없이 직접 사용
  const color = active ? "#4A9EFF" : "#3B82F6"
  const glow = active
    ? "drop-shadow-[0_0_5px_rgba(74,158,255,0.9)]"
    : "drop-shadow-[0_0_3px_rgba(59,130,246,0.6)]"
  const style = { width: size, height: size, borderColor: color }

  return (
    <div className={cn("pointer-events-none absolute inset-0 z-10", className)} aria-hidden="true">
      <span className={cn("absolute top-0 left-0 rounded-tl-[4px] border-t-2 border-l-2", glow)} style={style} />
      <span className={cn("absolute top-0 right-0 rounded-tr-[4px] border-t-2 border-r-2", glow)} style={style} />
      <span className={cn("absolute bottom-0 left-0 rounded-bl-[4px] border-b-2 border-l-2", glow)} style={style} />
      <span className={cn("absolute right-0 bottom-0 rounded-br-[4px] border-r-2 border-b-2", glow)} style={style} />
    </div>
  )
}
