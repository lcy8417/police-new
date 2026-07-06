import { cn } from "@/shared/lib/utils"

/** Faint dot-grid texture for empty dark-navy background areas. */
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
