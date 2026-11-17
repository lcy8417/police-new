import * as React from "react"
import { toast } from "sonner"

import type { RequestDetail, RequestImage } from "@/entities/request"
import { FEATURES, FEATURE_ORDER, type FeatureCode } from "@/entities/session"
import { useSessionStore } from "@/features/auth"
import { useSaveCaseInfo, type ImageFieldChanges, type RequestFieldChanges } from "@/features/case-info"
import { ApiError, backendMediaUrl } from "@/shared/api"
import { CaseDetailScreen, type CaseDetailFieldName, type CaseDetailForm, type CaseImage } from "@/widgets/case-detail"

import type { TabViewer } from "./model/use-viewer"

const noop = () => undefined
const NO_IDS: string[] = []
/** 직원 역할(서버 `auth/entities.STAFF_ROLES`) — 직원은 발송 전까지, 수사관은 접수 전만 사건 정보를 고친다(§3-10) */
const STAFF_ROLES = ["EXAMINER", "REVIEWER"]

// 「준비 중」 SCAS 칸 라벨 → 서버 칸(사건 = A3 · 장 = A8). 코드 칸(사건장소 · 검거여부 · 감정물 종류 · 제조사 …)은
// 코드 고르기 부품이 없어 값만 보인다(읽기 전용).
const CASE_TEXT: Readonly<Record<string, keyof RequestFieldChanges>> = {
  문서번호: "docNo",
  SCAS사건번호: "scasCaseNo",
  "피해자 성명": "victimNm",
  출생년도: "victimBrthy",
  사건주소: "crimeAdres",
  "감정의뢰 담당자": "rqestChargerNm",
  사건개요: "crimeSmryCn",
  비고: "rm",
}
const IMAGE_TEXT: Readonly<Record<string, keyof ImageFieldChanges>> = { "채취자 이름": "pickmanNm" }
/** 수정할 수 있는 칸(위젯 `editableLabels`) — 폼 칸 라벨 + 위 표 + 용의자 유무 */
const EDITABLE_LABELS = ["사건 이름", "채취 일시", "채취 장소", "발견 방법", "용의자 유무", ...Object.keys(CASE_TEXT), ...Object.keys(IMAGE_TEXT)]

/** KST ISO → `YYYY-MM-DD HH:mm`(없으면 빈 칸) */
const dtLabel = (iso: string | null | undefined) => (iso ? iso.slice(0, 16).replace("T", " ") : "")
const yn = (v: string | null, yes: string, no: string) => (v === "Y" ? yes : v === "N" ? no : "")

/** 서버 값 → 폼 7칸 */
function formOf(detail: RequestDetail, img: RequestImage): CaseDetailForm {
  return {
    apprslReqestNo: detail.apprslReqestNo,
    aprthngSn: String(img.no),
    rqestGrfcNm: detail.rqestOrgNm ?? detail.rqestOrgEtcNm ?? "",
    crimeNm: detail.crimeNm ?? "",
    pickDt: dtLabel(img.pickDt),
    pickPlace: img.pickPlace ?? "",
    pickMthCode: img.pickMthCode ?? "",
  }
}

/** 서버 값 → SCAS 칸(라벨 → 보일 글자) */
function pendingOf(detail: RequestDetail, img: RequestImage): Record<string, string> {
  const out: Record<string, string> = {
    "용의자 유무": yn(detail.suspectExstAt, "유", "무"),
    사건일시: [dtLabel(detail.crimeBeginDt), dtLabel(detail.crimeEndDt)].filter(Boolean).join(" ~ "),
    사건장소: detail.crimePlaceCode ?? "",
    발생관서: detail.occrrncOrgNm ?? "",
    검거여부: detail.arrestSttusCode ?? "",
    구분: img.kind === "tire" ? "타이어" : "신발",
    "채취자 계급": img.pickmanClssCode ?? "",
    "감정물 종류": img.aprthngKndCode ?? "",
    제조사: img.makrCode ?? "",
    상표: img.brandCode ?? "",
    "굽 유무": yn(img.heelExstAt, "유", "무"),
    화종: img.clCode ?? "",
  }
  for (const [label, key] of Object.entries(CASE_TEXT)) out[label] = (detail[key as keyof RequestDetail] as string | null) ?? ""
  for (const [label, key] of Object.entries(IMAGE_TEXT)) out[label] = (img[key as keyof RequestImage] as string | null) ?? ""
  return out
}

const blankToNull = (v: string) => (v.trim() === "" ? null : v.trim())

export interface InfoTabProps {
  viewer: TabViewer
  detail: RequestDetail
  /** 고른 이미지(A2 감정물) */
  image: RequestImage
  onSelectImage: (aprthngNo: string) => void
  onOpenImageEdit: (aprthngNo: string) => void
  onOpenPattern: () => void
}

/**
 * 「사건 정보」 탭 — 사건 · 현장 이미지 정보를 의뢰 상세(A2)로 보이고, 고칠 수 있으면 「저장」 한 번에
 * 사건 칸(A3 `PUT /requests/{id}`) → 바뀐 장 칸(A8 `PUT /crime/{no}/info`) 순서로 보낸다(`useSaveCaseInfo`, 기대 판 번호 `rowVersion`).
 * 고칠 수 있는 때(§3-10): 사건 등록 권한 + 앱 사건 + 직원은 발송 전 · 수사관은 접수 전. 아니면 읽기 전용(저장 줄 없음).
 * 409(다른 사람이 먼저 고침) · 403 은 폼 위 오류 줄에 서버 문구 그대로 + 다시 읽기(부르는 쪽이 판 번호로 탭을 새로 그림).
 */
