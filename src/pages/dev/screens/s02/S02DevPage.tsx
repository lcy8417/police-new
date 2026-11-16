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
import { fakePhotoUrl } from "../mock-assets/FakePhoto"
import {
  DETAIL_FORM,
  EMPTY_FORM,
  OFFICE_ITEMS,
  PENDING_VALUES,
  S02_DEMO_UPLOAD,
  S02_PLUS,
  makeImages,
} from "./mock-cases"

const info = devScreen("s02")

export interface S02ContentProps {
  devCase: (typeof SCREEN_CASES.s02)[number]
  /** 열어 본 사건 감정번호(없으면 새 등록) */
  caseId: string | null
  /** 처음 고른 이미지 id(`<감정번호>_<n>`, 없으면 시안처럼 _2) */
  imageId?: string
  /** 화면 옮기기(없으면 진열 주소 이동) — 사건 창은 탭 바꾸기로 받는다 */
  go?: DevGo
}

// S02 사건 상세·등록 진열 페이지. `?id=` 가 있으면 열어 본 사건, 없으면 새 등록.
export function S02DevPage() {
  const devCase = useDevCase(SCREEN_CASES.s02, "ready")
  const [params] = useSearchParams()
  return (
    <DevScreenFrame screen={info.screen} title={info.title} cases={info.cases}>
      <S02Content devCase={devCase} caseId={params.get("id")} />
    </DevScreenFrame>
  )
}

/** S02 틀 없는 내용 — 진열 페이지와 사건 창(S01 「사건 정보」 탭)이 같이 쓴다 */
export function S02Content({ devCase, caseId: id, imageId, go }: S02ContentProps) {
  const viewer = useDevViewer()
  const plus = useDevPlus()
  const nav = useDevNavigate()
  const to = go ?? nav

  const [mode, setMode] = React.useState<"detail" | "register">(id ? "detail" : "register")
  const [form, setForm] = React.useState<CaseDetailForm>(id ? { ...DETAIL_FORM, apprslReqestNo: id } : EMPTY_FORM)
  const [images, setImages] = React.useState<CaseImage[]>(() => (id ? makeImages(id) : []))
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
  // +α 를 켜면 시안처럼 _13 이 68% 올라가는 중인 모양으로 시작한다
  const [uploading, setUploading] = React.useState<{ fileName: string; percent: number } | undefined>(
    plus ? S02_DEMO_UPLOAD : undefined
  )
  const timer = React.useRef<ReturnType<typeof setInterval> | null>(null)
  React.useEffect(() => () => {
    if (timer.current) clearInterval(timer.current)
  }, [])

  const addFiles = (files: File[]) => {
    if (timer.current) return
    const base = form.apprslReqestNo || "새사건"
    const start = images.reduce((m, i) => Math.max(m, Number(/_(\d+)\./.exec(i.fileName)?.[1] ?? 0)), 0)
    const added = files.map((f, k) => {
      const n = start + k + 1
      return {
        id: `${base}_${n}`,
        fileName: `${base}_${n}.jpg`,
        sizeBytes: f.size || 4_800_000,
        src: fakePhotoUrl({ seed: n, tag: String(n) }),
      }
    })
    let percent = 0
    setUploading({ fileName: added[0].fileName, percent })
    timer.current = setInterval(() => {
      percent += 25
      if (percent < 100) {
        setUploading({ fileName: added[0].fileName, percent })
        return
      }
      if (timer.current) clearInterval(timer.current)
      timer.current = null
      setUploading(undefined)
      setImages((cur) => [...cur, ...added])
      setError(null)
      toast(`${added.length}장을 추가했습니다(가짜 이미지)`)
    }, 150)
  }

  // 초기화: 열어 본 사건이면 불러온 값으로 되돌리고, 새 등록이면 비운다
  const resetForm = () => {
    setError(null)
    setChecked([])
    if (mode === "detail" && id) {
      setForm({ ...DETAIL_FORM, apprslReqestNo: id })
      setImages(makeImages(id))
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
      pendingValues={PENDING_VALUES}
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
      plus={S02_PLUS}
      onMockAction={() => toast("시안 — 기능 준비 중")}
    />
  )
}
