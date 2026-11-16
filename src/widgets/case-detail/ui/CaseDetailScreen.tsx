import * as React from "react"

import { FEATURES } from "@/entities/session"
import { cn } from "@/shared/lib/utils"
import { Button, Checkbox, Combobox, DataGrid, Field, InlineError, type DataGridColumn } from "@/shared/ui/kit"
import { ButtonBar, Panel, SearchForm, type SearchFormRow } from "@/shared/ui/panel"
import { EvidenceImage } from "@/shared/ui/viewer"

import { imageSeq } from "../model/validate-case-detail"
import type { CaseDetailFieldName, CaseDetailScreenProps, CaseImage } from "../model/types"

// S02 사건 상세·등록(SCAS 「사건관리」 팝업 자리). 왼쪽 족윤적 이미지 · 이미지 목록, 오른쪽 사건정보.
// 값만 받아 그린다(서버 호출 · 전역 상태 없음). 입력값은 전부 제어형.

function Band({ title, children }: { title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex min-h-[30px] items-center gap-[8px] border-l-[3px] border-solid border-l-brand-2 bg-brand-bg px-[10px] text-[12.5px] font-semibold">
      {title}
      {children ? <span className="ml-auto flex items-center gap-[6px] font-normal">{children}</span> : null}
    </div>
  )
}

const kb = (bytes: number) => `${Math.round(bytes / 1024).toLocaleString("ko-KR")} KB`

