import { useCallback, useRef, useState } from "react"
import { useMutation } from "@tanstack/react-query"

import { registerCrime, useCrimeStore } from "@/entities/crime"
import { FEATURES } from "@/entities/session"
import { hasFeature, useSessionStore } from "@/features/auth"
import { rotateArbitrary, useImageAdjustments, useImageEditor } from "@/features/crime-register"
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
 * 저장 성공·취소 시 `onExit`로 조회 모드에 복귀한다.
 */
export function RegisterStage({ onExit }: RegisterStageProps) {
  const [formData, setFormData] = useState<CrimeFormData>(EMPTY_FORM)
  // 폼 위 오류 영역 문구 — 화면 검증 실패 또는 서버 400/409 `detail`.
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const adjust = useImageAdjustments(formData.image)
  // 안정적인 콜백(아래 메모이즈된 핸들러에서 참조됨).
  const { bake: bakeAdjustments, resetAdjustments } = adjust

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

  const handleFieldChange = useCallback((name: keyof CrimeRegisterForm, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    // 입력을 고치면 이전 오류 문구는 더 이상 맞지 않으므로 지운다.
    setErrorMessage(null)
  }, [])

  const handleFileSelect = useCallback(async (file: File) => {
    setErrorMessage(null)
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64 = reader.result as string
      try {
        const processed = await resizeImage(base64)
        setFormData((prev) => ({ ...prev, image: processed }))
      } catch (error) {
        console.error("이미지 처리 중 오류 발생:", error)
        setFormData((prev) => ({ ...prev, image: base64 }))
      }
    }
    reader.readAsDataURL(file)
  }, [])

  const handleRotate = useCallback(
    async (deg: number) => {
      if (!formData.image) return
      const rotated = await rotateImage(formData.image, deg)
      setFormData((prev) => ({ ...prev, image: rotated }))
    },
    [formData.image]
  )

  // 초기화(취소): 작성 중이던 상태를 비우고 조회 모드(목록)로 복귀한다.
  const handleReset = useCallback(() => {
    setFormData(EMPTY_FORM)
    setErrorMessage(null)
    resetAdjustments()
    setRotation(0)
    onExit()
  }, [resetAdjustments, setRotation, onExit])

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
    meta: { success: "사건이 등록되었습니다." },
    onSuccess: () => {
      setFormData(EMPTY_FORM)
      setErrorMessage(null)
      resetAdjustments()
      setRotation(0)
      // 사건 목록 새로고침은 사건 조회 권한이 있을 때만(없으면 목록 API가 403) + 등록 후 조회 모드로 복귀.
      if (hasFeature(useSessionStore.getState().user, FEATURES.CRIME_SEARCH)) {
        void useCrimeStore.getState().refetch()
      }
      onExit()
    },
    // 서버 검증 실패(400)·중복(409)의 한국어 `detail`을 폼 위에 그대로 보인다
    // (전역 MutationCache 토스트와 별개로, 사용자가 고칠 위치 옆에 남겨 둔다).
    onError: (error) => {
      setErrorMessage(
        error instanceof ApiError
          ? (error.detail ?? error.message)
          : "사건 등록에 실패했습니다"
      )
    },
  })

  const handleSubmit = useCallback(async () => {
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
    // 분석관의 보정이 미리보기에만 그치지 않고 서버 측에도 유지되도록, 자유각
    // 회전을 먼저 굽고 이어서 비파괴 가시성 조정값을 이미지에 굽는다.
    const rotated =
      rotationRef.current !== 0
        ? await rotateArbitrary(formData.image, rotationRef.current)
        : formData.image
    const image = await bakeAdjustments(rotated)
    // 감정물 순번(aprthngSn)은 화면 전용 — 서버에는 조합된 감정물 번호만 보낸다.
    registerMutation.mutate({
      image,
      aprthngNo: buildAprthngNo(formData.apprslReqestNo, formData.aprthngSn),
      apprslReqestNo: formData.apprslReqestNo,
      pickDt: formData.pickDt,
      pickPlace: formData.pickPlace,
      pickMthCode: formData.pickMthCode,
      crimeNm: formData.crimeNm,
      rqestGrfcNm: formData.rqestGrfcNm,
    })
  }, [formData, registerMutation, bakeAdjustments])

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
        />
        <CaseInfoPanel
          formData={formData}
          onFieldChange={handleFieldChange}
          onSubmit={handleSubmit}
          onReset={handleReset}
          isSubmitting={registerMutation.isPending}
          errorMessage={errorMessage}
        />
      </div>
    </div>
  )
}
