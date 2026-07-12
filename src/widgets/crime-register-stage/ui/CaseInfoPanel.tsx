import { Calendar } from "lucide-react"
import { useState, type ReactNode } from "react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { TechCorners } from "@/shared/ui/tech-corners"

import type { CrimeFormData } from "../model/form"

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

interface CaseInfoPanelProps {
  formData: CrimeFormData
  onFieldChange: (name: keyof CrimeFormData, value: string) => void
  onSubmit: () => void
  onReset: () => void
  isSubmitting?: boolean
}

/**
 * Right "사건 정보" panel: the controlled register form matching legacy
 * `CrimeRegisterMain`'s field set, restyled as a dark command-console card
 * with a live 초기화/저장 action row.
 */
export function CaseInfoPanel({
  formData,
  onFieldChange,
  onSubmit,
  onReset,
  isSubmitting = false,
}: CaseInfoPanelProps) {
  // 사건 내용 has no counterpart in the register body (backend contract has no
  // description field), so it stays local + optional and is not submitted.
  const [content, setContent] = useState("")

  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
      <TechCorners size={22} />

      <div className="border-b border-[#141D2C] px-6 py-5">
        <h2 className="text-[15px] font-semibold text-[#E5E9F0]">사건 정보</h2>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
        <Field label="사건등록번호">
          <Input
            value={formData.crimeNumber}
            onChange={(e) => onFieldChange("crimeNumber", e.target.value)}
            placeholder="사건 번호 입력 (필수)"
            className={cn(fieldInputClass, "tabular-nums")}
          />
        </Field>

        <Field label="이미지 번호">
          <Input
            value={formData.imageNumber}
            onChange={(e) => onFieldChange("imageNumber", e.target.value)}
            placeholder="이미지 번호 입력"
            className={cn(fieldInputClass, "tabular-nums")}
          />
        </Field>

        <Field label="사건 이름">
          <Input
            value={formData.crimeName}
            onChange={(e) => onFieldChange("crimeName", e.target.value)}
            placeholder="사건명을 입력하세요"
            className={fieldInputClass}
          />
        </Field>

        <Field label="채취 일시">
          <div className="relative">
            <Input
              value={formData.findTime}
              onChange={(e) => onFieldChange("findTime", e.target.value)}
              placeholder="YYYY-MM-DD HH:mm"
              className={cn(fieldInputClass, "pr-9 tabular-nums")}
            />
            <Calendar
              className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#5B6B85]"
              aria-hidden="true"
            />
          </div>
        </Field>

        <Field label="의뢰관서">
          <Input
            value={formData.requestOffice}
            onChange={(e) => onFieldChange("requestOffice", e.target.value)}
            placeholder="의뢰관서를 입력하세요"
            className={fieldInputClass}
          />
        </Field>

        <Field label="발견 방법">
          <Input
            value={formData.findMethod}
            onChange={(e) => onFieldChange("findMethod", e.target.value)}
            placeholder="발견 방법을 입력하세요"
            className={fieldInputClass}
          />
        </Field>

        <Field label="사건 내용 (선택)">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="사건 내용을 입력하세요"
            className={cn(fieldInputClass, "min-h-[104px] resize-none")}
          />
        </Field>
      </div>

      <div className="flex items-center gap-3 border-t border-[#141D2C] px-6 py-5">
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          className="h-11 flex-1 border-[#26334A] bg-transparent text-[#C7CEDB] hover:bg-white/5 hover:text-white"
        >
          초기화
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="h-11 flex-[2] bg-gradient-to-b from-[#2563EB] to-[#1D4ED8] text-white shadow-[0_0_20px_rgba(37,99,235,0.45)] hover:from-[#3b74f2] hover:to-[#2154d8] disabled:opacity-60"
        >
          {isSubmitting ? "저장 중..." : "저장"}
        </Button>
      </div>
    </section>
  )
}
