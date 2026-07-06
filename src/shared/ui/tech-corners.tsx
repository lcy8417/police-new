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
export function TechCorners({ className, size = 18, active = false }: TechCornersProps) {
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
