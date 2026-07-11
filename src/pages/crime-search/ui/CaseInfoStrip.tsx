import { Fingerprint } from "lucide-react"

import type { Crime } from "@/entities/crime"
import { TechCorners } from "@/shared/ui/tech-corners"

interface CaseInfoStripProps {
  /** 이 사건의 기본 식별자(라우트 파라미터). currentData가 없어도 스탬프에 표시한다. */
  crimeNumber: string
  /** store에서 찾은 현장 데이터. 미조회/미존재면 undefined. */
  currentData: Crime | undefined
}

interface InlineFieldProps {
  label: string
  value: string | number | null | undefined
  /** 진행상태처럼 살아있는 값임을 강조할 때(발견/판정 뱃지 톤의 필). */
  emphasis?: boolean
}

/**
 * 사건정보 인라인 한 항목(라벨 + 값). 세로형 `InfoField`(구 상세 화면)를 슬림 바에 맞춰
 * 가로형으로 옮긴 변형이다. 값이 비어도 라벨과 `-` 플레이스홀더를 항상 표시해,
 * 메타가 전부 공란인 레코드에서도 바가 "빈 화면"으로 보이지 않게 한다.
 */
function InlineField({ label, value, emphasis = false }: InlineFieldProps) {
  const isEmpty = value === null || value === undefined || value === ""
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-mono text-[10px] tracking-wide text-[#5B6B85] uppercase">
        {label}
      </span>
      {isEmpty ? (
        // 값 없음 — 라벨과 같은 muted 톤(#5B6B85)으로 떨어뜨려 실제 값과 위계를 준다.
        <span className="text-[13px] font-semibold text-[#5B6B85]">-</span>
      ) : emphasis ? (
        <span className="inline-flex items-center rounded-full border border-[#3B82F6]/40 bg-[#152238]/60 px-2 py-0.5 text-[12px] font-semibold text-[#4A9EFF]">
          {value}
        </span>
      ) : (
        <span className="text-[13px] font-semibold text-[#C7CEDB]">{value}</span>
      )}
    </div>
  )
}

/** 인라인 필드 사이의 세로 구분선(좁은 화면에서는 줄바꿈으로 사라져도 무방). */
function Divider() {
  return <span className="hidden h-4 w-px bg-[#1E2A3C] lg:block" aria-hidden="true" />
}

/**
 * 사건정보 슬림 바. 통합 커맨드센터(`CrimeDetailPage`) 상단에서 사건등록번호 스탬프와
 * 핵심 메타(이미지번호·사건이름·채취일시·의뢰관서·발견방법·진행상태)를 한 줄로 축약해
 * 보여준다. 문양 정보/리스트가 화면의 주인공이 되도록 사건정보는 최소 높이로 격납한다.
 */
export function CaseInfoStrip({ crimeNumber, currentData }: CaseInfoStripProps) {
  return (
    <section className="relative flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-[#1E2A3C] bg-[#0B121D] px-6 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
      <TechCorners size={18} />

      {/* 사건등록번호는 이 사건의 기본 식별자라 필드 나열이 아닌 스탬프로 고정해 각인한다. */}
      <div className="flex items-center gap-2">
        <Fingerprint className="size-4 text-[#4A9EFF]" aria-hidden="true" />
        <span className="rounded-md border border-[#3B82F6]/40 bg-[#152238]/60 px-2.5 py-1 font-mono text-[12px] font-semibold tracking-wide text-[#4A9EFF]">
          {currentData?.crimeNumber ?? crimeNumber}
        </span>
        <span className="hidden font-mono text-[11px] tracking-[0.14em] text-[#5B6B85] uppercase sm:inline">
          Case · Detail
        </span>
      </div>

      <Divider />

      {/* 인라인 메타 필드 — 라벨:값을 가로로 나열. 진행상태만 필로 강조한다. */}
      <div className="flex flex-1 flex-wrap items-center gap-x-5 gap-y-2">
        <InlineField label="이미지 번호" value={currentData?.imageNumber} />
        <Divider />
        <InlineField label="사건 이름" value={currentData?.crimeName} />
        <Divider />
        <InlineField label="채취 일시" value={currentData?.findTime} />
        <Divider />
        <InlineField label="의뢰관서" value={currentData?.requestOffice} />
        <Divider />
        <InlineField label="발견 방법" value={currentData?.findMethod} />
        <Divider />
        <InlineField label="진행상태" value={currentData?.state} emphasis />
      </div>
    </section>
  )
}
