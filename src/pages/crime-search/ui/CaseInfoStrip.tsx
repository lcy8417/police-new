import { Fingerprint } from "lucide-react"

import type { Crime } from "@/entities/crime"
import { TechCorners } from "@/shared/ui/tech-corners"

interface CaseInfoStripProps {
  /** 이 사건의 기본 식별자(라우트 파라미터). currentData가 없어도 스탬프에 표시한다. */
  crimeNumber: string
  /** store에서 찾은 현장 데이터. 미조회/미존재면 undefined. */
  currentData: Crime | undefined
}

interface StackFieldProps {
  label: string
  value: string | number | null | undefined
  /** 진행상태처럼 살아있는 값임을 강조할 때(발견/판정 뱃지 톤의 필). */
  emphasis?: boolean
}

/**
 * 사건정보 세로 항목(라벨 위 / 값 아래). 값이 비어도 라벨과 `-` 플레이스홀더를 항상
 * 표시해, 메타가 전부 공란인 레코드에서도 패널이 "빈 화면"으로 보이지 않게 한다.
 */
function StackField({ label, value, emphasis = false }: StackFieldProps) {
  const isEmpty = value === null || value === undefined || value === ""
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[10px] tracking-wide text-[#5B6B85] uppercase">
        {label}
      </span>
      {isEmpty ? (
        // 값 없음 — 라벨과 같은 muted 톤(#5B6B85)으로 떨어뜨려 실제 값과 위계를 준다.
        <span className="text-[13px] font-semibold text-[#5B6B85]">-</span>
      ) : emphasis ? (
        <span className="inline-flex w-fit items-center rounded-full border border-[#3B82F6]/40 bg-[#152238]/60 px-2 py-0.5 text-[12px] font-semibold text-[#4A9EFF]">
          {value}
        </span>
      ) : (
        <span className="text-[13px] font-semibold text-[#C7CEDB]">{value}</span>
      )}
    </div>
  )
}

/**
 * 사건정보 세로 패널. 통합 커맨드센터(`CrimeDetailPage`)의 맨 오른쪽 좁은 열에서
 * 사건등록번호 스탬프와 핵심 메타(이미지번호·사건이름·채취일시·의뢰관서·발견방법·
 * 진행상태)를 위에서 아래로 쌓아 보여준다. 문양 정보/리스트가 화면의 주인공이 되도록
 * 사건정보는 좁은 폭으로 격납한다(컴포넌트 이름은 기존 import 유지를 위해 보존).
 */
export function CaseInfoStrip({ crimeNumber, currentData }: CaseInfoStripProps) {
  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
      <TechCorners size={18} />

      <div className="flex items-center justify-between border-b border-[#141D2C] bg-[#0D1420]/60 px-4 py-3">
        <span className="flex items-center gap-2 text-[14px] font-semibold text-[#E5E9F0]">
          <Fingerprint className="size-4 text-[#4A9EFF]" aria-hidden="true" />
          사건 정보
        </span>
        <span className="font-mono text-[10px] tracking-[0.14em] text-[#5B6B85] uppercase">
          Case
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-4 py-4">
        {/* 사건등록번호는 기본 식별자라 필드 나열이 아닌 스탬프로 고정해 각인한다. */}
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] tracking-wide text-[#5B6B85] uppercase">
            사건등록번호
          </span>
          <span className="w-fit rounded-md border border-[#3B82F6]/40 bg-[#152238]/60 px-2.5 py-1 font-mono text-[12px] font-semibold tracking-wide text-[#4A9EFF]">
            {currentData?.crimeNumber ?? crimeNumber}
          </span>
        </div>

        <span className="h-px w-full bg-[#141D2C]" aria-hidden="true" />

        <StackField label="이미지 번호" value={currentData?.imageNumber} />
        <StackField label="사건 이름" value={currentData?.crimeName} />
        <StackField label="채취 일시" value={currentData?.findTime} />
        <StackField label="의뢰관서" value={currentData?.requestOffice} />
        <StackField label="발견 방법" value={currentData?.findMethod} />
        <StackField label="진행상태" value={currentData?.state} emphasis />
      </div>
    </section>
  )
}
