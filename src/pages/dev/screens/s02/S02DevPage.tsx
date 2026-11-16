import * as React from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import {
  CaseDetailScreen,
  validateCaseDetail,
  type CaseDetailFieldName,
  type CaseDetailForm,
  type CaseImage,
} from "@/widgets/case-detail"

import {
  DevScreenFrame,
  SCREEN_CASES,
  devScreen,
  useDevCase,
  useDevNavigate,
  useDevPlus,
  useDevViewer,
  type DevGo,
} from "../frame"
import { samplePhotoUrl } from "../mock-assets/sample-images"
import {
  DETAIL_FORM,
  EMPTY_FORM,
  OFFICE_ITEMS,
  PENDING_VALUES,
  S02_DEMO_UPLOAD,
  S02_PLUS,
  makeImages,
} from "./mock-cases"
import { useFakeUpload } from "./use-fake-upload"

const info = devScreen("s02")

export interface S02ContentProps {
  devCase: (typeof SCREEN_CASES.s02)[number]
  /** 열어 본 사건 감정번호(없으면 새 등록) */
  caseId: string | null
  /** 처음 고른 이미지 id(`<감정번호>_<n>`, 없으면 시안처럼 _2) */
  imageId?: string
  /** 화면 옮기기(없으면 진열 주소 이동) — 사건 창은 탭 바꾸기로 받는다 */
  go?: DevGo
  /** 사건 창(S01 「사건 정보」 탭) 안 — 창이 같은 일을 하는 S02 머리 줄 · 이미지 목록 · AI 점검 카드 · 접수 경로 줄을 숨긴다 */
  inWindow?: boolean
  /** 그 사건의 값(사건 창이 목록 행에서 만들어 넘김) — 없으면 시안 0649 예시값 12장 */
  facts?: S02CaseFacts
  /** 이 사건을 복사해 새 등록으로 시작(사건 창 ⋯ 「사건복사」 → `/dev/s02?copy=<감정번호>`) */
  copyOf?: string | null
}

/** 사건 창이 넘기는 그 사건의 값 — 장수 · 폼 값 · 잠긴 SCAS 칸 값 · 전사판 장 */
export interface S02CaseFacts {
  imageCount: number
  form: Partial<CaseDetailForm>
  pending: Readonly<Record<string, string>>
  flipRefs: readonly string[]
}

// S02 사건 상세·등록 진열 페이지. `?id=` 가 있으면 열어 본 사건, `?copy=` 면 그 사건을 복사한 새 등록, 없으면 새 등록.
export function S02DevPage() {
  const devCase = useDevCase(SCREEN_CASES.s02, "ready")
  const [params] = useSearchParams()
  return (
    <DevScreenFrame screen={info.screen} title={info.title} cases={info.cases}>
      <S02Content devCase={devCase} caseId={params.get("id")} copyOf={params.get("copy")} />
    </DevScreenFrame>
  )
}