export function InfoTab({ viewer, detail, image, onSelectImage, onOpenImageEdit, onOpenPattern }: InfoTabProps) {
  const roles = useSessionStore((s) => s.user?.roles)
  const staff = viewer.isAdmin || (roles ?? []).some((r) => STAFF_ROLES.includes(r))
  const canRegister = viewer.isAdmin || viewer.features.includes(FEATURES.CRIME_REGISTER)
  const editable =
    canRegister &&
    detail.dataSrcSe === "APP" &&
    (staff ? detail.rqestSttus !== "SENT" && detail.rqestSttus !== "ARCHIVED" : detail.rqestSttus === "REQUESTED")
  // 고칠 수 없으면 위젯 편집 권한(CRIME_REGISTER)을 빼고 넘겨 저장 줄 · 수정을 숨긴다(관리자는 위젯이 모든 권한을 주므로 끈다)
  const features = React.useMemo<readonly FeatureCode[]>(() => {
    const all = viewer.isAdmin ? FEATURE_ORDER : viewer.features
    return editable ? all : all.filter((f) => f !== FEATURES.CRIME_REGISTER)
  }, [viewer, editable])

  const baseForm = React.useMemo(() => formOf(detail, image), [detail, image])
  const basePending = React.useMemo(() => pendingOf(detail, image), [detail, image])
  const [form, setForm] = React.useState(baseForm)
  const [pending, setPending] = React.useState(basePending)
  const [error, setError] = React.useState<string | null>(null)
  const save = useSaveCaseInfo()

  const caseImages = React.useMemo<CaseImage[]>(
    () =>
      detail.images.map((i) => ({
        id: i.aprthngNo,
        fileName: i.aprthngNo,
        // 파일 크기는 서버가 주지 않는다
        sizeBytes: 0,
        src: i.thumbUrl ? backendMediaUrl(i.thumbUrl) : "",
      })),
    [detail.images]
  )

  const onFieldChange = (name: CaseDetailFieldName, value: string) => {
    setError(null)
    setForm((f) => ({ ...f, [name]: value }))
  }
  const onPendingChange = (label: string, value: string) => {
    setError(null)
    setPending((p) => ({ ...p, [label]: value }))
  }

  const handleSave = async () => {
    const request: RequestFieldChanges = {}
    const img: ImageFieldChanges = {}
    if (form.crimeNm !== baseForm.crimeNm) request.crimeNm = blankToNull(form.crimeNm)
    for (const [label, key] of Object.entries(CASE_TEXT)) {
      if (pending[label] !== basePending[label]) (request as Record<string, string | null>)[key] = blankToNull(pending[label] ?? "")
    }
    if (pending["용의자 유무"] !== basePending["용의자 유무"]) {
      request.suspectExstAt = pending["용의자 유무"] === "유" ? "Y" : pending["용의자 유무"] === "무" ? "N" : null
    }
    if (form.pickDt !== baseForm.pickDt) img.pickDt = blankToNull(form.pickDt)
    if (form.pickPlace !== baseForm.pickPlace) img.pickPlace = blankToNull(form.pickPlace)
    if (form.pickMthCode !== baseForm.pickMthCode) img.pickMthCode = blankToNull(form.pickMthCode)
    for (const [label, key] of Object.entries(IMAGE_TEXT)) {
      if (pending[label] !== basePending[label]) (img as Record<string, string | null>)[key] = blankToNull(pending[label] ?? "")
    }
    if (Object.keys(request).length === 0 && Object.keys(img).length === 0) {
      toast("바뀐 내용이 없습니다.")
      return
    }
    if (request.victimBrthy && !/^\d{4}$/.test(request.victimBrthy)) {
      setError("출생년도는 숫자 4자리입니다")
      return
    }
    try {
      await save.mutateAsync({
        rqestId: detail.rqestId,
        request: Object.keys(request).length > 0 ? { rowVersion: detail.rowVersion, changes: request } : null,
        images: Object.keys(img).length > 0 ? [{ aprthngNo: image.aprthngNo, rowVersion: image.rowVersion, changes: img }] : [],
      })
      toast.success("사건 정보를 저장했습니다.")
    } catch (e) {
      setError(e instanceof ApiError ? (e.detail ?? e.message) : "사건 정보를 저장하지 못했습니다")
    }
  }

  return (
    <CaseDetailScreen
      status="ready"
      onRetry={noop}
      isAdmin={false}
      features={features}
      mode="detail"
      aprthngNo={detail.apprslReqestNo}
      form={form}
      pendingValues={pending}
      editableLabels={editable ? EDITABLE_LABELS : []}
      onPendingChange={onPendingChange}
      onFieldChange={onFieldChange}
      officeItems={[]}
      images={caseImages}
      selectedImageId={image.aprthngNo}
      onSelectImage={onSelectImage}
      checkedImageIds={NO_IDS}
      onCheckedImageIdsChange={noop}
      onFilesAdded={noop}
      onDeleteChecked={noop}
      errorMessage={error}
      saving={save.isPending}
      continuous={false}
      onContinuousChange={noop}
      onSave={() => void handleSave()}
      onReset={() => {
        setForm(baseForm)
        setPending(basePending)
        setError(null)
      }}
      onClose={noop}
      onCopy={noop}
      onOpenImageEdit={onOpenImageEdit}
      onOpenSearch={onOpenPattern}
      showPlus={false}
      inWindow
    />
  )
}
