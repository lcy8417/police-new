import { useId, useState } from "react"
import { Loader2 } from "lucide-react"

import { FEATURES, FEATURE_LABELS, FEATURE_ORDER, type FeatureCode } from "@/entities/session"
import { cn } from "@/shared/lib/utils"
import { Button, Switch } from "@/shared/ui"

import {
  USER_FORM_MESSAGES,
  grantsNationwidePhotos,
  isImpliedFeature,
  sameFeatures,
  toggleFeature,
} from "../model/user-rules"

/** 기능별 한 줄 설명 — 어떤 메뉴·화면이 열리는지(설계서 §2, 실증 확장 설계서 §5-A). */
const FEATURE_HINTS: Record<FeatureCode, string> = {
  CRIME_REGISTER: "사건 등록 화면에서 현장 이미지를 올립니다",
  CRIME_SEARCH: "사건 목록·검색·유사도·감정 결과를 봅니다",
  SHOE_VIEW: "신발 저장소를 조회만 합니다",
  SHOE_EDIT: "신발을 새로 등록하고 문양을 수정합니다",
  CASE_STATUS_VIEW: "의뢰 목록에서 진행 상태를 봅니다",
  REPORT_VIEW: "발송된 감정서를 봅니다",
  EXAM_DECIDE: "감정 판정을 확정합니다(결과확인완료)",
  CROSS_REVIEW: "다른 감정관의 판정을 교차 검증합니다",
  REPORT_WRITE: "감정서를 작성해 제출합니다",
  REPORT_APPROVE: "제출된 감정서를 검토해 확정하거나 반려합니다",
  REPORT_SEND: "확정된 감정서를 발송합니다",
  SHOE_COLLECT_REVIEW: "수집된 신발 자료를 검수합니다",
}

export interface FeatureTogglesProps {
  /** 서버에 저장된 기능 권한(편집 시작값). */
  value: FeatureCode[]
  saving: boolean
  onSave: (features: FeatureCode[]) => void
  /**
   * 직원(관리자·감정관·검증자)인가 — 아니면 사건 조회를 켰을 때 「전국 사건 사진」 경고를 보인다
   * (`grantsNationwidePhotos`). 모르면 경고를 보이는 쪽(false)이 기본.
   */
  staff?: boolean
}

/**
 * 기능 권한 스위치(서버 기능 목록 전체, `FEATURE_ORDER`) + "권한 저장" — 개인 권한만 다루고 역할 권한은
 * 역할 칸에서 정한다. `SHOE_EDIT`를 켜면 `SHOE_VIEW`도 켜진 것으로 보이고
 * 끌 수 없다(신발 등록·수정에 포함). 바뀐 것이 없으면 저장 버튼이 꺼져 있다.
 * 다른 사용자를 고르면 상위에서 `key`를 바꿔 새로 시작한다.
 */
export function FeatureToggles({ value, saving, onSave, staff = false }: FeatureTogglesProps) {
  const [draft, setDraft] = useState<FeatureCode[]>(value)
  const baseId = useId()
  const dirty = !sameFeatures(draft, value)
  const nationwide = grantsNationwidePhotos(staff, draft)

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col divide-y divide-[#141D2C] rounded-lg border border-[#1E2A3C] bg-[#0D1420]/50">
        {FEATURE_ORDER.map((code) => {
          const id = `${baseId}-${code}`
          const implied = isImpliedFeature(draft, code)
          const checked = implied || draft.includes(code)
          return (
            <li key={code} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <label htmlFor={id} className="cursor-pointer text-[13px] font-medium text-[#E5E9F0]">
                  {FEATURE_LABELS[code]}
                </label>
                <span className={cn("text-[11px]", implied ? "text-[#4A9EFF]" : "text-[#5B6B85]")}>
                  {implied ? "신발 등록·수정에 포함됩니다" : FEATURE_HINTS[code]}
                </span>
                {code === FEATURES.CRIME_SEARCH && nationwide && (
                  <span className="text-[11px] text-warn">{USER_FORM_MESSAGES.nationwidePhotos}</span>
                )}
              </div>
              <Switch
                id={id}
                checked={checked}
                disabled={implied || saving}
                onCheckedChange={(on) => setDraft((prev) => toggleFeature(prev, code, on))}
              />
            </li>
          )
        })}
      </ul>
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          disabled={!dirty || saving}
          onClick={() => onSave(draft)}
          className="bg-[#3B82F6] text-white hover:bg-[#2563EB] focus-visible:ring-[#3B82F6]/50"
        >
          {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
          권한 저장
        </Button>
      </div>
    </div>
  )
}
