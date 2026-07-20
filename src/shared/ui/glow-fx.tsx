import { cn } from "@/shared/lib/utils"

/** Faint dot-grid texture for empty dark-navy background areas. */
// @MX:ANCHOR: [AUTO] DotGrid/GlowOrb/EdgeGlow - forensic 커맨드센터 배경 장식 3종 세트, 9개 위치에서 참조(TechCorners와 함께 시그니처 통일 담당)
// @MX:REASON: fan_in 9 — CLAUDE.md에 명시된 "TechCorners·DotGrid/GlowOrb로 시그니처 통일" 관례의 구현 지점
export function DotGrid({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        backgroundImage: "radial-gradient(circle, rgba(74,158,255,0.16) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        maskImage: "radial-gradient(ellipse 80% 60% at 50% 35%, black 15%, transparent 75%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 35%, black 15%, transparent 75%)",
      }}
    />
  )
}

/** Soft blurred glow orb suggesting ambient particle light in empty UI space. */
export function GlowOrb({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("pointer-events-none absolute rounded-full blur-3xl", className)} />
}

/** Thin animated-feeling hairline used to trace panel/nav edges with light. */
// @MX:NOTE: [AUTO] 헥스 컬러 하드코딩(#4A9EFF) - CLAUDE.md 문서화된 forensic 팔레트 액센트 blue, TechCorners와 동일 값이 이 파일에도 별도 하드코딩됨
export function EdgeGlow({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute h-px bg-gradient-to-r from-transparent via-[#4A9EFF]/70 to-transparent",
        className
      )}
    />
  )
}
