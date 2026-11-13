import { useCallback, useRef, useState } from "react"
import { useMutation } from "@tanstack/react-query"

import { registerCrime, useCrimeStore } from "@/entities/crime"
import { FEATURES } from "@/entities/session"
import { hasFeature, useSessionStore } from "@/features/auth"
import {
  originalRejectDetail,
  rotateArbitrary,
  useImageAdjustments,
  useImageEditor,
  useOriginalUpload,
} from "@/features/crime-register"
import { ApiError } from "@/shared/api"
import { DotGrid, GlowOrb } from "@/shared/ui/glow-fx"
import { rotateImage, resizeImage } from "@/utils/get-input-change"

import {
  buildAprthngNo,
  EMPTY_FORM,
  type CrimeFormData,
  type CrimeRegisterForm,
} from "../model/form"
import { validateCrimeRegister } from "../model/validate-crime-register"
import { EvidenceImagePanel } from "./EvidenceImagePanel"
import { CaseInfoPanel } from "./CaseInfoPanel"

interface RegisterStageProps {
  /** 저장 성공·취소(초기화) 시 호출 — 페이지가 조회 모드로 복귀한다. */
  onExit: () => void
}

/**
 * 신규 사건 등록 스테이지 위젯(`/search?mode=register`). 등록 `formData`를 소유하고,
 * 업로드 / ±90도·자유각 회전 / 크롭 / 4점 각도보정 / 가시성 보정(밝기·대비·감마·
 * 임계값·반전·흑백) / 저장 / 초기화를 crime 엔티티 계층과 연결한다. `TopNav`에는
 * 제목만 게시하고, 편집 도구(크롭·각도보정·초기화)는 이미지 옆 도크로 내렸다.
 * 회전·가시성 보정은 비파괴로 미리보기하다가 저장 시점에만 픽셀로 굽는다.
 * 파일을 고르는 순간 편집 전 원본을 `POST /files/original`로 보관하고, 성공한 원본 번호만
 * 등록 요청의 `originalFileId`로 붙인다(실패하면 「원본 보관 실패 — 작업본만 저장됩니다」를 남기고 계속).
 * 저장 성공·취소 시 `onExit`로 조회 모드에 복귀한다.
 */
