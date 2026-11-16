import { FEATURE_LABELS, FEATURE_ORDER } from "@/entities/session"
import { USER_FORM_MESSAGES, grantsNationwidePhotos, isImpliedFeature, toggleFeature } from "@/features/admin-users"
import { Button, Checkbox, DialogShell, Field, Segmented } from "@/shared/ui/kit"
import { ButtonBar } from "@/shared/ui/panel"

import type { UserDialogState } from "../model/types"

interface UserDialogsProps {
  dialog: UserDialogState
  onChange: (next: UserDialogState) => void
  onSubmit: () => void
}

function Row({ id, label, children }: { id?: string; label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-[10px]">
      <label htmlFor={id} className="text-[12.5px] text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}

function ErrorLine({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="m-0 rounded-[8px] border border-solid border-danger-line bg-danger-bg px-[12px] py-[8px] text-[12px] text-danger-fg">
      {message}
    </p>
  )
}

/** 사용자 추가 · 비밀번호 초기화 창. 값은 모두 dialog 안에 있고(제어형) 입력 · 닫기는 onChange 로 알린다. */
export function UserDialogs({ dialog, onChange, onSubmit }: UserDialogsProps) {
  const close = () => onChange({ kind: "none" })

  if (dialog.kind === "create") {
    const { draft, error } = dialog
    const set = (patch: Partial<typeof draft>) => onChange({ ...dialog, draft: { ...draft, ...patch } })
    return (
      <DialogShell
        open
        onOpenChange={(open) => !open && close()}
        title="사용자 추가"
        actions={
          <ButtonBar variant="modal-head">
            <Button size="sm" variant="pri" onClick={onSubmit}>
              추가
            </Button>
          </ButtonBar>
        }
      >
        <div className="grid gap-[12px] p-[16px]">
          <Row id="create-user-id" label="아이디">
            <Field id="create-user-id" variant="mono" value={draft.userId} maxLength={20} onChange={(e) => set({ userId: e.target.value })} placeholder="영문 · 숫자 · _ 4~20자" />
          </Row>
          <Row id="create-user-nm" label="이름">
            <Field id="create-user-nm" value={draft.userNm} onChange={(e) => set({ userNm: e.target.value })} />
          </Row>
          <Row label="구분">
            <Segmented
              aria-label="구분"
              items={[
                { value: "USER", label: "사용자" },
                { value: "ADMIN", label: "관리자" },
              ]}
              value={draft.userSe}
              onValueChange={(v) => set({ userSe: v as typeof draft.userSe })}
            />
          </Row>
          <Row id="create-user-pw" label="임시 비밀번호">
            <Field id="create-user-pw" type="password" value={draft.initialPassword} autoComplete="new-password" onChange={(e) => set({ initialPassword: e.target.value })} />
          </Row>
          <p className="m-0 text-[11.5px] text-dim">8자 이상. 첫 로그인 뒤 본인이 바꾸도록 강제합니다.</p>
          {/* 새 계정의 기본 소속은 본청 — 만든 뒤 상세에서 관서를 바꾼다 */}
          <p className="m-0 text-[12px] text-warn">{USER_FORM_MESSAGES.newUserHq}</p>
          <fieldset className="m-0 grid gap-[8px] border-0 p-0">
            <legend className="mb-[6px] text-[12px] text-muted-foreground">기능 권한</legend>
            {draft.userSe === "ADMIN" ? (
              <p className="m-0 rounded-[8px] border border-solid border-brand-line bg-brand-bg px-[12px] py-[8px] text-[12px] text-brand">
                관리자는 모든 기능을 사용할 수 있습니다
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-[8px]">
                {FEATURE_ORDER.map((code) => {
                  const id = `create-feat-${code}`
                  const implied = isImpliedFeature(draft.features, code)
                  return (
                    <div key={code} className="flex items-center gap-[8px] rounded-[6px] border border-solid border-line-2 bg-strip px-[10px] py-[6px]">
                      <Checkbox
                        id={id}
                        checked={implied || draft.features.includes(code)}
                        disabled={implied}
                        onCheckedChange={(on) => set({ features: toggleFeature(draft.features, code, on === true) })}
                      />
                      <label htmlFor={id} className="cursor-pointer text-[12.5px] text-fg-2">
                        {FEATURE_LABELS[code]}
                      </label>
                    </div>
                  )
                })}
              </div>
            )}
            {draft.userSe !== "ADMIN" && grantsNationwidePhotos(false, draft.features) && (
              <p className="m-0 text-[12px] text-warn">{USER_FORM_MESSAGES.nationwidePhotos}</p>
            )}
          </fieldset>
          <ErrorLine message={error} />
        </div>
      </DialogShell>
    )
  }

  if (dialog.kind === "reset") {
    return (
      <DialogShell
        open
        onOpenChange={(open) => !open && close()}
        title="비밀번호 초기화"
        actions={
          <ButtonBar variant="modal-head">
            <Button size="sm" variant="pri" onClick={onSubmit}>
              초기화
            </Button>
          </ButtonBar>
        }
      >
        <div className="grid gap-[12px] p-[16px]">
          <p className="m-0 text-[12.5px] text-fg-2">
            <span className="font-code text-brand">{dialog.userId}</span> 의 임시 비밀번호를 정하고, 열린 로그인을 모두 끝냅니다.
          </p>
          <Row id="reset-temp-pw" label="임시 비밀번호">
            <Field
              id="reset-temp-pw"
              type="password"
              value={dialog.tempPassword}
              autoComplete="new-password"
              onChange={(e) => onChange({ ...dialog, tempPassword: e.target.value })}
            />
          </Row>
          <ErrorLine message={dialog.error} />
        </div>
      </DialogShell>
    )
  }

  return null
}
