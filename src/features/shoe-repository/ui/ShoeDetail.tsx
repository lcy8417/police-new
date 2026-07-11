import { useState } from "react"
import { Database, Footprints, ImageOff } from "lucide-react"

import type { Shoe } from "@/entities/shoe"
import type { PatternZone } from "@/entities/pattern"
import { TechCorners } from "@/shared/ui/tech-corners"
import { cn } from "@/shared/lib/utils"

/** 한국어 부위 라벨 ↔ 데이터 키. 상/중/하/윤곽 4부위를 한눈에 나란히 보여준다. */
const ZONES: { label: string; key: PatternZone }[] = [
  { label: "상", key: "top" },
  { label: "중", key: "mid" },
  { label: "하", key: "bottom" },
  { label: "윤곽", key: "outline" },
]

interface ShoeDetailProps {
  /** 리스트에서 선택된 신발. 미선택(`null`/`undefined`)이면 안내 폴백을 렌더한다. */
  shoe: Shoe | null | undefined
}

interface InfoFieldProps {
  label: string
  value: string | number | null | undefined
}

/**
 * 신발정보 한 항목(라벨 + 값). `CrimeDetailPage#InfoField`와 같은 규약 —
 * 값이 비어도 라벨은 항상 보이고 값 자리엔 `-` 플레이스홀더를 둔다.
 */
function InfoField({ label, value }: InfoFieldProps) {
  const isEmpty = value === null || value === undefined || value === ""
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[10px] tracking-wide text-[#5B6B85] uppercase">
        {label}
      </span>
      <span
        className={cn(
          "text-[13px] font-semibold",
          isEmpty ? "text-[#5B6B85]" : "text-[#C7CEDB]"
        )}
      >
        {isEmpty ? "-" : value}
      </span>
    </div>
  )
}

/**
 * 신발 조회 화면의 선택 상세(우측). 측면 이미지 뷰포트 + 문양 비교 + 신발정보
 * 그리드를 세로로 쌓는다. `ResultDetailPage`/`CrimeDetailPage`의 뷰포트·InfoField
 * 톤을 그대로 재사용한 읽기 전용 패널 — 업로드/편집 컨트롤은 없다(편집은 페이지
 * 헤더 [편집] 액션으로 일원화).
 */