export function RegisterStage({ onExit }: RegisterStageProps) {
  const [formData, setFormData] = useState<CrimeFormData>(EMPTY_FORM)
  // 폼 위 오류 영역 문구 — 화면 검증 실패 또는 서버 400/409 `detail`.
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const adjust = useImageAdjustments(formData.image)
  // 안정적인 콜백(아래 메모이즈된 핸들러에서 참조됨).
  const { bake: bakeAdjustments, resetAdjustments } = adjust
  // 원본 먼저 올리기(실증 확장 설계서 §5-E): 파일을 고르는 순간 편집 전 바이트를 보관한다.
  const original = useOriginalUpload()
  const {
    start: startOriginalUpload,
    resolveFileId: resolveOriginalFileId,
    reject: rejectOriginal,
    reset: resetOriginal,
  } = original

  // 자유각 회전(슬라이더). 회전 드래그 중에도 crop/calibration 래퍼가 참조적으로
  // 안정적으로 유지되도록 ref에도 미러링한다.
  const [rotation, setRotationState] = useState(0)
  const rotationRef = useRef(0)
  const setRotation = useCallback((deg: number) => {
    rotationRef.current = deg
    setRotationState(deg)
  }, [])
  const imageRef = useRef(formData.image)
  imageRef.current = formData.image

  // 고르기 번호(원본 올리기 훅이 매김) — 화면의 이미지가 어느 고르기에서 왔는지 이미지와 함께 들고 있다가,
  // 등록 때 그 고르기의 원본 번호만 붙인다(다른 파일의 원본이 붙지 않게).
  const [imagePick, setImagePick] = useState<number | null>(null)
  // 마지막 고르기 번호 — 늦게 끝난 앞 파일의 디코드(FileReader · 줄이기) 결과를 버리는 기준. 초기화면 0.
  const latestPickRef = useRef(0)
  // 마지막으로 고른 파일이 아직 화면에 오르지 않았으면 true — 그동안 저장을 막는다.
  const [decoding, setDecoding] = useState(false)
  // 저장을 누른 뒤 등록이 끝날 때까지 true — 저장 · 파일 고르기를 잠근다(누른 순간의 값을 지키려고).
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const setSubmittingBoth = useCallback((on: boolean) => {
    submittingRef.current = on
    setSubmitting(on)
  }, [])

  const handleFieldChange = useCallback((name: keyof CrimeRegisterForm, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    // 입력을 고치면 이전 오류 문구는 더 이상 맞지 않으므로 지운다.
    setErrorMessage(null)
  }, [])

  const handleFileSelect = useCallback(async (file: File) => {
    // 저장 중에는 고르기를 받지 않는다(고르기 칸도 잠겨 있다).
    if (submittingRef.current) return
    setErrorMessage(null)
    // 줄이기 · 회전 · 보정 전의 원본을 먼저 보관한다(실패해도 등록은 계속 — 안내만 남김).
    const pick = startOriginalUpload(file)
    latestPickRef.current = pick
    setDecoding(true)
    /** 이 고르기가 아직 마지막이면 이미지와 고르기 번호를 함께 올린다. 늦게 끝난 앞 고르기는 버린다. */
    const commit = (image: string) => {
      if (pick !== latestPickRef.current) return
      setFormData((prev) => ({ ...prev, image }))
      setImagePick(pick)
      setDecoding(false)
      setErrorMessage(null)
    }
    const reader = new FileReader()
    reader.onloadend = async () => {
      if (typeof reader.result !== "string") {
        if (pick !== latestPickRef.current) return
        setDecoding(false)
        setErrorMessage("이미지를 읽지 못했습니다 — 파일을 다시 고르세요")
        return
      }
      const base64 = reader.result
      try {
        commit(await resizeImage(base64))
      } catch (error) {
        console.error("이미지 처리 중 오류 발생:", error)
        commit(base64)
      }
    }
    reader.readAsDataURL(file)
  }, [startOriginalUpload])

  const handleRotate = useCallback(
    async (deg: number) => {
      if (!formData.image) return
      const rotated = await rotateImage(formData.image, deg)
      setFormData((prev) => ({ ...prev, image: rotated }))
    },
    [formData.image]
  )

  // 초기화(취소): 작성 중이던 상태를 비우고 조회 모드(목록)로 복귀한다.
  /** 이미지 · 고르기 · 원본 상태를 비운다(초기화 · 등록 성공 공통). 진행 중인 디코드 결과도 버린다. */
  const clearPicks = useCallback(() => {
    latestPickRef.current = 0
    setImagePick(null)
    setDecoding(false)
    resetOriginal()
  }, [resetOriginal])

  const handleReset = useCallback(() => {
    setFormData(EMPTY_FORM)
    setErrorMessage(null)
    resetAdjustments()
    clearPicks()
    setRotation(0)
    onExit()
  }, [resetAdjustments, clearPicks, setRotation, onExit])

  const handleImageChange = useCallback((next: string) => {
    setFormData((prev) => ({ ...prev, image: next }))
  }, [])

  const editor = useImageEditor(formData.image, handleImageChange)
  const { toggleCrop, toggleCalibration, toggleMeasure } = editor

  // 자유각 회전은 CSS transform으로 미리보기되며, 저장 시점에만 — 또는
  // crop/calibration에 진입할 때 즉시 — 픽셀에 구워져서, 오버레이는 항상
  // 회전되지 않은 픽셀을 기준으로 매핑된다.
  const commitRotation = useCallback(async () => {
    const deg = rotationRef.current
    const img = imageRef.current
    if (deg === 0 || !img) return
    const rotated = await rotateArbitrary(img, deg)
    setFormData((prev) => ({ ...prev, image: rotated }))
    setRotation(0)
  }, [setRotation])

  const handleCrop = useCallback(async () => {
    await commitRotation()
    toggleCrop()
  }, [commitRotation, toggleCrop])

  const handleCalibrate = useCallback(async () => {
    await commitRotation()
    toggleCalibration()
  }, [commitRotation, toggleCalibration])

  const handleMeasure = useCallback(async () => {
    await commitRotation()
    toggleMeasure()
  }, [commitRotation, toggleMeasure])

  const registerMutation = useMutation({
    mutationFn: registerCrime,
    // 실패 문구는 폼 위 오류 영역에만 남긴다(전역 실패 토스트 끔 — 같은 문구가 두 번 뜨지 않게).
    meta: { success: "사건이 등록되었습니다.", inlineError: true },
    onSuccess: () => {
      setFormData(EMPTY_FORM)
      setErrorMessage(null)
      resetAdjustments()
      clearPicks()
      setRotation(0)
      // 사건 목록 새로고침은 사건 조회 권한이 있을 때만(없으면 목록 API가 403) + 등록 후 조회 모드로 복귀.
      if (hasFeature(useSessionStore.getState().user, FEATURES.CRIME_SEARCH)) {
        void useCrimeStore.getState().refetch()
      }
      onExit()
    },
    // 서버 검증 실패(400)·범위 밖(403 「다른 관서의 의뢰입니다」·「소속 관서가 지정되지 않아 등록할 수
    // 없습니다」)·중복/SCAS 과거 사건(409)의 한국어 `detail`을 폼 위에 그대로 보인다(사용자가 고칠 위치 옆).
    onError: (error, variables) => {
      setErrorMessage(
        error instanceof ApiError
          ? (error.detail ?? error.message)
          : "사건 등록에 실패했습니다"
      )
      // 붙인 원본 번호를 서버가 거절(400)했으면 원본 실패 안내로 바꾸고, 다시 저장은 원본 없이 보낸다.
      const rejected = originalRejectDetail(error)
      if (rejected !== null && variables.originalFileId !== undefined) {
        rejectOriginal(variables.originalFileId, rejected)
      }
    },
  })

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current) return
    // 마지막으로 고른 파일이 아직 화면에 오르지 않았으면 막는다(화면의 이미지와 원본이 어긋나지 않게).
    if (decoding) {
      setErrorMessage("이미지를 불러오는 중입니다 — 화면에 이미지가 오른 뒤 저장하세요")
      return
    }
    if (!formData.image) {
      setErrorMessage("현장 이미지를 등록하세요")
      return
    }
    const invalid = validateCrimeRegister(formData)
    if (invalid) {
      setErrorMessage(invalid)
      return
    }
    setErrorMessage(null)
    // 누른 순간의 값을 붙잡는다 — 이미지와 그 이미지를 고른 번호는 같은 렌더의 짝이다.
    const form = formData
    const sourceImage = formData.image
    const pick = imagePick
    setSubmittingBoth(true)
    let originalFileId: number | null
    let image: string
    try {
      // 분석관의 보정이 미리보기에만 그치지 않고 서버 측에도 유지되도록, 자유각
      // 회전을 먼저 굽고 이어서 비파괴 가시성 조정값을 이미지에 굽는다.
      const rotated =
        rotationRef.current !== 0 ? await rotateArbitrary(sourceImage, rotationRef.current) : sourceImage
      image = await bakeAdjustments(rotated)
      // 그 고르기의 원본이 아직 올라가는 중이면 끝날 때까지 기다린다. 성공한 번호만 붙인다(실패면 작업본만).
      originalFileId = pick === null ? null : await resolveOriginalFileId(pick)
    } catch (error) {
      console.error("등록 이미지 준비 중 오류:", error)
      setSubmittingBoth(false)
      setErrorMessage("이미지를 저장용으로 만들지 못했습니다 — 다시 저장하세요")
      return
    }
    // 감정물 순번(aprthngSn)은 화면 전용 — 서버에는 조합된 감정물 번호만 보낸다.
    registerMutation.mutate(
      {
        image,
        aprthngNo: buildAprthngNo(form.apprslReqestNo, form.aprthngSn),
        apprslReqestNo: form.apprslReqestNo,
        pickDt: form.pickDt,
        pickPlace: form.pickPlace,
        pickMthCode: form.pickMthCode,
        crimeNm: form.crimeNm,
        rqestGrfcNm: form.rqestGrfcNm,
        ...(originalFileId !== null && { originalFileId }),
      },
      { onSettled: () => setSubmittingBoth(false) }
    )
  }, [
    decoding,
    formData,
    imagePick,
    registerMutation,
    bakeAdjustments,
    resolveOriginalFileId,
    setSubmittingBoth,
  ])

  // 원본 보관 안내 — 올리는 중 / 실패(마지막으로 고른 파일 기준).
  const originalStatus =
    original.state.status === "uploading"
      ? ({ kind: "uploading" } as const)
      : original.state.status === "failed"
        ? ({ kind: "failed", detail: original.state.detail } as const)
        : null

  // 앱셸 헤더 제목은 페이지(`CrimeSearchPage`)가 모드에 따라 게시한다 —
  // 이 위젯은 편집 스테이지만 렌더한다.
  return (
    <div className="relative h-[calc(100vh-110px)] w-full overflow-hidden bg-background px-6 py-6">
      <DotGrid />
      <GlowOrb className="-top-24 right-1/4 h-72 w-72 bg-[#2563EB]/10" />
      <GlowOrb className="bottom-0 left-1/3 h-64 w-64 bg-[#4A9EFF]/8" />

      <div className="relative grid h-full grid-cols-1 gap-6 lg:grid-cols-[1.82fr_1fr]">
        <EvidenceImagePanel
          image={formData.image}
          onFileSelect={handleFileSelect}
          onRotate={handleRotate}
          editor={editor}
          adjust={adjust}
          rotation={rotation}
          onRotationChange={setRotation}
          onCrop={handleCrop}
          onCalibrate={handleCalibrate}
          onMeasure={handleMeasure}
          onReset={handleReset}
          pickerDisabled={submitting}
        />
        <CaseInfoPanel
          formData={formData}
          onFieldChange={handleFieldChange}
          onSubmit={handleSubmit}
          onReset={handleReset}
          isSubmitting={submitting || registerMutation.isPending}
          errorMessage={errorMessage}
          originalStatus={originalStatus}
        />
      </div>
    </div>
  )
}
