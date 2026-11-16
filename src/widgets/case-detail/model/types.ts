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
  /**
   * 지금 앱에 동작이 없는 SCAS 칸(문서번호 · 피해자 성명 · 제조사 …)에 보일 값. 키 = 라벨.
   * 이 칸들은 「준비 중」으로 잠긴 채 값만 보인다(spec §5-2 규칙 3 · 판정 R10).
   */
  pendingValues?: Readonly<Record<string, string>>
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
  onCopy: () => void
  /** 족윤적 이미지 → 이미지 커팅(S03) */
  onOpenImageEdit: (imageId: string) => void
  /** 「검색 (문양 상세보기) →」(S04) */
  onOpenSearch: () => void
  /** (+α) 신규 기능 숨김 — 기본 true. false 면 `data-plus` 요소가 하나도 없다 */
  showPlus?: boolean
  /** (+α) 시안 r3 의 값(단계 띠 · 접수 경로 · AI 점검 …). 없으면 +α 칸을 그리지 않는다 */
  plus?: CaseDetailPlus
  /** 아직 기능이 없는 버튼(이전 · 다음 · 수정 · _5 삭제 · 반전 적용)을 눌렀을 때 — 이름을 넘긴다(시안 — 기능 준비 중) */
  onMockAction?: (label: string) => void
}

/** AI 1차 작업 점검 카드의 한 줄 */
export interface CaseDetailAiCheckItem {
  tone: "ok" | "warn" | "bad"
  /** 줄 글자 앞부분 `같은 사진 의심` */
  text: string
  /** 진하게 보이는 이미지 번호 `_4 ↔ _5` */
  refs?: string
  /** 흐린 두 번째 줄 */
  detail?: string
  /** 오른쪽 덧붙임: 버튼은 감정관이 눌러야 반영 / 칩은 안내 글자 */
  action?: { kind: "button" | "chip-warn" | "chip"; label: string }
}

export interface CaseDetailPlus {
  /** 단계 띠 지금 칸(0부터: 접수 · 1차 작업 · 검색·판정 · 교차 검증 · 감정서 · 결재) */
  stage: number
  /** 접수 경로 줄 */
  source: { label: string; note: string; analyst: string; assignment: string }
  /** 필수 칸 채움 */
  required: { done: number; total: number; remaining: string }
  /** 족윤적 이미지 위 AI 표시 */
  overlay: { areaPercent: number; rulerText: string }
  /** 전사판이라 좌우반전이 필요하다는 안내 칩 */
  flipNote: string
  /** 같은 사진으로 의심되는 장: 파일 끝 번호 `_5` → 짝 `_4` */
  duplicates: Readonly<Record<string, string>>
  /** AI 1차 작업 점검 카드 */
  aiCheck: { imageCount: number; seconds: number; items: readonly CaseDetailAiCheckItem[] }
  /** 채취 방법이 「기타」일 때 AI 제안 */
  methodSuggestion: { value: string; reason: string }
}
