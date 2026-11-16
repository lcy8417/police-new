import type { FeatureCode } from "@/entities/session"
import type { ScreenStatus } from "@/shared/lib/screen-status"
import type { ComboboxItem } from "@/shared/ui/kit"

// 출처: 지금 앱 사건 등록 폼 `CrimeRegisterForm`(widgets/crime-register-stage/model/form.ts) 7칸과 같은 값.
// 매뉴얼 이름과 맞춰 화면 라벨은 사건등록번호(apprslReqestNo) · 이미지 번호(aprthngSn) · 의뢰관서 · 사건 이름 · 채취 일시 · 채취 장소 · 발견 방법(pickMthCode).
export interface CaseDetailForm {
  /** 사건등록번호(= 감정의뢰번호, 필수) */
  apprslReqestNo: string
  /** 이미지 번호(= 감정물 순번, 문자열 — 앞자리 0 보존) */
  aprthngSn: string
  /** 의뢰관서 이름 */
  rqestGrfcNm: string
  /** 사건 이름 */
  crimeNm: string
  /** 채취 일시 `YYYY-MM-DD HH:mm` */
  pickDt: string
  pickPlace: string
  /** 발견(채취) 방법 코드 */
  pickMthCode: string
}

export type CaseDetailFieldName = keyof CaseDetailForm

/** 이미지 목록 한 줄 — 파일명 끝의 `_숫자` 순서로 보인다 */
export interface CaseImage {
  id: string
  /** 파일명칭 예 `00001-25-0649_2.jpg` */
  fileName: string
  /** 파일크기(바이트) */
  sizeBytes: number
  /** 미리보기 그림 주소 */
  src: string
}

export interface CaseDetailScreenProps {
  /** S02 에는 「결과 없음」이 없다 — loading · error · ready */
  status: Exclude<ScreenStatus, "empty">
  errorAt?: string
  onRetry: () => void
  isAdmin: boolean
  features: readonly FeatureCode[]
  /** detail = 열어 본 사건(이전 · 다음 · 사건복사), register = 새로 등록 */
  mode: "detail" | "register"
  /** 제목 옆에 보이는 감정번호(detail) */
  aprthngNo?: string
  form: CaseDetailForm
  onFieldChange: (name: CaseDetailFieldName, value: string) => void
  /** 의뢰관서 검색 후보(관서 조회는 쓰는 쪽이 조립) */
  officeItems: ComboboxItem[]
  images: readonly CaseImage[]
  selectedImageId: string | null
  onSelectImage: (id: string) => void
  /** 삭제 대상으로 체크한 이미지 */
  checkedImageIds: readonly string[]
  onCheckedImageIdsChange: (ids: string[]) => void
  /** 추가 · 끌어 놓기로 고른 파일 */
  onFilesAdded: (files: File[]) => void
  onDeleteChecked: () => void
  /** 올리는 중인 파일(없으면 생략) */
  uploading?: { fileName: string; percent: number }
  /** 폼 위 오류 문구(검증 실패 · 서버 거절 문구 그대로) */
  errorMessage?: string | null
  saving?: boolean
  /** 저장 뒤 다음 사건 연속 등록(register 에서만) */
  continuous: boolean
  onContinuousChange: (next: boolean) => void
  onSave: () => void
  onReset: () => void
  onClose: () => void
  /** 없으면 「이전」 · 「다음」 이 잠긴다 */
  onPrev?: () => void
  onNext?: () => void
  onCopy: () => void
  /** 족윤적 이미지 → 이미지 커팅(S03) */
  onOpenImageEdit: (imageId: string) => void
  /** 「검색 (문양 상세보기) →」(S04) */
  onOpenSearch: () => void
}
