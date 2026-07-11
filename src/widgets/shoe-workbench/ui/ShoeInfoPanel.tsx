import { Footprints } from "lucide-react"
import type { ReactNode } from "react"

import type { Shoe } from "@/entities/shoe"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { TechCorners } from "@/shared/ui/tech-corners"

const fieldInputClass =
  "border-[#1E2A3C] bg-[#0D1420]/60 text-[#E5E9F0] placeholder:text-[#4C5670] focus-visible:border-[#3B82F6] focus-visible:ring-[#3B82F6]/30"

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[12px] font-medium text-[#8A93A6]">{label}</span>
      {children}
    </label>
  )
}

interface ShoeInfoPanelProps {
  formData: Shoe
  onFieldChange: (name: keyof Shoe, value: string) => void
  onSubmit: () => void
  onReset: () => void
  isSubmitting?: boolean
  /** 제출 버튼 라벨(등록 = "등록", 편집 = "저장"). 기본 "등록". */
  submitLabel?: string
  /** 제출 진행 중 라벨. 기본 "등록 중...". */
  submitPendingLabel?: string
  /** 좌측 outline 버튼 라벨(등록 = "초기화", 편집 = "되돌리기"). 기본 "초기화". */
  resetLabel?: string
  /** 편집 시 모델번호는 PUT의 URL 키라 잠근다(실수로 다른 신발을 덮어쓰지 않도록). */
  modelNumberReadOnly?: boolean
}

/**
 * 우측 "신발 정보" 패널: 레거시 `FormList`/`FormItem`이 만들던 신발 메타 필드를
 * crime-register `CaseInfoPanel`과 같은 다크 커맨드콘솔 카드로 재구성한 컨트롤드
 * 폼이다. 모델번호는 저장 필수값이라 맨 위에 둔다. 등록·편집 두 모드가 공유하며,
 * 차이는 버튼 라벨과 모델번호 잠금(`modelNumberReadOnly`)뿐이다.
 */
export function ShoeInfoPanel({
  formData,
  onFieldChange,
  onSubmit,
  onReset,
  isSubmitting = false,
  submitLabel = "등록",
  submitPendingLabel = "등록 중...",
  resetLabel = "초기화",
  modelNumberReadOnly = false,
}: ShoeInfoPanelProps) {
  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
      <TechCorners size={20} />

      <div className="flex items-center gap-2 border-b border-[#141D2C] bg-[#0D1420]/60 px-5 py-4">
        <Footprints className="size-4 text-[#4A9EFF]" aria-hidden="true" />
        <h2 className="text-[15px] font-semibold text-[#E5E9F0]">신발 정보</h2>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        <Field label="모델번호">
          <Input
            value={formData.modelNumber ?? ""}
            onChange={(e) => onFieldChange("modelNumber", e.target.value)}
            placeholder="모델번호 입력 (필수)"
            readOnly={modelNumberReadOnly}
            className={cn(
              fieldInputClass,
              "tabular-nums",
              modelNumberReadOnly &&
                "cursor-not-allowed text-[#8A93A6] focus-visible:border-[#1E2A3C] focus-visible:ring-0"
            )}
          />
        </Field>

        <Field label="제조사">
          <Input
            value={formData.manufacturer ?? ""}
            onChange={(e) => onFieldChange("manufacturer", e.target.value)}
            placeholder="제조사를 입력하세요"
            className={fieldInputClass}
          />
        </Field>

        <Field label="상표명">
          <Input
            value={formData.emblem ?? ""}
            onChange={(e) => onFieldChange("emblem", e.target.value)}
            placeholder="상표명을 입력하세요"
            className={fieldInputClass}
          />
        </Field>

        <Field label="수집장소">
          <Input
            value={formData.findLocation ?? ""}
            onChange={(e) => onFieldChange("findLocation", e.target.value)}
            placeholder="수집장소를 입력하세요"
            className={fieldInputClass}
          />
        </Field>

        <Field label="수집년도">
          <Input
            value={String(formData.findYear ?? "")}
            onChange={(e) => onFieldChange("findYear", e.target.value)}
            placeholder="YYYY"
            inputMode="numeric"
            className={cn(fieldInputClass, "tabular-nums")}
          />
        </Field>
      </div>

      <div className="flex items-center gap-3 border-t border-[#141D2C] px-5 py-5">
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          className="h-11 flex-1 border-[#26334A] bg-transparent text-[#C7CEDB] hover:bg-white/5 hover:text-white"
        >
          {resetLabel}
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="h-11 flex-[2] bg-gradient-to-b from-[#2563EB] to-[#1D4ED8] text-white shadow-[0_0_20px_rgba(37,99,235,0.45)] hover:from-[#3b74f2] hover:to-[#2154d8] disabled:opacity-60"
        >
          {isSubmitting ? submitPendingLabel : submitLabel}
        </Button>
      </div>
    </section>
  )
}
