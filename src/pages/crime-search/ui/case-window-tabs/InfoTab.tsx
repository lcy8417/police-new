import * as React from "react"

import type { Crime } from "@/entities/crime"
import { FEATURES, FEATURE_ORDER, type FeatureCode } from "@/entities/session"
import { CaseDetailScreen, type CaseImage } from "@/widgets/case-detail"

import { caseFormOf } from "./model/tab-values"
import type { TabViewer } from "./model/use-viewer"

const noop = () => undefined
const NO_IDS: string[] = []

export interface InfoTabProps {
  viewer: TabViewer
  /** 사건의 이미지(감정물) 전부 */
  images: readonly Crime[]
  /** 고른 이미지 */
  image: Crime
  onSelectImage: (aprthngNo: string) => void
  onOpenImageEdit: (aprthngNo: string) => void
  onOpenPattern: () => void
}

/**
 * 「사건 정보」 탭 — 사건 · 현장 이미지 정보를 실제 감정물 레코드(`GET /crime/` 목록 = `useCrimeStore`)로 보인다.
 * 사건 정보를 고치는 API(A3)가 아직 없으므로 **보기 전용**: 위젯 편집 권한(`CRIME_REGISTER`)을 빼고 넘겨 저장 줄 · 수정을 숨긴다.
 */
export function InfoTab({ viewer, images, image, onSelectImage, onOpenImageEdit, onOpenPattern }: InfoTabProps) {
  // 관리자는 위젯이 모든 권한을 주므로, 관리자 여부를 끄고 실효 권한 목록에서 사건 등록(수정)만 뺀다
  const features = React.useMemo<readonly FeatureCode[]>(
    () => (viewer.isAdmin ? FEATURE_ORDER : viewer.features).filter((f) => f !== FEATURES.CRIME_REGISTER),
    [viewer]
  )
  const caseImages = React.useMemo<CaseImage[]>(
    () =>
      images.map((c) => ({
        id: c.aprthngNo ?? "",
        fileName: c.aprthngNo ?? "",
        // 파일 크기는 지금 API 가 주지 않는다
        sizeBytes: 0,
        src: c.image ?? "",
      })),
    [images]
  )
  const form = React.useMemo(() => caseFormOf(image), [image])

  return (
    <CaseDetailScreen
      status="ready"
      onRetry={noop}
      isAdmin={false}
      features={features}
      mode="detail"
      aprthngNo={image.apprslReqestNo ?? image.aprthngNo}
      form={form}
      onFieldChange={noop}
      officeItems={[]}
      images={caseImages}
      selectedImageId={image.aprthngNo ?? null}
      onSelectImage={onSelectImage}
      checkedImageIds={NO_IDS}
      onCheckedImageIdsChange={noop}
      onFilesAdded={noop}
      onDeleteChecked={noop}
      continuous={false}
      onContinuousChange={noop}
      onSave={noop}
      onReset={noop}
      onClose={noop}
      onCopy={noop}
      onOpenImageEdit={onOpenImageEdit}
      onOpenSearch={onOpenPattern}
      showPlus={false}
      inWindow
    />
  )
}
