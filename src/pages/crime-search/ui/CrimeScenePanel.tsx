import { useState } from "react"
import { Crosshair, ImageOff } from "lucide-react"

import { TechCorners } from "@/shared/ui/tech-corners"

interface CrimeScenePanelProps {
  /** 표시할 현장 이미지(정적 URL 또는 base64). null이면 안내 문구를 보인다. */
  image: string | null
}

/**
 * 검색결과 화면 좌측 "현장 이미지" 패널(프레젠테이셔널). 크롭·회전 등 편집
 * 기능은 crime-register 전용이며, 여기서는 검색 대상 현장 이미지를 다크 뷰포트에
 * 표시만 한다. `EvidenceImagePanel`과 같은 뷰포트 언어(체커보드 눈금·모서리
 * 십자선·하단 상태 표시줄)를 재사용해 두 화면이 한 시스템으로 읽히게 한다.
 */
export function CrimeScenePanel({ image }: CrimeScenePanelProps) {
  const [dimensions, setDimensions] = useState<[number, number]>([0, 0])
  const [width, height] = dimensions

  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
      <TechCorners size={22} />

      {/* 패널 헤더 */}
      <div className="flex items-center justify-between px-6 pt-5">
        <span className="text-[15px] font-semibold text-[#E5E9F0]">현장 이미지</span>
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4A9EFF] opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-[#4A9EFF] shadow-[0_0_8px_2px_rgba(74,158,255,0.8)]" />
        </span>
      </div>

      {/* 검색 소스 표시줄 — EvidenceImagePanel 툴바와 같은 위치·톤(정적 보기). */}
      <div className="mt-4 flex items-center justify-between border-y border-[#141D2C] bg-[#0D1420]/60 px-6 py-2.5">
        <span className="font-mono text-[11px] tracking-[0.14em] text-[#5B6B85] uppercase">
          검색 소스 · 정적 보기
        </span>
        <span className="rounded-md border border-[#1E2A3C] bg-[#0F1826] px-2 py-0.5 font-mono text-[10px] tracking-wide text-[#8A93A6] uppercase">
          Read-Only
        </span>
      </div>

      {/* 뷰포트 */}
      <div className="relative m-6 mt-4 flex min-h-[280px] flex-1 items-center justify-center overflow-hidden rounded-xl border border-[#141D2C] bg-[#05080D]">
        {/* 체커보드 눈금 바 */}
        <div
          className="absolute inset-x-2 top-2 h-[8px] rounded-sm opacity-70"
          style={{
            backgroundImage: "repeating-linear-gradient(90deg, #E5E9F0 0 8px, #0B121D 8px 16px)",
          }}
        />
        <div
          className="absolute inset-y-2 left-2 w-[8px] rounded-sm opacity-70"
          style={{
            backgroundImage: "repeating-linear-gradient(180deg, #E5E9F0 0 8px, #0B121D 8px 16px)",
          }}
        />

        {/* 모서리 십자선 */}
        <Crosshair className="absolute top-4 left-4 size-5 text-[#4A9EFF]/70 drop-shadow-[0_0_4px_rgba(74,158,255,0.6)]" aria-hidden="true" />
        <Crosshair className="absolute top-4 right-4 size-5 text-[#4A9EFF]/70 drop-shadow-[0_0_4px_rgba(74,158,255,0.6)]" aria-hidden="true" />
        <Crosshair className="absolute bottom-4 left-4 size-5 text-[#4A9EFF]/70 drop-shadow-[0_0_4px_rgba(74,158,255,0.6)]" aria-hidden="true" />
        <Crosshair className="absolute right-4 bottom-4 size-5 text-[#4A9EFF]/70 drop-shadow-[0_0_4px_rgba(74,158,255,0.6)]" aria-hidden="true" />

        {image ? (
          <img
            src={image}
            alt="현장 증거 이미지"
            onLoad={(e) => {
              const el = e.currentTarget
              setDimensions([el.naturalWidth, el.naturalHeight])
            }}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-[#5B6B85]">
            <ImageOff className="size-9" aria-hidden="true" />
            <span className="text-sm font-medium">현장 이미지를 불러오는 중...</span>
          </div>
        )}

        <span className="absolute bottom-3 left-12 font-mono text-[10px] tracking-wider text-[#5B6B85]">
          KCSI / Forensic Imaging
        </span>
      </div>

      {/* 상태 표시줄 */}
      <div className="flex items-center gap-3 border-t border-[#141D2C] px-6 py-3">
        <span className="rounded-md border border-[#1E2A3C] bg-[#0F1826] px-2.5 py-1 font-mono text-[11px] tabular-nums text-[#8A93A6]">
          {width} x {height} px
        </span>
        <span className="ml-auto font-mono text-[11px] tracking-wide text-[#6B7688] uppercase">
          Match Source
        </span>
      </div>
    </section>
  )
}
