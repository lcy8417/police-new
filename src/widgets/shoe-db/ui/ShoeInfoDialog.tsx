import * as React from "react"

import type { Shoe } from "@/entities/shoe"
import { Button, Chip, DialogShell, Field, Segmented } from "@/shared/ui/kit"
import { ButtonBar } from "@/shared/ui/panel"

import type { ShoeDialogState } from "../model/types"

// 신발정보관리 레이어 창(1겹). 기본정보 · 문양정보 두 탭(SCAS 순서). 문양 편집은 S04 몫이라 여기서는 이름만 보인다.
interface ShoeInfoDialogProps {
  dialog: ShoeDialogState
  canEdit: boolean
  onFormChange: (form: Shoe) => void
  onSave: () => void
  onClose: () => void
  onReplaceImage: () => void
  onRotateImage: () => void
}

const ZONES: { key: "top" | "mid" | "bottom" | "outline"; label: string }[] = [
  { key: "top", label: "상" },
  { key: "mid", label: "중" },
  { key: "bottom", label: "하" },
  { key: "outline", label: "윤곽" },
]

const TEXT_FIELDS: { key: "modlNm" | "brandCode" | "makrCode" | "colctPlace" | "colctYear"; label: string }[] = [
  { key: "modlNm", label: "모델명" },
  { key: "brandCode", label: "상표코드" },
  { key: "makrCode", label: "제조사코드" },
  { key: "colctPlace", label: "수집처" },
  { key: "colctYear", label: "수집연도" },
]

export function ShoeInfoDialog({ dialog, canEdit, onFormChange, onSave, onClose, onReplaceImage, onRotateImage }: ShoeInfoDialogProps) {
  const [tab, setTab] = React.useState("basic")
  const { form, mode, saveError } = dialog
  const isNew = mode === "new"
  const idInvalid = saveError != null

  return (
    <DialogShell
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="신발정보관리"
      size="large"
      actions={
        canEdit ? (
          <ButtonBar variant="modal-head">
            <Button size="sm" variant="pri" onClick={onSave}>
              저장
            </Button>
          </ButtonBar>
        ) : null
      }
    >
      <div className="grid gap-[12px] p-[14px]">
        <Segmented
          scas
          aria-label="신발정보 탭"
          value={tab}
          onValueChange={setTab}
          items={[
            { value: "basic", label: "기본정보" },
            { value: "pattern", label: "문양정보" },
          ]}
        />
        {tab === "basic" ? (
          <div className="grid grid-cols-[200px_minmax(0,1fr)] gap-[14px]">
            <div className="grid content-start gap-[8px]">
              <div className="flex h-[200px] items-center justify-center overflow-hidden rounded-[8px] border border-solid border-border bg-canvas">
                {form.image ? <img src={form.image} alt="신발 바닥 이미지" className="size-full object-contain" /> : <span className="text-[12px] text-dim">이미지 없음</span>}
              </div>
              {canEdit && (
                <div className="flex gap-[6px]">
                  <Button size="sm" onClick={onReplaceImage}>
                    {form.image ? "이미지 교체" : "이미지 등록"}
                  </Button>
                  <Button size="sm" disabled={!form.image} onClick={onRotateImage}>
                    회전
                  </Button>
                </div>
              )}
            </div>
            <div className="grid content-start gap-[8px]">
              <label className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-[8px] text-[12.5px] text-muted-foreground">
                <span>신발ID</span>
                <Field
                  variant="mono"
                  value={form.ftwrId}
                  readOnly={!isNew || !canEdit}
                  invalid={idInvalid}
                  maxLength={8}
                  onChange={(e) => onFormChange({ ...form, ftwrId: e.target.value })}
                />
              </label>
              {saveError && (
                <p role="alert" className="m-0 pl-[104px] text-[12px] text-danger">
                  {saveError}
                </p>
              )}
              {TEXT_FIELDS.map(({ key, label }) => (
                <label key={key} className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-[8px] text-[12.5px] text-muted-foreground">
                  <span>{label}</span>
                  <Field value={form[key] ?? ""} readOnly={!canEdit} onChange={(e) => onFormChange({ ...form, [key]: e.target.value })} />
                </label>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-[8px]">
            {ZONES.map(({ key, label }) => (
              <div key={key} className="grid min-h-[36px] grid-cols-[46px_minmax(0,1fr)] items-center gap-[8px] rounded-[7px] border border-solid border-line-2 bg-strip px-[8px] py-[4px]">
                <span className="text-[12.5px] font-semibold text-fg-2">{label}</span>
                <span className="flex flex-wrap gap-[5px]">
                  {form[key].length === 0 ? <span className="text-[12px] text-dim">—</span> : form[key].map((name) => <Chip key={name}>{name}</Chip>)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DialogShell>
  )
}
