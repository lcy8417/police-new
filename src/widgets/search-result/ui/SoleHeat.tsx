import { HeatOverlay, type HeatVariant } from "@/shared/ui/viewer"

// 밑창 그림(object-contain, 밑창 비율 100:264) 위에 일치 부위 히트 그림을 얹는다(시안 sole({ heat }) 자리).
// 상자보다 밑창이 좁으므로 가운데 밑창 비율 칸에 맞춘다. 순수 장식(pointer-events-none).
export function SoleHeat({ variant = "spots" }: { variant?: HeatVariant }) {
  return (
    <span
      data-sole-heat
      className="pointer-events-none absolute inset-y-0 left-1/2 aspect-[100/264] h-full -translate-x-1/2"
    >
      <HeatOverlay variant={variant} />
    </span>
  )
}
