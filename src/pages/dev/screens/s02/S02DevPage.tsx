import * as React from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import {
  CaseDetailScreen,
  validateCaseDetail,
  type CaseDetailFieldName,
  type CaseDetailForm,
  type CaseImage,
} from "@/widgets/case-detail"

import { DEV_SCREENS, DevScreenFrame, useDevCase, useDevViewer } from "../frame"
import { fakePhotoUrl } from "../mock-assets/FakePhoto"
import { DETAIL_FORM, EMPTY_FORM, OFFICE_ITEMS, makeImages } from "./mock-cases"

const info = DEV_SCREENS.find((s) => s.id === "s02")!
// 사건 상세에는 「결과 없음」이 없다
const S02_CASES = ["ready", "loading", "error"] as const

// S02 사건 상세·등록 진열 페이지. `?id=` 가 있으면 열어 본 사건, 없으면 새 등록.
export function S02DevPage() {
  const devCase = useDevCase(S02_CASES, "ready")
  const viewer = useDevViewer()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const id = params.get("id")
  const as = params.get("as")

  const [mode, setMode] = React.useState<"detail" | "register">(id ? "detail" : "register")
  const [form, setForm] = React.useState<CaseDetailForm>(id ? { ...DETAIL_FORM, apprslReqestNo: id } : EMPTY_FORM)
  const [images, setImages] = React.useState<CaseImage[]>(() => (id ? makeImages(id) : []))
  const [selected, setSelected] = React.useState<string | null>(null)
  const [checked, setChecked] = React.useState<string[]>([])
  const [continuous, setContinuous] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const to = (path: string, extra?: Record<string, string>) => {
    const q = new URLSearchParams(extra)
    if (as) q.set("as", as)
    const s = q.toString()
    navigate(s ? `${path}?${s}` : path)
  }
  const caseId = mode === "detail" ? form.apprslReqestNo : undefined

  const onFieldChange = (name: CaseDetailFieldName, value: string) => {
    setError(null)
    setForm((f) => ({ ...f, [name]: value }))
  }

  const addFiles = (files: File[]) => {
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
    setImages((cur) => [...cur, ...added])
    setError(null)
    toast(`${added.length}장을 추가했습니다(가짜 이미지)`)
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
    <DevScreenFrame screen={info.screen} title={info.title} cases={S02_CASES}>
      <CaseDetailScreen
        status={devCase}
        errorAt="09:12"
        onRetry={() => toast("다시 조회합니다(가짜 데이터 — 케이스를 ready 로 바꿔 보세요)")}
        isAdmin={viewer.isAdmin}
        features={viewer.features}
        mode={mode}
        aprthngNo={caseId}
        form={form}
        onFieldChange={onFieldChange}
        officeItems={OFFICE_ITEMS}
        images={images}
        selectedImageId={selected}
        onSelectImage={setSelected}
        checkedImageIds={checked}
        onCheckedImageIdsChange={setChecked}
        onFilesAdded={addFiles}
        onDeleteChecked={() => {
          setImages((cur) => cur.filter((i) => !checked.includes(i.id)))
          setChecked([])
        }}
        errorMessage={error}
        continuous={continuous}
        onContinuousChange={setContinuous}
        onSave={onSave}
        onReset={() => {
          setError(null)
          setForm(EMPTY_FORM)
          setImages([])
          setChecked([])
        }}
        onClose={() => to("/dev/s01")}
        onPrev={() => toast("이전 사건은 목록의 정렬 순서를 따릅니다(가짜 데이터)")}
        onNext={() => toast("다음 사건은 목록의 정렬 순서를 따릅니다(가짜 데이터)")}
        onCopy={() => {
          // 사건복사: 값은 그대로 두고 번호만 비워 새 등록으로 바꾼다
          setForm((f) => ({ ...f, apprslReqestNo: "" }))
          setMode("register")
          setError(null)
          toast("사건을 복사했습니다. 사건등록번호를 입력하세요")
        }}
        onOpenImageEdit={(imageId) => to("/dev/s03", { id: caseId ?? "", image: imageId })}
        onOpenSearch={() => to("/dev/s04", { id: caseId ?? "" })}
      />
    </DevScreenFrame>
  )
}
