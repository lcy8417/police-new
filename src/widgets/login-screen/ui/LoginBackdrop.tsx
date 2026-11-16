import { GlowOrb } from "@/shared/ui/kit"

import { SOLE_OUTLINE } from "../lib/sole-outline"

// S00 바탕 장식(시안: 점 격자 + 빛 번짐 2개 + 큰 밑창 윤곽). 모두 pointer-events-none 이다.
// kit DotGrid 는 인라인 style 색이라 쓰지 않고, 같은 점 격자를 토큰으로 이 화면 안에서 그린다.
// 큰 밑창 윤곽은 r3 시안이 더한 것이라 신규 요소(showPlus)와 함께만 보인다.
export function LoginBackdrop({ showPlus }: { showPlus: boolean }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        data-backdrop="dot-grid"
        className={
          "absolute inset-0 bg-[radial-gradient(color-mix(in_srgb,var(--t-brand)_18%,transparent)_1px,transparent_1px)] " +
          "bg-[length:24px_24px] [mask-image:radial-gradient(ellipse_at_35%_45%,black_0%,transparent_75%)]"
        }
      />
      <GlowOrb className="-top-[200px] left-[12%] h-[520px] w-[620px] bg-brand-3/16 blur-[90px]" />
      <GlowOrb className="-right-[140px] -bottom-[180px] size-[480px] bg-ai/8 blur-[90px]" />
      {showPlus && (
        <div data-plus className="absolute inset-y-0 left-1/2 w-full max-w-[1440px] -translate-x-1/2">
          <svg
            viewBox="0 0 100 264"
            className="absolute -top-[60px] right-[300px] h-[870px] w-[330px] opacity-5 [transform:rotate(14deg)]"
          >
            <path d={SOLE_OUTLINE} fill="none" className="stroke-brand" strokeWidth={0.5} />
            <path d="M50 18C72 18 82 40 82 72C82 104 72 124 70 150" fill="none" className="stroke-brand" strokeWidth={0.3} strokeDasharray="2 2" />
          </svg>
        </div>
      )}
    </div>
  )
}
