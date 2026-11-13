import { AlertTriangle, Calendar } from "lucide-react"
import { useState, type ReactNode } from "react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { TechCorners } from "@/shared/ui/tech-corners"

import { buildAprthngNo, type CrimeFormData, type CrimeRegisterForm } from "../model/form"

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
  onFieldChange: (name: keyof CrimeRegisterForm, value: string) => void
  onSubmit: () => void
  onReset: () => void
  isSubmitting?: boolean
  /** 폼 위 오류 영역에 띄울 문구(화면 검증 실패 또는 서버 400/403/409 `detail`). 없으면 숨김. */
  errorMessage?: string | null
  /**
   * 원본 보관 실패 안내(실증 확장 설계서 §5-E · §11-2 「실패는 그 자리에」). `detail`은 서버 문구 그대로
   * (예 413 「파일이 너무 큽니다(최대 50MB)」, 없으면 null). null이면 숨김 — 등록은 막지 않는다.
   */
  originalFailure?: { detail: string | null } | null
}

/**
 * 우측 "사건 정보" 패널: SCAS 감정물 필드(설계서 §4-4)로 된 제어형 등록 폼.
 * 감정의뢰번호 + 감정물 순번을 입력하면 서버로 보낼 감정물 번호(`aprthngNo`)를
 * 바로 아래에 미리 보여 준다. 입력칸 `maxLength`는 설계서 §5 열 길이와 같다.
 */
export function CaseInfoPanel({
  formData,
  onFieldChange,
  onSubmit,
  onReset,
  isSubmitting = false,
  errorMessage = null,
  originalFailure = null,
}: CaseInfoPanelProps) {
  // 사건 내용 has no counterpart in the register body (backend contract has no
  // description field), so it stays local + optional and is not submitted.
  const [content, setContent] = useState("")

  // 감정의뢰번호가 비어 있으면 조합 번호 대신 안내 대시를 보인다.
  const aprthngNoPreview = formData.apprslReqestNo
    ? buildAprthngNo(formData.apprslReqestNo, formData.aprthngSn)
    : null

  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
      <TechCorners size={22} />

      <div className="border-b border-[#141D2C] px-6 py-5">
        <h2 className="text-[15px] font-semibold text-[#E5E9F0]">사건 정보</h2>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 px-3 py-2.5 text-[13px] text-[#FCA5A5]"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#EF4444]" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 원본 보관 실패 — 경고(주황)로 남기고 등록은 계속할 수 있다. 색은 토큰만(새 hex 금지). */}
        {originalFailure && (
          <div
            role="status"
            aria-label="원본 보관"
            className="flex items-start gap-2 rounded-lg border border-warn-line bg-warn-bg px-3 py-2.5 text-[13px] text-warn"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span>원본 보관 실패 — 작업본만 저장됩니다</span>
              {originalFailure.detail && (
                <span className="text-[12px] text-fg-2">{originalFailure.detail}</span>
              )}
            </span>
          </div>
        )}

        <div className="space-y-2">
          <div className="grid grid-cols-[2fr_1fr] gap-3">
            <Field label="감정의뢰번호">
              <Input
                value={formData.apprslReqestNo}
                onChange={(e) => onFieldChange("apprslReqestNo", e.target.value)}
                placeholder="예: 05019-24-0017 (필수)"
                maxLength={20}
                className={cn(fieldInputClass, "tabular-nums")}
              />
            </Field>

            <Field label="감정물 순번">
              <Input
                value={formData.aprthngSn}
                onChange={(e) => onFieldChange("aprthngSn", e.target.value)}
                placeholder="예: 1"
                className={cn(fieldInputClass, "tabular-nums")}
              />
            </Field>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-md border border-dashed border-[#1E2A3C] bg-[#0D1420]/40 px-3 py-2">
            <span className="text-[11px] font-medium text-[#5B6B85]">감정물 번호</span>
            {aprthngNoPreview ? (
              <span className="truncate font-mono text-[13px] text-[#4A9EFF] tabular-nums">
                {aprthngNoPreview}
              </span>
            ) : (
              <span className="text-[12px] text-[#4C5670]">감정의뢰번호를 입력하면 표시됩니다</span>
            )}
          </div>
        </div>

        <Field label="채취 일시">
          <div className="relative">
            <Input
              value={formData.pickDt}
              onChange={(e) => onFieldChange("pickDt", e.target.value)}
              placeholder="YYYY-MM-DD HH:mm"
              className={cn(fieldInputClass, "pr-9 tabular-nums")}
            />
            <Calendar
              className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#5B6B85]"
              aria-hidden="true"
            />
          </div>
        </Field>

        <Field label="채취 장소">
          <Input
            value={formData.pickPlace}
            onChange={(e) => onFieldChange("pickPlace", e.target.value)}
            placeholder="채취 장소를 입력하세요"
            maxLength={200}
            className={fieldInputClass}
          />
        </Field>

        <Field label="채취 방법 코드">
          <Input
            value={formData.pickMthCode}
            onChange={(e) => onFieldChange("pickMthCode", e.target.value)}
            placeholder="채취 방법 코드 (최대 8자)"
            maxLength={8}
            className={cn(fieldInputClass, "font-mono")}
          />
        </Field>

        <Field label="사건명">
          <Input
            value={formData.crimeNm}
            onChange={(e) => onFieldChange("crimeNm", e.target.value)}
            placeholder="사건명을 입력하세요"
            maxLength={300}
            className={fieldInputClass}
          />
        </Field>

        <Field label="의뢰관서">
          <Input
            value={formData.rqestGrfcNm}
            onChange={(e) => onFieldChange("rqestGrfcNm", e.target.value)}
            placeholder="의뢰관서를 입력하세요"
            maxLength={300}
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
