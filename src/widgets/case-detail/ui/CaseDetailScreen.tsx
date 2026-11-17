import * as React from "react"
import { PencilLine, RotateCcw, Save, Scissors } from "lucide-react"

import { FEATURES, type FeatureCode } from "@/entities/session"
import { cn } from "@/shared/lib/utils"
import {
  Button,
  Checkbox,
  Chip,
  Combobox,
  DataGrid,
  Field,
  FilterBar,
  InlineError,
  RadioRow,
  Segmented,
  WorkbenchButton,
  type DataGridColumn,
} from "@/shared/ui/kit"
import { ButtonBar, PaneHead, Panel, SearchForm, Stepper, UnderlineTabs, type SearchFormRow } from "@/shared/ui/panel"
import { EvidenceImage } from "@/shared/ui/viewer"

import { CaseImageDrop } from "./CaseImageDrop"
import { AiCheckCard, DuplicateChip, EvidenceWithAi, MethodSuggestion, SourceLine } from "./PlusParts"

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
  pendingValues,
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
  onCopy,
  onOpenImageEdit,
  onOpenSearch,
  showPlus = true,
  plus,
  onMockAction,
  imageQuery = "",
  onImageQueryChange,
  inWindow = false,
}: CaseDetailScreenProps) {
  const fileInput = React.useRef<HTMLInputElement>(null)
  const [applyScope, setApplyScope] = React.useState<"one" | "all">("one")
  const extra = showPlus ? plus : undefined

  const canEdit = isAdmin || features.includes(FEATURES.CRIME_REGISTER)
  const canSearch = isAdmin || features.includes(FEATURES.CRIME_SEARCH)
  const has = (code: FeatureCode) => isAdmin || features.includes(code)
  // 시안 data-role: 「검색」은 감정관 · 관리자, 기술책임자는 읽기 전용 칩, 수사관은 「의뢰한 사건만」 칩
  const verifierView = showPlus && !isAdmin && !canEdit && has(FEATURES.EXAM_VIEW) // 기술책임자 = 보기 전용(결재 삭제 — 서버 0013)
  const investigatorView = showPlus && !isAdmin && canEdit && !canSearch
  const canGoSearch = canSearch && !verifierView
  const analystView = has(FEATURES.EXAM_DECIDE)

  // 파일명 끝 숫자 순서(_1 → _12)
  const sorted = React.useMemo(
    () => [...images].sort((a, b) => imageSeq(a.fileName) - imageSeq(b.fileName) || a.fileName.localeCompare(b.fileName)),
    [images]
  )
  const selected = sorted.find((i) => i.id === selectedImageId) ?? sorted[0] ?? null
  // 전사판 안내 칩: flipRefs 를 주면 그 장을 볼 때만(사건 창 — 사건마다 다르다), 안 주면 시안처럼 늘
  const selectedSeq = selected ? String(imageSeq(selected.fileName)) : ""
  const showFlip = Boolean(extra) && (!extra?.flipRefs || extra.flipRefs.includes(selectedSeq))
  // 사건 창 안(11/17 사용자 「사건 정보, 현장 이미지 정보는 탭으로 좌우 이동하고 세로 꽉 채우던지」): 오른쪽 두 표를 탭으로
  const [formTab, setFormTab] = React.useState<"case" | "image">("case")
  const formTabsId = React.useId()
  // r3: 이미지 목록 파일명 검색(제어형). 큰 그림 · 선택은 전체 기준, 표만 거른다
  const visibleImages = React.useMemo(() => {
    const q = imageQuery.trim().toLowerCase()
    return q ? sorted.filter((i) => i.fileName.toLowerCase().includes(q)) : sorted
  }, [sorted, imageQuery])

  // 검색어가 바뀌면 숨겨진 줄의 삭제 체크는 풀어, 「삭제」가 보이는 줄만 지우게 한다
  const changeImageQuery = (next: string) => {
    onImageQueryChange?.(next)
    const q = next.trim().toLowerCase()
    const visible = new Set((q ? sorted.filter((i) => i.fileName.toLowerCase().includes(q)) : sorted).map((i) => i.id))
    const kept = checkedImageIds.filter((id) => visible.has(id))
    if (kept.length !== checkedImageIds.length) onCheckedImageIdsChange(kept)
  }

  const toggleChecked =(id: string, on: boolean) =>
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
    {
      key: "name",
      header: "파일명칭",
      render: (i) => {
        const dupOf = extra?.duplicates[/(_\d+)\.[^.]+$/.exec(i.fileName)?.[1] ?? ""]
        return (
          <>
            <span className="font-code text-[11.5px]">{i.fileName}</span>
            {dupOf ? <DuplicateChip of={dupOf} /> : null}
          </>
        )
      },
    },
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

  // 지금 앱에 동작이 없는 SCAS 칸: 자리와 값만 두고 잠근다(spec §5-2 규칙 3 · 판정 R10)
  const pendingText = (label: string, variant: "text" | "mono-sm" = "text") => (
    <Field
      variant={variant}
      value={pendingValues?.[label] ?? ""}
      readOnly
      disabled
      title="준비 중"
      aria-label={label}
    />
  )
  const pendingRadio = (label: string, options: string[]) => (
    <span title="준비 중" className="inline-flex">
      <RadioRow
        name={label}
        value={pendingValues?.[label] ?? null}
        onValueChange={() => undefined}
        options={options.map((o) => ({ value: o, label: o }))}
        disabled
      />
    </span>
  )

  // 사건정보: 시안 순서 그대로(감정번호 자리에 사건등록번호). 동작하는 칸 7개만 고칠 수 있다.
  const caseRows: SearchFormRow[] = [
    { label: "사건등록번호", required: true, field: text("apprslReqestNo", "사건등록번호", "mono") },
    { label: "문서번호", field: pendingText("문서번호") },
    { label: "SCAS사건번호", field: pendingText("SCAS사건번호") },
    { label: "피해자 성명", field: pendingText("피해자 성명") },
    {
      label: "의뢰관서",
      field: canEdit ? (
        <Combobox
          aria-label="의뢰관서"
          items={officeItems}
          value={form.rqestGrfcNm || null}
          onValueChange={(v) => onFieldChange("rqestGrfcNm", v)}
          placeholder="의뢰관서 검색"
        />
      ) : (
        <Field variant="pick" readOnly value={form.rqestGrfcNm} aria-label="의뢰관서" />
      ),
    },
    { label: "출생년도", field: pendingText("출생년도") },
    { label: "사건 이름", field: text("crimeNm", "사건 이름") },
    { label: "용의자 유무", field: pendingRadio("용의자 유무", ["유", "무"]) },
    { label: "사건일시", field: pendingText("사건일시", "mono-sm") },
    { label: "사건장소", field: pendingText("사건장소") },
    { label: "발생관서", field: pendingText("발생관서") },
    { label: "검거여부", field: pendingText("검거여부") },
    { label: "사건주소", field: pendingText("사건주소") },
    { label: "감정의뢰 담당자", field: pendingText("감정의뢰 담당자") },
    { label: "사건개요", span: 3, field: pendingText("사건개요") },
    { label: "비고", span: 3, field: pendingText("비고") },
  ]

  // 현장 이미지 정보: 시안 순서 그대로. 채취 일시 · 채취 장소 · 발견 방법(= 채취 방법) · 이미지 번호만 동작한다.
  const imageRows: SearchFormRow[] = [
    { label: "구분", field: pendingRadio("구분", ["신발", "타이어"]) },
    { label: "이미지 번호", field: text("aprthngSn", "이미지 번호", "mono") },
    { label: "채취 일시", field: text("pickDt", "채취 일시", "mono-sm") },
    { label: "채취자 계급", field: pendingText("채취자 계급") },
    { label: "채취 장소", field: text("pickPlace", "채취 장소") },
    { label: "채취자 이름", field: pendingText("채취자 이름") },
    {
      label: "발견 방법",
      // 입력 칸 위치는 늘 같게 둔다(「기타」를 고치는 동안 칸이 다시 만들어져 커서가 빠지지 않도록)
      field: (
        <div className="grid gap-[4px]">
          <span className="flex items-center gap-[6px]">
            {text("pickMthCode", "발견 방법", "mono")}
            {extra && form.pickMthCode === "기타" ? (
              <Chip data-plus variant="amber-h18" className="shrink-0">
                확인 필요
              </Chip>
            ) : null}
          </span>
          {/* 사건 창 안에서는 AI 제안 상자를 두지 않는다(창의 AI 는 문양 추출만 — 결정 기록 §3-3, 2회차 검수) */}
          {extra && !inWindow && form.pickMthCode === "기타" ? (
            <MethodSuggestion
              suggestion={extra.methodSuggestion}
              canApply={canEdit}
              onApply={() => onFieldChange("pickMthCode", extra.methodSuggestion.value)}
            />
          ) : null}
        </div>
      ),
    },
    { label: "감정물 종류", field: pendingText("감정물 종류") },
    { label: "제조사", field: pendingText("제조사") },
    { label: "족적 구분", field: pendingRadio("족적 구분", ["좌", "우", "불상"]) },
    { label: "상표", field: pendingText("상표") },
    { label: "굽 유무", field: pendingRadio("굽 유무", ["유", "무", "불상"]) },
    { label: "화종", span: 3, field: pendingText("화종") },
  ]

  const handleFiles = (files: File[]) => {
    if (canEdit) onFilesAdded(files)
  }

  // 사건 창 안에서는 S02 머리 줄(제목 · 작은 단계 스텝퍼 · 이전 · 다음 · 사건복사 · 수정 · 닫기 · 「검색 (문양 상세보기) →」)을 그리지 않는다 —
  // 창 머리(‹ › ✕ · ⋯ 메뉴) · 단계 띠 · 작업 탭이 같은 일을 한다(11/16 사용자 「숨길건 숨기고」)
  const headTitle = inWindow ? undefined : (
        <span className="inline-flex items-baseline gap-[8px]">
          {mode === "register" ? "사건 등록" : "사건관리"}
          {mode === "detail" && aprthngNo ? (
            <span className="font-code text-[12px] font-normal text-muted-foreground">{aprthngNo}</span>
          ) : null}
          {mode === "detail" && extra ? (
            <Stepper
              data-plus
              variant="labeled"
              partId="S02-42"
              steps={["접수", "1차 작업", "검색·판정", "교차 검증", "감정서"]}
              current={extra.stage}
              className="ml-[14px]"
            />
          ) : null}
        </span>
  )
  const headActions = inWindow ? undefined : (
        <ButtonBar variant="modal-head" aria-label="사건 상세 도구">
          {mode === "detail" ? (
            <>
              {/* 이전 · 다음 사건 이동은 지금 앱에 없다: +α 를 켜면 시안대로 활성 모양 + 준비 중 알림, 끄면 1차처럼 잠금 */}
              {showPlus ? (
                <>
                  <Button size="sm" onClick={() => onMockAction?.("이전")}>
                    이전
                  </Button>
                  <Button size="sm" onClick={() => onMockAction?.("다음")}>
                    다음
                  </Button>
                </>
              ) : (
                <>
                  <span title="준비 중" className="inline-flex">
                    <Button size="sm" disabled>
                      이전
                    </Button>
                  </span>
                  <span title="준비 중" className="inline-flex">
                    <Button size="sm" disabled>
                      다음
                    </Button>
                  </span>
                </>
              )}
              {canEdit ? (
                <Button size="sm" onClick={onCopy}>
                  사건복사
                </Button>
              ) : null}
              {extra ? (
                <Button
                  data-plus
                  size="sm"
                  locked={!canEdit}
                  roleLock
                  onClick={() => onMockAction?.("수정")}
                >
                  수정
                </Button>
              ) : null}
            </>
          ) : null}
          <Button size="sm" onClick={onClose}>
            닫기
          </Button>
          {mode === "detail" && canGoSearch ? (
            <>
              <span aria-hidden="true" className="h-[20px] w-px bg-line-3" />
              <Button size="sm" variant="pri" onClick={onOpenSearch}>
                검색 (문양 상세보기) →
              </Button>
            </>
          ) : null}
          {mode === "detail" && verifierView ? (
            <>
              <span aria-hidden="true" className="h-[20px] w-px bg-line-3" />
              <Chip data-plus variant="h22" partId="S02-11">
                기술책임자 · 읽기 전용
              </Chip>
            </>
          ) : null}
          {mode === "detail" && investigatorView ? (
            <>
              <span aria-hidden="true" className="h-[20px] w-px bg-line-3" />
              <Chip data-plus variant="h22">
                수사관 · 의뢰한 사건만
              </Chip>
            </>
          ) : null}
        </ButtonBar>
  )

  const imageChip = selected ? (
    <Chip variant="blue-mono-h20" partId="S02-10">
      {selected.fileName.replace(/^.*(_\d+)\.[^.]+$/, "$1")}
    </Chip>
  ) : null
  const scopeTools = extra ? (
    <span data-plus className="flex items-center gap-[6px]">
      {/* 「선택한 이미지 모두 적용」은 여러 장을 고르는 표가 있을 때만 — 사건 창은 그 표가 없어 뺀다(2회차 검수) */}
      {inWindow ? null : (
        <Segmented
          aria-label="적용 범위"
          value={applyScope}
          onValueChange={(v) => setApplyScope(v as "one" | "all")}
          items={[
            { value: "one", label: "이 이미지만" },
            { value: "all", label: "선택한 이미지 모두 적용" },
          ]}
        />
      )}
      {inWindow ? (
        <WorkbenchButton size="sm" icon={PencilLine} disabled={!canEdit} title={canEdit ? undefined : "수정 권한 없음"} onClick={() => onMockAction?.("수정")}>
          수정
        </WorkbenchButton>
      ) : (
        <Button size="sm" locked={!canEdit} onClick={() => onMockAction?.("수정")}>
          수정
        </Button>
      )}
    </span>
  ) : null
  const saveBar = canEdit ? (
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
      {inWindow ? (
        <>
          <WorkbenchButton variant="ghost" icon={RotateCcw} onClick={onReset}>
            초기화
          </WorkbenchButton>
          <WorkbenchButton variant="primary" icon={Save} disabled={saving} onClick={onSave}>
            {saving ? "저장 중..." : "저장"}
          </WorkbenchButton>
        </>
      ) : (
        <>
          <Button size="sm" onClick={onReset}>
            초기화
          </Button>
          <Button size="sm" variant="pri" disabled={saving} onClick={onSave}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        </>
      )}
    </div>
  ) : null
  const errorLine = errorMessage ? (
    <p
      role="alert"
      className="m-0 rounded-[6px] border border-solid border-danger-line bg-danger-bg px-[10px] py-[7px] text-[12.5px] text-danger-fg"
    >
      {errorMessage}
    </p>
  ) : null

  // 사건 창 안: 왼쪽 족윤적 이미지(높이 꽉) | 오른쪽 「사건정보 | 현장 이미지 정보」 탭(표는 그 안에서 스크롤, 저장 줄은 바닥).
  // 두 칸 머리를 같은 높이 · 같은 밑선으로 맞추고, 소제목은 밑줄 탭 모양(13 굵게 · 고른 것 brand 밑줄 2px)으로 바꾼다
  // (11/17 사용자 「오른쪽 정렬 안 맞는건?? … 저 소제목 디자인 바꿔」). 단독 진열(S02)은 SCAS 시안 그대로 Band.
  if (inWindow && status === "ready") {
    return (
      <div data-slot="case-detail-window" className="grid h-full min-h-0 grid-cols-[300px_minmax(0,1fr)] gap-[14px] p-[12px]">
        <section aria-label="족윤적 이미지" className="flex min-h-0 flex-col gap-[8px]">
          <PaneHead title="족윤적 이미지" end={imageChip} />
          <div className="min-h-0 flex-1">
            {selected && extra ? (
              <EvidenceWithAi src={selected.src} alt={`${selected.fileName} 미리보기`} caption={selected.fileName} plus={extra} fill />
            ) : selected ? (
              <EvidenceImage
                src={selected.src}
                alt={`${selected.fileName} 미리보기`}
                caption={selected.fileName}
                ruler
                className="aspect-auto h-full"
              />
            ) : (
              <p className="m-0 grid h-full place-items-center rounded-[10px] border border-dashed border-line-3 text-[12px] text-muted-foreground">
                이미지 없음
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-[6px]">
            {showFlip ? (
              <Chip data-plus variant="amber" partId="S02-05">
                {extra?.flipNote}
              </Chip>
            ) : null}
            {/* 이미지 편집 탭이 없는 사람(수사관 — 사건 조회 권한 없음)에게는 눌러도 갈 곳이 없으니 숨긴다(3회차 검수) */}
            {canSearch ? (
              <WorkbenchButton icon={Scissors} className="ml-auto" disabled={!selected} onClick={() => selected && onOpenImageEdit(selected.id)}>
                이미지 커팅 열기
              </WorkbenchButton>
            ) : null}
          </div>
        </section>

        <section aria-label="사건 · 현장 이미지 정보" className="@container flex min-h-0 min-w-0 flex-col gap-[8px]">
          <UnderlineTabs
            label="정보"
            tabs={[
              ["case", "사건정보"],
              [
                "image",
                <span key="image" className="inline-flex items-center gap-1.5">
                  현장 이미지 정보 {imageChip}
                </span>,
              ],
            ]}
            value={formTab}
            onChange={setFormTab}
            idPrefix={formTabsId}
            end={
              formTab === "image" ? (
                scopeTools
              ) : extra ? (
                // 칸이 좁으면(왼쪽 목록 펼침) 탭 줄이 넘치지 않게 안내 글은 숨긴다
                <span data-plus className="text-[11px] text-dim @max-[560px]:hidden">
                  대부분 공문 그대로 · 수정은 창 머리 ⋯ 메뉴로
                </span>
              ) : null
            }
          />
          {/* R6 1280: 라벨 칸을 118 로 넓히고 한 줄로(「감정의뢰 담당자」가 두 줄로 깨지지 않게) — 값 칸이 나머지를 나눠 가진다 */}
          <div
            role="tabpanel"
            aria-labelledby={`${formTabsId}-${formTab}`}
            className="flex min-h-0 flex-1 flex-col gap-[8px] overflow-auto [&_[data-part=SearchForm]>div]:grid-cols-[118px_minmax(0,1fr)_118px_minmax(0,1fr)] [&_[data-part=SearchForm]>div>div:nth-child(odd)]:px-[8px] [&_[data-part=SearchForm]>div>div:nth-child(odd)]:whitespace-nowrap"
          >
            {errorLine}
            <SearchForm columns={2} rows={formTab === "case" ? caseRows : imageRows} />
          </div>
          {saveBar ? <div className="shrink-0 border-0 border-t border-solid border-border pt-[8px]">{saveBar}</div> : null}
        </section>
      </div>
    )
  }

  return (
    <Panel aria-busy={status === "loading" ? "true" : undefined} title={headTitle} actions={headActions}>
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
            <div className={cn("mx-auto w-full", extra ? "max-w-none" : "max-w-[200px]")}>
              {selected && extra ? (
                <EvidenceWithAi
                  src={selected.src}
                  alt={`${selected.fileName} 미리보기`}
                  caption={selected.fileName}
                  plus={extra}
                />
              ) : selected ? (
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
              {showFlip ? (
                <Chip data-plus variant="amber" partId="S02-05">
                  {extra?.flipNote}
                </Chip>
              ) : null}
              <Button size="sm" disabled={!selected} onClick={() => selected && onOpenImageEdit(selected.id)}>
                이미지 커팅 열기
              </Button>
            </div>

            {/* 사건 창 안에서는 이미지 목록 표 · 끌어 놓기 · AI 점검 카드를 그리지 않는다 — 창 왼쪽 목록 · 맨 아래 사진 추가 · 할 일 상자가 같은 일을 한다 */}
            {inWindow ? null : (
            <>
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
            {onImageQueryChange ? (
              <div className="px-[6px] py-[6px]">
                <FilterBar
                  query={imageQuery}
                  onQueryChange={changeImageQuery}
                  filters={[]}
                  onFilterChange={() => undefined}
                  onClear={() => changeImageQuery("")}
                  resultCount={visibleImages.length}
                  total={sorted.length}
                  searchPlaceholder="파일명 검색"
                  partId="s02-image-search"
                />
              </div>
            ) : null}
            {onImageQueryChange && imageQuery.trim() !== "" && visibleImages.length === 0 ? (
              <div className="px-[14px] py-[18px] text-center">
                <p role="status" className="m-0 mb-[8px] text-[12.5px] text-dim">
                  조건에 맞는 항목 없음
                </p>
                <Button size="sm" onClick={() => changeImageQuery("")}>
                  조건 지우기
                </Button>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <DataGrid
                columns={columns}
                rows={visibleImages}
                rowKey={(i) => i.id}
                selectedKey={selected?.id}
                onRowClick={(i) => onSelectImage(i.id)}
                emptyText="이미지 없음"
                // 시안 이미지 목록: 칸 좌우 6px · 행 30(+α 를 켰을 때만 — 칩이 붙어도 300px 칸에 들어가게)
                className={extra ? "[&_td]:h-[30px] [&_td]:px-[6px] [&_th]:h-[28px] [&_th]:px-[6px]" : undefined}
              />
            </div>
            )}
            </>
            )}
            {canEdit && !inWindow ? (
              <CaseImageDrop onFilesAdded={handleFiles} uploading={uploading} plus={Boolean(extra)} inputRef={fileInput} />
            ) : null}
            {extra && analystView && !inWindow ? <AiCheckCard plus={extra} onMockAction={onMockAction} /> : null}
          </div>

          {/* 오른쪽: 사건정보(지금 앱 입력 7칸) */}
          <div className="grid min-w-0 content-start gap-[8px]">
            {extra && !inWindow ? <SourceLine plus={extra} /> : null}
            <Band title="사건정보">
              {extra ? (
                <span data-plus className="text-[11px] text-dim">
                  {inWindow ? "대부분 공문 그대로 · 수정은 창 머리 ⋯ 메뉴로" : "대부분 공문 그대로 · 수정은 「수정」으로"}
                </span>
              ) : null}
            </Band>
            {errorLine}
            <SearchForm columns={2} rows={caseRows} />
            <Band
              title={
                <>
                  현장 이미지 정보
                  {imageChip}
                </>
              }
            >
              {scopeTools}
            </Band>
            <SearchForm columns={2} rows={imageRows} />
            {saveBar}
          </div>
        </div>
      )}
    </Panel>
  )
}
