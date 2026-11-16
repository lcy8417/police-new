import { memo, useLayoutEffect, useRef, useState, type ReactNode } from "react"

import { Panel } from "@/shared/ui/panel"

import { liveBlink, railBar, railLabel } from "../lib/demo-motion"
import { DemoClockContext, useDemoAnim, useDemoOrigin } from "../model/demo-clock"
import { DEMO_STEPS, type DemoStep } from "../model/demo-script"
import type { DemoScreen, LoginDemoArt } from "../model/types"
import { CompareCard, DEMO_CARDS_WIDTH, ExtractCard, ReportCard, SearchCard } from "./DemoCards"

// S00 「AI 감정 시연」 칸(시안 핀 7): 단계 줄 6칸 + 카드 4장이 14초마다 반복한다.
// 움직임 줄이기 · animate 미지원이면 시계가 꺼지고 모든 요소가 다 끝난 모양으로 멈춘다.

function RailStep({ step, index, onOpen }: { step: DemoStep; index: number; onOpen?: (screen: DemoScreen) => void }) {
  const labelRef = useDemoAnim<HTMLSpanElement>(railLabel(step.start, step.end))
  const barRef = useDemoAnim<HTMLSpanElement>(railBar(step.start, step.end))
  const code = step.screen.toUpperCase()
  return (
    <button
      type="button"
      title={`${code} 화면 열기`}
      onClick={() => onOpen?.(step.screen)}
      className="grid min-w-0 cursor-pointer gap-[5px] border-0 bg-transparent p-0 text-left text-inherit"
    >
      <span ref={labelRef} className="flex items-baseline gap-[6px] text-fg-2">
        <b className="font-code text-[11px]">0{index + 1}</b>
        <b className="text-[12.5px] whitespace-nowrap">{step.title}</b>
        <span className="ml-auto font-code text-[10.5px] text-dim">{step.time}</span>
      </span>
      <span className="relative h-[3px] rounded-[2px] bg-border">
        <span ref={barRef} className="absolute inset-y-0 left-0 w-full rounded-[2px] bg-[linear-gradient(90deg,var(--t-brand-2),var(--t-ai))]" />
      </span>
      <span className="flex justify-between text-[10.5px] text-dim">
        <span>{step.sub}</span>
        <span className="font-code">{code}</span>
      </span>
    </button>
  )
}

/** 원래 폭(width)보다 좁은 칸에서는 내용을 통째로 줄여 넣는다(배율 · 높이는 재서 계산하는 위치값) */
function FitWidth({ width, children }: { width: number; children: ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState<{ scale: number; height: number } | null>(null)

  useLayoutEffect(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner || typeof ResizeObserver === "undefined") return
    const update = () => {
      const scale = Math.min(1, outer.clientWidth / width)
      setFit(scale < 1 ? { scale, height: inner.offsetHeight * scale } : null)
    }
    const ro = new ResizeObserver(update)
    ro.observe(outer)
    ro.observe(inner)
    update()
    return () => ro.disconnect()
  }, [width])

  return (
    <div ref={outerRef} className="min-w-0" style={fit ? { height: fit.height } : undefined}>
      <div ref={innerRef} className="w-max origin-top-left" style={fit ? { transform: `scale(${fit.scale})` } : undefined}>
        {children}
      </div>
    </div>
  )
}

function LiveBadge() {
  const dotRef = useDemoAnim<HTMLSpanElement>(liveBlink)
  return (
    <span className="ml-auto inline-flex items-center gap-[6px] text-[11px] text-muted-foreground">
      <span ref={dotRef} aria-hidden="true" className="size-[7px] rounded-full bg-danger [box-shadow:0_0_8px_0_var(--t-danger)]" />
      자동 재생 · 전체 <b className="font-code text-fg-2">9.1초</b> (예시)
    </span>
  )
}

export interface LoginDemoProps {
  art: LoginDemoArt
  onOpenStep?: (screen: DemoScreen) => void
  /** 앱 「움직임 줄이기」 — 켜면 시연이 다 끝난 모양으로 멈춘다(운영체제 설정과 함께 본다) */
  reducedMotion?: boolean
}

export const LoginDemo = memo(function LoginDemo({ art, onOpenStep, reducedMotion = false }: LoginDemoProps) {
  const origin = useDemoOrigin(reducedMotion)
  return (
    <DemoClockContext.Provider value={origin}>
      <Panel
        corners
        label="LIVE DEMO"
        aria-label="AI 감정 시연"
        role="region"
        data-demo-motion={origin === null ? "still" : "running"}
        className="bg-panel/92"
        actions={
          <>
            <h2 className="border-none text-[13px] font-semibold">AI 감정 흐름 — 사건 00001-25-0649 · 현장 이미지 _2</h2>
            <LiveBadge />
          </>
        }
      >
        <div className="px-[16px] pt-[14px] pb-[16px]">
          {/* 단계 줄과 카드는 시안 1440 폭(898px)에서 짜인 그대로, 좁으면 함께 줄인다 */}
          <FitWidth width={DEMO_CARDS_WIDTH}>
            <div className="grid w-[898px] gap-[14px]">
              <div className="grid grid-cols-6 gap-[12px]">
                {DEMO_STEPS.map((s, i) => (
                  <RailStep key={s.screen} step={s} index={i} onOpen={onOpenStep} />
                ))}
              </div>
              <div className="flex items-stretch gap-[14px]">
                <ExtractCard art={art} />
                <SearchCard art={art} />
                <CompareCard art={art} />
                <ReportCard art={art} />
              </div>
            </div>
          </FitWidth>
        </div>
      </Panel>
    </DemoClockContext.Provider>
  )
})
