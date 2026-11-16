import type { CaseDetailForm, CaseImage } from "@/widgets/case-detail"

import { fakePhotoUrl } from "../mock-assets/FakePhoto"

// S02 가짜 데이터(시안 s02-case-detail.js 예시값, 이름은 가림).
export const EMPTY_FORM: CaseDetailForm = {
  apprslReqestNo: "",
  aprthngSn: "1",
  rqestGrfcNm: "",
  crimeNm: "",
  pickDt: "",
  pickPlace: "",
  pickMthCode: "",
}

export const DETAIL_FORM: CaseDetailForm = {
  apprslReqestNo: "00001-25-0649",
  aprthngSn: "2",
  rqestGrfcNm: "대구청 › 동부서",
  crimeNm: "주거침입",
  pickDt: "2025-07-23 08:40",
  pickPlace: "거실 바닥",
  pickMthCode: "기타",
}

export const OFFICE_ITEMS = [
  "대구청 › 동부서",
  "대구청 › 수성서",
  "대구청 › 서부서",
  "경북청 › 포항남부서",
  "부산청 › 해운대서",
  "서울청 › 강서서",
  "경기남부청 › 화성동탄서",
  "인천청 › 미추홀서",
].map((label) => ({ value: label, label }))

// 시안 목록의 파일크기(KB)
const KB = [5762, 6829, 5001, 4763, 4763, 5871, 5402, 4926, 5120, 4877, 5530, 5310]

/** 일부러 글자 순서(_1 _10 _11 _12 _2 …)로 섞어 둔다 — 화면이 숫자 순서로 정렬하는지 보이게 */
export function makeImages(caseNo: string): CaseImage[] {
  const nums = Array.from({ length: 12 }, (_, i) => i + 1).sort((a, b) => String(a).localeCompare(String(b)))
  return nums.map((n) => ({
    id: `${caseNo}_${n}`,
    fileName: `${caseNo}_${n}.jpg`,
    sizeBytes: KB[n - 1] * 1024,
    src: fakePhotoUrl({ seed: n, tag: String(n), rotate: -4 + (n % 5) }),
  }))
}
