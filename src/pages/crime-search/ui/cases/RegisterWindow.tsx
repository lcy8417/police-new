import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { useCodes } from "@/entities/code"
import { registerCrime } from "@/entities/crime"
import { useRequestDetail, useRequestIdByNo } from "@/entities/request"
import { isAdmin, useSessionStore } from "@/features/auth"
import { originalRejectDetail, useOriginalUpload } from "@/features/crime-register"
import { ApiError } from "@/shared/api"
import { resizeImage } from "@/utils/get-input-change"
import { CaseDetailScreen, validateCaseDetail, type CaseDetailFieldName, type CaseDetailForm, type CaseImage } from "@/widgets/case-detail"
import { buildAprthngNo, validateCrimeRegister } from "@/widgets/crime-register-stage"

/** `RegisterWindow` 이 받는 값 */
export interface RegisterWindowProps {
  /** 사건복사로 연 경우 사건 정보를 채워 둘 감정번호(번호는 비운다). 없으면 빈 새 등록 */
  copyFrom?: string | null
  onClose: () => void
  /** 모두 등록한 뒤(연속 등록이 아니면) — 그 감정번호의 사건 창을 연다 */
  onRegistered: (apprslReqestNo: string) => void
}

/** 올린 현장 이미지 한 장(등록 전) — 장마다 채취 칸을 따로 든다(S02 진열과 같은 규칙) */
interface DraftImage {
  id: string
  /** 감정물 순번(`_n`) */
  sn: string
  sizeBytes: number
  /** 줄인 그림 data URL — 등록 본문 `image` */
  src: string
  /** 원본 올리기 고르기 번호(`useOriginalUpload`) */
  pick: number
  pickDt: string
  pickPlace: string
  pickMthCode: string
}

const CASE_KEYS = ["apprslReqestNo", "rqestGrfcNm", "crimeNm"] as const
type CaseKey = (typeof CASE_KEYS)[number]
const EMPTY_CASE: Pick<CaseDetailForm, CaseKey> = { apprslReqestNo: "", rqestGrfcNm: "", crimeNm: "" }
const noop = () => undefined

/** 그림 파일 → 1000px 이하로 줄인 data URL(지금 등록 화면과 같음) */
async function readImageFile(file: File): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error("그림을 읽지 못했습니다"))
    reader.readAsDataURL(file)
  })
  try {
    return (await resizeImage(raw)) as string
  } catch {
    return raw
  }
}

/**
 * 새 사건 등록 창(`/cases?new=1`, 사건복사 `&copy=<감정번호>`) — 승인 위젯 S02 `CaseDetailScreen` 등록 모드에
 * 원본 올리기(B1 `POST /files/original` — 파일을 고르는 순간 편집 전 바이트 보관) → 장마다 등록(A6 `POST /crime/register`)을 꽂는다.
 * 새 의뢰 상태는 서버가 정한다(직원 = 1차 작업, 수사관 = 접수 대기). 실패하면 그 자리에서 멈추고 서버 문구를 폼 위에 보인다
 * (먼저 등록된 장은 목록에서 빠져, 다시 저장하면 남은 장만 보낸다).
 */