export function ShoeDetail({ shoe }: ShoeDetailProps) {
  // 이미지 로드 후 실측 픽셀 치수 — 뷰포트 하단 상태바에 표시(형제 화면과 동일 언어).
  const [dimensions, setDimensions] = useState<[number, number]>([0, 0])

  if (!shoe) {
    return (
      <div className="relative flex h-full min-h-0 flex-col items-center justify-center overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
        <TechCorners size={22} />
        <div className="flex flex-col items-center gap-3 text-[#5B6B85]">
          <Footprints className="size-9" aria-hidden="true" />
          <span className="text-sm font-medium">신발을 선택하세요</span>
        </div>
      </div>
    )
  }

  return (
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1.6fr)_minmax(0,1.1fr)_auto] gap-5">
      {/* 측면 이미지 뷰포트(읽기 전용) */}
      <section className="relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
        <TechCorners size={22} />
        <div className="flex items-center justify-between px-6 pt-5">
          <span className="text-[15px] font-semibold text-[#E5E9F0]">측면 이미지</span>
          <span className="rounded-md border border-[#1E2A3C] bg-[#0F1826] px-2 py-0.5 font-mono text-[10px] tracking-wide text-[#8A93A6] uppercase">
            {shoe.modelNumber ?? "-"}
          </span>
        </div>

        {/* 뷰포트 — CrimeDetailPage와 같은 언어(체커보드 눈금·십자선·워터마크). */}
        <div className="relative m-6 mt-4 mb-3 flex min-h-[180px] flex-1 items-center justify-center overflow-hidden rounded-xl border border-[#141D2C] bg-[#05080D]">
          {/* 체커보드 눈금 바 */}
          <div
            className="absolute inset-x-2 top-2 h-[8px] rounded-sm opacity-70"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, #E5E9F0 0 8px, #0B121D 8px 16px)",
            }}
          />
          <div
            className="absolute inset-y-2 left-2 w-[8px] rounded-sm opacity-70"
            style={{
              backgroundImage:
                "repeating-linear-gradient(180deg, #E5E9F0 0 8px, #0B121D 8px 16px)",
            }}
          />

          <TechCorners size={20} className="m-2" />

          {shoe.image ? (
            <img
              src={shoe.image}
              alt="측면 이미지"
              onLoad={(e) => {
                const el = e.currentTarget
                setDimensions([el.naturalWidth, el.naturalHeight])
              }}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-[#5B6B85]">
              <ImageOff className="size-9" aria-hidden="true" />
              <span className="text-sm font-medium">이미지 없음</span>
            </div>
          )}

          <span className="absolute bottom-3 left-12 font-mono text-[10px] tracking-wider text-[#5B6B85]">
            KCSI / Forensic Imaging
          </span>
        </div>

        {/* 상태 표시줄 */}
        <div className="flex items-center gap-3 border-t border-[#141D2C] px-6 py-3">
          <span className="rounded-md border border-[#1E2A3C] bg-[#0F1826] px-2.5 py-1 font-mono text-[11px] tabular-nums text-[#8A93A6]">
            {dimensions[0]} x {dimensions[1]} px
          </span>
          <span className="rounded-md border border-[#1E2A3C] bg-[#0F1826] px-2 py-0.5 font-mono text-[10px] tracking-wide text-[#8A93A6] uppercase">
            Read-Only
          </span>
          <span className="ml-auto font-mono text-[11px] tracking-wide text-[#6B7688] uppercase">
            Sole · Side
          </span>
        </div>
      </section>

      {/* 문양 비교 — 상/중/하/윤곽 4부위를 한 화면에 나란히, DB 썸네일은 작게. */}
      <section className="relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
        <TechCorners size={20} />
        <div className="flex items-center justify-between border-b border-[#141D2C] bg-[#0D1420]/60 px-6 py-3">
          <span className="flex items-center gap-2 text-[15px] font-semibold text-[#E5E9F0]">
            <Database className="size-4 text-[#4A9EFF]" aria-hidden="true" />
            문양 비교
          </span>
          <span className="font-mono text-[11px] tracking-[0.14em] text-[#5B6B85] uppercase">
            DB · Pattern
          </span>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-4 gap-3 overflow-hidden p-4">
          {ZONES.map(({ label, key }) => {
            const patterns = shoe[key] ?? []
            return (
              <div
                key={key}
                className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#1E2A3C] bg-[#0F1826]"
              >
                <div className="flex items-center justify-between border-b border-[#141D2C] bg-[#0D1420]/60 px-3 py-1.5">
                  <span className="text-[12px] font-semibold text-[#C7CEDB]">
                    {label}
                  </span>
                  <span className="font-mono text-[10px] tabular-nums text-[#5B6B85]">
                    {patterns.length}
                  </span>
                </div>
                {patterns.length > 0 ? (
                  <div className="grid min-h-0 flex-1 auto-rows-max grid-cols-2 gap-1.5 overflow-y-auto p-2">
                    {patterns.map((src, i) => (
                      <div
                        key={i}
                        className="aspect-square overflow-hidden rounded-md border border-[#1E2A3C] bg-[#05080D]"
                      >
                        <img
                          src={src}
                          alt={`${label} 문양 ${i + 1}`}
                          className="size-full object-contain p-1"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center gap-1 py-4 text-[#5B6B85]">
                    <ImageOff className="size-4" aria-hidden="true" />
                    <span className="text-[10px] font-medium">없음</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* 신발 정보 그리드 */}
      <section className="relative flex flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
        <TechCorners size={20} />
        <div className="flex items-center justify-between border-b border-[#141D2C] bg-[#0D1420]/60 px-6 py-3.5">
          <span className="text-[15px] font-semibold text-[#E5E9F0]">신발 정보</span>
          <span className="font-mono text-[11px] tracking-[0.14em] text-[#5B6B85] uppercase">
            Shoe · Detail
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 px-6 py-5 sm:grid-cols-3 lg:grid-cols-5">
          <InfoField label="모델번호" value={shoe.modelNumber} />
          <InfoField label="수집장소" value={shoe.findLocation} />
          <InfoField label="제조사" value={shoe.manufacturer} />
          <InfoField label="수집년도" value={shoe.findYear} />
          <InfoField label="상표명" value={shoe.emblem} />
        </div>
      </section>
    </div>
  )
}
