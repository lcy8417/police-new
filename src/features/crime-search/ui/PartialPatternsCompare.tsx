import { useState } from "react"
import { Camera, ChevronLeft, ChevronRight, Database, ImageOff } from "lucide-react"

import { TechCorners } from "@/shared/ui/tech-corners"
import { cn } from "@/shared/lib/utils"

/**
 * 문양 한 건. 범죄 패턴은 `[경로, 필수플래그]` 튜플, 신발 패턴은 경로 문자열이라
 * 두 표현을 모두 허용한다(레거시 `PatternList`의 분기와 동일한 규약).
 */
type PatternSrc = string | readonly [string, unknown]

/** 비교 대상 한 열(예: "현장패턴" / "DB패턴")의 상·중·하·윤곽 문양 묶음. */
export interface PatternCompareGroup {
  title: string
  top: PatternSrc[]
  mid: PatternSrc[]
  bottom: PatternSrc[]
  outline: PatternSrc[]
}

export interface PartialPatternsCompareProps {
  /** 좌우로 나란히 비교할 문양 묶음들(현장패턴 vs DB패턴 등). */
  patternItems: PatternCompareGroup[]
  className?: string
}

/** 한국어 부위 라벨 → 데이터 키. 레거시 `PartialPatterns`의 매핑을 유지한다. */
const KIND_MAPPING = {
  상: "top",
  중: "mid",
  하: "bottom",
  윤곽: "outline",
} as const

type KindLabel = keyof typeof KIND_MAPPING
const KINDS = Object.keys(KIND_MAPPING) as KindLabel[]

/** 튜플/문자열 어느 표현이든 이미지 경로만 뽑는다. */
function srcPath(src: PatternSrc): string {
  return typeof src === "string" ? src : src[0]
}

/** 범죄 패턴 튜플의 필수플래그(요소 [1])가 켜졌는지 — 켜지면 강조 테두리. */
function isEssential(src: PatternSrc): boolean {
  return typeof src !== "string" && Boolean(src[1])
}

/**
 * 현장패턴 vs DB패턴 문양 비교(프레젠테이셔널, 다크 커맨드센터 톤). 레거시
 * `PartialPatterns`(흰 배경 + `PatternList`/`Button`)를 대체하며, 사건이력
 * 화면이 사용한다. Phase 3 `ResultDetail`도 재사용할 수 있도록 features 계층에
 * 공용으로 둔다. 상/중/하/윤곽 부위를 좌우 화살표로 전환한다.
 */
export function PartialPatternsCompare({
  patternItems,
  className,
}: PartialPatternsCompareProps) {
  const [currentPartial, setCurrentPartial] = useState<KindLabel>("상")

  const movePartial = (dir: -1 | 1) => {
    const currentIndex = KINDS.indexOf(currentPartial)
    setCurrentPartial(KINDS[(currentIndex + dir + KINDS.length) % KINDS.length])
  }

  const zoneKey = KIND_MAPPING[currentPartial]

  return (
    <section
      className={cn(
        "relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]",
        className
      )}
    >
      <TechCorners size={22} />

      {/* 헤더: 부위 전환 화살표 + 제목 */}
      <div className="flex items-center justify-between border-b border-[#141D2C] bg-[#0D1420]/60 px-6 py-3.5">
        <button
          type="button"
          onClick={() => movePartial(-1)}
          aria-label="이전 부위"
          className="flex size-8 items-center justify-center rounded-md border border-[#1E2A3C] bg-[#0F1826] text-[#C7CEDB] transition-colors hover:border-[#3B82F6]/50 hover:bg-[#141F30] hover:text-white"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-semibold text-[#E5E9F0]">문양 비교</span>
          <span className="rounded-md border border-[#3B82F6]/50 bg-[#152238] px-2.5 py-0.5 font-mono text-[13px] font-semibold text-[#4A9EFF]">
            {currentPartial}
          </span>
          {/* 필수플래그 범례 — 아래 썸네일의 붉은 점이 무엇을 뜻하는지 명시한다. */}
          <span className="hidden items-center gap-1.5 rounded-md border border-[#1E2A3C] bg-[#0F1826] px-2 py-0.5 font-mono text-[10px] tracking-wide text-[#8A93A6] uppercase sm:flex">
            <span
              className="size-1.5 rounded-full bg-[#EF4444] shadow-[0_0_5px_rgba(239,68,68,0.7)]"
              aria-hidden="true"
            />
            필수
          </span>
        </div>
        <button
          type="button"
          onClick={() => movePartial(1)}
          aria-label="다음 부위"
          className="flex size-8 items-center justify-center rounded-md border border-[#1E2A3C] bg-[#0F1826] text-[#C7CEDB] transition-colors hover:border-[#3B82F6]/50 hover:bg-[#141F30] hover:text-white"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>

      {/* 비교 열: patternItems를 좌우로 나란히 표시 */}
      <div className="grid min-h-0 flex-1 auto-cols-fr grid-flow-col gap-4 overflow-y-auto p-5">
        {patternItems.map((item, index) => {
          const patterns = item?.[zoneKey] ?? []
          // 현장(카메라 촬영) 열과 DB(등록 신발) 열을 아이콘으로 구분한다 —
          // 인덱스가 아니라 제목으로 판별해 향후 재사용 시에도 안전하게 맞는다.
          const isSceneColumn = item.title.includes("현장")
          return (
            <div
              key={index}
              className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#1E2A3C] bg-[#0F1826]"
            >
              <div className="flex items-center gap-1.5 border-b border-[#141D2C] bg-[#0D1420]/60 px-4 py-2.5">
                {isSceneColumn ? (
                  <Camera className="size-3.5 text-[#4A9EFF]" aria-hidden="true" />
                ) : (
                  <Database className="size-3.5 text-[#4A9EFF]" aria-hidden="true" />
                )}
                <span className="text-[13px] font-semibold text-[#C7CEDB]">
                  {item.title}
                </span>
              </div>
              {patterns.length > 0 ? (
                <div className="grid auto-rows-max grid-cols-3 gap-2.5 overflow-y-auto p-4 sm:grid-cols-4">
                  {patterns.map((src, i) => (
                    <div
                      key={i}
                      className={cn(
                        "relative aspect-square overflow-hidden rounded-lg border bg-[#05080D]",
                        isEssential(src) ? "border-[#EF4444]/30" : "border-[#1E2A3C]"
                      )}
                    >
                      <img
                        src={srcPath(src)}
                        alt={`${item.title} ${currentPartial} 문양 ${i + 1}`}
                        className="absolute inset-0 size-full object-contain p-2"
                      />
                      {/* 필수플래그: 전면 글로우 테두리 대신 코너 점으로 절제해 표시한다. */}
                      {isEssential(src) && (
                        <span
                          aria-hidden="true"
                          className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-[#EF4444] shadow-[0_0_5px_rgba(239,68,68,0.7)]"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-[#5B6B85]">
                  <ImageOff className="size-7" aria-hidden="true" />
                  <span className="text-xs font-medium">문양 없음</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