export function RegisterWindow({ copyFrom = null, onClose, onRegistered }: RegisterWindowProps) {
  const user = useSessionStore((s) => s.user)
  const queryClient = useQueryClient()
  const original = useOriginalUpload()
  const offices = useCodes("ORG")

  const [caseForm, setCaseForm] = React.useState(EMPTY_CASE)
  const [images, setImages] = React.useState<DraftImage[]>([])
  const [selected, setSelected] = React.useState<string | null>(null)
  const [checked, setChecked] = React.useState<string[]>([])
  const [continuous, setContinuous] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [reading, setReading] = React.useState<{ fileName: string; percent: number } | undefined>(undefined)
  const seqRef = React.useRef(0)

  // 사건복사: 그 사건의 사건명 · 의뢰관서를 한 번 채운다(번호는 비움)
  const copyId = useRequestIdByNo(copyFrom ?? "")
  const copyDetail = useRequestDetail(copyFrom ? (copyId.data ?? null) : null)
  const copiedRef = React.useRef(false)
  React.useEffect(() => {
    if (copiedRef.current || !copyDetail.data) return
    copiedRef.current = true
    setCaseForm({ apprslReqestNo: "", rqestGrfcNm: copyDetail.data.rqestOrgNm ?? "", crimeNm: copyDetail.data.crimeNm ?? "" })
    toast("사건을 복사했습니다. 사건등록번호를 입력하세요")
  }, [copyDetail.data])

  const base = caseForm.apprslReqestNo.trim() || "새사건"
  const current = images.find((i) => i.id === selected) ?? images[0] ?? null
  const form: CaseDetailForm = {
    ...caseForm,
    aprthngSn: current?.sn ?? "1",
    pickDt: current?.pickDt ?? "",
    pickPlace: current?.pickPlace ?? "",
    pickMthCode: current?.pickMthCode ?? "",
  }
  const caseImages: CaseImage[] = images.map((i) => ({
    id: i.id,
    fileName: `${base}_${i.sn}.png`,
    sizeBytes: i.sizeBytes,
    src: i.src,
  }))
  const officeItems = React.useMemo(
    () => (offices.data ?? []).map((o) => ({ value: o.codeNm, label: o.codeNm })),
    [offices.data]
  )

  const onFieldChange = (name: CaseDetailFieldName, value: string) => {
    setError(null)
    if ((CASE_KEYS as readonly string[]).includes(name)) {
      setCaseForm((f) => ({ ...f, [name]: value }))
      return
    }
    if (!current) return
    const key = name === "aprthngSn" ? "sn" : name
    setImages((list) => list.map((i) => (i.id === current.id ? { ...i, [key]: value } : i)))
  }

  const addFiles = (files: File[]) => {
    if (saving || files.length === 0) return
    setError(null)
    void (async () => {
      const last = images.reduce((m, i) => Math.max(m, Number(i.sn) || 0), 0)
      const added: DraftImage[] = []
      for (const [k, file] of files.entries()) {
        setReading({ fileName: file.name, percent: Math.round((k / files.length) * 100) })
        // 줄이기 전 원본을 먼저 보관(실패해도 등록은 계속 — 작업본만 저장)
        const pick = original.start(file)
        try {
          const src = await readImageFile(file)
          seqRef.current += 1
          added.push({
            id: `img-${seqRef.current}`,
            sn: String(last + k + 1),
            sizeBytes: file.size,
            src,
            pick,
            pickDt: "",
            pickPlace: "",
            pickMthCode: "",
          })
        } catch {
          setError(`${file.name} 을(를) 읽지 못했습니다 — 다시 고르세요`)
        }
      }
      setReading(undefined)
      setImages((cur) => [...cur, ...added])
      if (added.length > 0) setSelected((s) => s ?? added[0].id)
    })()
  }

  const reset = () => {
    setCaseForm(EMPTY_CASE)
    setImages([])
    setSelected(null)
    setChecked([])
    setError(null)
    original.reset()
  }

  const onSave = async () => {
    if (saving) return
    const required = validateCaseDetail(form, images.length)
    if (required) {
      setError(required)
      return
    }
    // 장마다 서버 규칙(번호 문자 · 길이 · 채취 일시 형식)을 먼저 본다
    for (const img of images) {
      const invalid = validateCrimeRegister({
        apprslReqestNo: caseForm.apprslReqestNo.trim(),
        aprthngSn: img.sn,
        pickDt: img.pickDt,
        pickPlace: img.pickPlace,
        pickMthCode: img.pickMthCode,
        crimeNm: caseForm.crimeNm,
        rqestGrfcNm: caseForm.rqestGrfcNm,
      })
      if (invalid) {
        setSelected(img.id)
        setError(`_${img.sn}: ${invalid}`)
        return
      }
    }
    setSaving(true)
    setError(null)
    const no = caseForm.apprslReqestNo.trim()
    let done = 0
    for (const img of images) {
      const originalFileId = await original.resolveFileId(img.pick)
      try {
        await registerCrime({
          image: img.src,
          aprthngNo: buildAprthngNo(no, img.sn),
          apprslReqestNo: no,
          pickDt: img.pickDt,
          pickPlace: img.pickPlace,
          pickMthCode: img.pickMthCode,
          crimeNm: caseForm.crimeNm,
          rqestGrfcNm: caseForm.rqestGrfcNm,
          ...(originalFileId !== null && { originalFileId }),
        })
        done += 1
        setImages((cur) => cur.filter((i) => i.id !== img.id))
      } catch (e) {
        const rejected = originalRejectDetail(e)
        if (rejected !== null && originalFileId !== null) original.reject(originalFileId, rejected)
        setSelected(img.id)
        setError(e instanceof ApiError ? (e.detail ?? e.message) : "사건 등록에 실패했습니다")
        setSaving(false)
        if (done > 0) void queryClient.invalidateQueries({ queryKey: ["request"] })
        return
      }
    }
    setSaving(false)
    void queryClient.invalidateQueries({ queryKey: ["request"] })
    toast.success(`${no} — ${done}장을 등록했습니다.`)
    if (continuous) reset()
    else onRegistered(no)
  }

  return (
    <CaseDetailScreen
      status="ready"
      onRetry={noop}
      isAdmin={isAdmin(user)}
      features={user?.features ?? []}
      mode="register"
      form={form}
      onFieldChange={onFieldChange}
      officeItems={officeItems}
      images={caseImages}
      selectedImageId={current?.id ?? null}
      onSelectImage={setSelected}
      checkedImageIds={checked}
      onCheckedImageIdsChange={setChecked}
      onFilesAdded={addFiles}
      onDeleteChecked={() => {
        setImages((cur) => cur.filter((i) => !checked.includes(i.id)))
        setChecked([])
      }}
      uploading={reading}
      errorMessage={error}
      saving={saving}
      continuous={continuous}
      onContinuousChange={setContinuous}
      onSave={() => void onSave()}
      onReset={reset}
      onClose={onClose}
      onCopy={noop}
      onOpenImageEdit={noop}
      onOpenSearch={noop}
      showPlus={false}
    />
  )
}