/** S02 틀 없는 내용 — 진열 페이지와 사건 창(S01 「사건 정보」 탭)이 같이 쓴다 */
export function S02Content({ devCase, caseId: id, imageId, go, inWindow = false, facts, copyOf }: S02ContentProps) {
  const viewer = useDevViewer()
  const plus = useDevPlus()
  const nav = useDevNavigate()
  const to = go ?? nav

  // 처음 값: 열어 본 사건(그 사건 값이 있으면 덮음) · 복사(번호만 비움) · 새 등록
  const source = id ?? copyOf ?? null
  const loadedForm = (no: string): CaseDetailForm => ({ ...DETAIL_FORM, apprslReqestNo: no, ...facts?.form })
  const loadedImages = (no: string) => makeImages(no, facts?.imageCount)
  const pendingValues = facts ? { ...PENDING_VALUES, ...facts.pending } : PENDING_VALUES
  const plusValues = facts
    ? { ...S02_PLUS, flipRefs: facts.flipRefs, aiCheck: { ...S02_PLUS.aiCheck, imageCount: facts.imageCount } }
    : S02_PLUS

  const [mode, setMode] = React.useState<"detail" | "register">(id ? "detail" : "register")
  const [form, setForm] = React.useState<CaseDetailForm>(() =>
    id ? loadedForm(id) : copyOf ? { ...loadedForm(copyOf), apprslReqestNo: "" } : EMPTY_FORM
  )
  const [images, setImages] = React.useState<CaseImage[]>(() => (source ? loadedImages(source) : []))
  // 시안은 _2(전사판)를 보고 있는 모양
  const [selected, setSelected] = React.useState<string | null>(imageId ?? (id ? `${id}_2` : null))
  const [checked, setChecked] = React.useState<string[]>([])
  const [imageQuery, setImageQuery] = React.useState("")
  const [continuous, setContinuous] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const caseId = mode === "detail" ? form.apprslReqestNo : undefined

  const onFieldChange = (name: CaseDetailFieldName, value: string) => {
    setError(null)
    setForm((f) => ({ ...f, [name]: value }))
  }

  // 올리는 중 막대: 0 → 100 을 흉내 낸 뒤 목록에 붙인다(가짜 — 서버 호출 없음)
  // +α 를 켜면 시안처럼 _13 이 68% 올라가는 중인 모양으로 시작한다(사건 창 안에서는 목록 · 끌어 놓기가 창 왼쪽으로 가서 그리지 않는다)
  const { uploading, start } = useFakeUpload(plus && !inWindow ? S02_DEMO_UPLOAD : undefined)

  const addFiles = (files: File[]) => {
    const base = form.apprslReqestNo || "새사건"
    const last = images.reduce((m, i) => Math.max(m, Number(/_(\d+)\./.exec(i.fileName)?.[1] ?? 0)), 0)
    const added = files.map((f, k) => {
      const n = last + k + 1
      return {
        id: `${base}_${n}`,
        fileName: `${base}_${n}.jpg`,
        sizeBytes: f.size || 4_800_000,
        src: samplePhotoUrl(`${base}_${n}`, { seed: n, tag: String(n) }),
      }
    })
    start(added[0].fileName, () => {
      setImages((cur) => [...cur, ...added])
      setError(null)
      toast(`${added.length}장을 추가했습니다(가짜 이미지)`)
    })
  }

  // 초기화: 열어 본 사건이면 불러온 값으로 되돌리고, 새 등록이면 비운다
  const resetForm = () => {
    setError(null)
    setChecked([])
    if (mode === "detail" && id) {
      setForm(loadedForm(id))
      setImages(loadedImages(id))
    } else {
      setForm(EMPTY_FORM)
      setImages([])
    }
  }

  const onSave = () => {
    const message = validateCaseDetail(form, images.length)
    setError(message)
    if (message) return
    toast.success("사건이 등록되었습니다.")
    if (mode === "register" && continuous) {
      // 연속 등록: 폼과 이미지를 비우고 다음 사건을 받는다
      setForm(EMPTY_FORM)
      setImages([])
      setChecked([])
    }
  }

  return (
    <CaseDetailScreen
      status={devCase}
      errorAt="09:12"
      onRetry={() => toast("다시 조회합니다(가짜 데이터 — 케이스를 ready 로 바꿔 보세요)")}
      isAdmin={viewer.isAdmin}
      features={viewer.features}
      mode={mode}
      aprthngNo={caseId}
      form={form}
      pendingValues={pendingValues}
      uploading={uploading}
      onFieldChange={onFieldChange}
      officeItems={OFFICE_ITEMS}
      images={images}
      selectedImageId={selected}
      onSelectImage={setSelected}
      checkedImageIds={checked}
      onCheckedImageIdsChange={setChecked}
      onFilesAdded={addFiles}
      imageQuery={imageQuery}
      onImageQueryChange={setImageQuery}
      onDeleteChecked={() => {
        setImages((cur) => cur.filter((i) => !checked.includes(i.id)))
        setChecked([])
      }}
      errorMessage={error}
      continuous={continuous}
      onContinuousChange={setContinuous}
      onSave={onSave}
      onReset={resetForm}
      onClose={() => to("/dev/s01")}
      onCopy={() => {
        // 사건복사: 값은 그대로 두고 번호만 비워 새 등록으로 바꾼다
        setForm((f) => ({ ...f, apprslReqestNo: "" }))
        setMode("register")
        setError(null)
        toast("사건을 복사했습니다. 사건등록번호를 입력하세요")
      }}
      onOpenImageEdit={(imageId) => to("/dev/s03", { id: caseId ?? "", image: imageId })}
      onOpenSearch={() => to("/dev/s04", { id: caseId ?? "" })}
      showPlus={plus}
      plus={plusValues}
      onMockAction={() => toast("시안 — 기능 준비 중")}
      inWindow={inWindow}
    />
  )
}