export function CaseDetailScreen({
  status,
  errorAt,
  onRetry,
  isAdmin,
  features,
  mode,
  aprthngNo,
  form,
  onFieldChange,
  officeItems,
  images,
  selectedImageId,
  onSelectImage,
  checkedImageIds,
  onCheckedImageIdsChange,
  onFilesAdded,
  onDeleteChecked,
  uploading,
  errorMessage,
  saving = false,
  continuous,
  onContinuousChange,
  onSave,
  onReset,
  onClose,
  onPrev,
  onNext,
  onCopy,
  onOpenImageEdit,
  onOpenSearch,
}: CaseDetailScreenProps) {
  const fileInput = React.useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = React.useState(false)

  const canEdit = isAdmin || features.includes(FEATURES.CRIME_REGISTER)
  const canSearch = isAdmin || features.includes(FEATURES.CRIME_SEARCH)

  // 파일명 끝 숫자 순서(_1 → _12)
  const sorted = React.useMemo(
    () => [...images].sort((a, b) => imageSeq(a.fileName) - imageSeq(b.fileName) || a.fileName.localeCompare(b.fileName)),
    [images]
  )
  const selected = sorted.find((i) => i.id === selectedImageId) ?? sorted[0] ?? null

  const toggleChecked = (id: string, on: boolean) =>
    onCheckedImageIdsChange(on ? [...checkedImageIds, id] : checkedImageIds.filter((x) => x !== id))

  const columns: DataGridColumn<CaseImage>[] = [
    {
      key: "check",
      header: "선택",
      render: (i) => (
        <Checkbox
          checked={checkedImageIds.includes(i.id)}
          disabled={!canEdit}
          onCheckedChange={(c) => toggleChecked(i.id, c === true)}
          aria-label={`${i.fileName} 선택`}
        />
      ),
    },
    { key: "name", header: "파일명칭", render: (i) => <span className="font-code text-[11.5px]">{i.fileName}</span> },
    {
      key: "size",
      header: "파일크기",
      align: "right",
      render: (i) => <span className="font-code tabular-nums text-muted-foreground">{kb(i.sizeBytes)}</span>,
    },
  ]

  const text = (name: CaseDetailFieldName, label: string, variant: "text" | "mono" | "mono-sm" = "text") => (
    <Field
      variant={variant}
      value={form[name]}
      readOnly={!canEdit}
      required={name === "apprslReqestNo"}
      onChange={(e) => onFieldChange(name, e.target.value)}
      aria-label={label}
    />
  )

  const rows: SearchFormRow[] = [
    { label: "사건등록번호", required: true, field: text("apprslReqestNo", "사건등록번호", "mono") },
    { label: "이미지 번호", field: text("aprthngSn", "이미지 번호", "mono") },
    {
      label: "의뢰관서",
      field: (
        <Combobox
          items={officeItems}
          value={form.rqestGrfcNm || null}
          onValueChange={(v) => canEdit && onFieldChange("rqestGrfcNm", v)}
          placeholder="의뢰관서 검색"
        />
      ),
    },
    { label: "사건 이름", field: text("crimeNm", "사건 이름") },
    { label: "채취 일시", field: text("pickDt", "채취 일시", "mono-sm") },
    { label: "채취 장소", field: text("pickPlace", "채취 장소") },
    { label: "발견 방법", span: 3, field: text("pickMthCode", "발견 방법", "mono") },
  ]

  const handleFiles = (list: FileList | null) => {
    if (canEdit && list && list.length > 0) onFilesAdded(Array.from(list))
  }

  return (
    <Panel
      aria-busy={status === "loading" ? "true" : undefined}
      title={
        <span className="inline-flex items-baseline gap-[8px]">
          {mode === "register" ? "사건 등록" : "사건관리"}
          {mode === "detail" && aprthngNo ? (
            <span className="font-code text-[12px] font-normal text-muted-foreground">{aprthngNo}</span>
          ) : null}
        </span>
      }
      actions={
        <ButtonBar variant="modal-head" aria-label="사건 상세 도구">
          {mode === "detail" ? (
            <>
              <Button size="sm" disabled={!onPrev} onClick={onPrev}>
                이전
              </Button>
              <Button size="sm" disabled={!onNext} onClick={onNext}>
                다음
              </Button>
              {canEdit ? (
                <Button size="sm" onClick={onCopy}>
                  사건복사
                </Button>
              ) : null}
            </>
          ) : null}
          <Button size="sm" onClick={onClose}>
            닫기
          </Button>
          {mode === "detail" && canSearch ? (
            <>
              <span aria-hidden="true" className="h-[20px] w-px bg-line-3" />
              <Button size="sm" variant="pri" onClick={onOpenSearch}>
                검색 (문양 상세보기) →
              </Button>
            </>
          ) : null}
        </ButtonBar>
      }
    >
      {status === "loading" ? (
        <p role="status" className="px-[14px] py-[40px] text-center text-[12.5px] text-muted-foreground">
          사건 정보를 불러오는 중…
        </p>
      ) : status === "error" ? (
        <div className="px-[14px] py-[40px] text-center">
          <InlineError message="사건 정보를 확인하지 못했습니다" at={errorAt} onRetry={onRetry} />
        </div>
      ) : (
        <div className="grid gap-[12px] p-[12px] lg:grid-cols-[300px_minmax(0,1fr)]">
          {/* 왼쪽: 족윤적 이미지 + 이미지 목록(SCAS 자리 그대로) */}
          <div className="grid content-start gap-[8px]">
            <Band title="족윤적 이미지" />
            <div className="mx-auto w-full max-w-[200px]">
              {selected ? (
                <EvidenceImage
                  src={selected.src}
                  alt={`${selected.fileName} 미리보기`}
                  caption={selected.fileName}
                  ruler
                />
              ) : (
                <p className="grid aspect-[2/3] place-items-center rounded-[10px] border border-dashed border-line-3 text-[12px] text-muted-foreground">
                  이미지 없음
                </p>
              )}
            </div>
            <div className="flex items-center gap-[6px]">
              <Button size="sm" disabled={!selected} onClick={() => selected && onOpenImageEdit(selected.id)}>
                이미지 커팅 열기
              </Button>
            </div>

            <Band title="이미지 목록">
              <span className="font-code text-[11px] tabular-nums text-dim">{sorted.length}장 · 1→{sorted.length}순</span>
              {canEdit ? (
                <>
                  <Button size="sm" onClick={() => fileInput.current?.click()}>
                    추가
                  </Button>
                  <Button size="sm" disabled={checkedImageIds.length === 0} onClick={onDeleteChecked}>
                    삭제
                  </Button>
                </>
              ) : null}
            </Band>
            <DataGrid
              columns={columns}
              rows={sorted}
              rowKey={(i) => i.id}
              selectedKey={selected?.id}
              onRowClick={(i) => onSelectImage(i.id)}
              emptyText="이미지 없음"
            />
            {canEdit ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragging(false)
                  handleFiles(e.dataTransfer.files)
                }}
                className={cn(
                  "grid gap-[5px] rounded-[8px] border border-dashed border-brand-line bg-brand-bg px-[10px] py-[8px] text-[11.5px] text-fg-2",
                  dragging && "border-brand"
                )}
              >
                <span>⤓ 사진을 끌어 놓으면 여러 장 추가</span>
                {uploading ? (
                  <span className="grid gap-[3px]">
                    <span className="flex justify-between font-code text-[10.5px] text-dim">
                      <span className="truncate">{uploading.fileName} 업로드 중</span>
                      <span>{uploading.percent}%</span>
                    </span>
                    <span
                      role="progressbar"
                      aria-label="업로드"
                      aria-valuenow={uploading.percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="h-[4px] overflow-hidden rounded-[2px] bg-line-3"
                    >
                      <i className="block h-full bg-brand-2" style={{ width: `${uploading.percent}%` }} />
                    </span>
                  </span>
                ) : null}
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  aria-label="이미지 파일 고르기"
                  onChange={(e) => {
                    handleFiles(e.target.files)
                    e.target.value = ""
                  }}
                />
              </div>
            ) : null}
          </div>

          {/* 오른쪽: 사건정보(지금 앱 입력 7칸) */}
          <div className="grid min-w-0 content-start gap-[8px]">
            <Band title="사건정보" />
            {errorMessage ? (
              <p
                role="alert"
                className="m-0 rounded-[6px] border border-solid border-danger-line bg-danger-bg px-[10px] py-[7px] text-[12.5px] text-danger-fg"
              >
                {errorMessage}
              </p>
            ) : null}
            <SearchForm columns={2} rows={rows} />
            {canEdit ? (
              <div className="flex flex-wrap items-center justify-end gap-[10px] px-[4px]">
                {mode === "register" ? (
                  <label className="mr-auto flex items-center gap-[6px] text-[12px] text-muted-foreground">
                    <Checkbox
                      checked={continuous}
                      onCheckedChange={(c) => onContinuousChange(c === true)}
                      aria-label="저장 후 연속 등록"
                    />
                    저장 후 다음 사건 연속 등록
                  </label>
                ) : null}
                <Button size="sm" onClick={onReset}>
                  초기화
                </Button>
                <Button size="sm" variant="pri" disabled={saving} onClick={onSave}>
                  {saving ? "저장 중..." : "저장"}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </Panel>
  )
}
