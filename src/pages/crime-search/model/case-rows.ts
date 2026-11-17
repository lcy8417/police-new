import type { RequestDetail, RequestImage, RequestListItem } from "@/entities/request"
import type { CaseListRow } from "@/widgets/case-list"
import type {
  CaseImageStatus,
  CaseWindowImage,
  CaseWindowStage,
  CaseWindowTab,
  CaseWindowTabMark,
} from "@/widgets/case-window"

// 새 사건관리 `/cases` 의 값 모양 바꾸기 — 서버 A1 행 → 목록 행, A2 상세 → 사건 창 이미지 목록 · 흐름 · 탭 표시.
// (옛 `case-groups.ts` 는 `GET /crime/` 감정물 목록을 화면이 묶었다 — A1 · A2 로 바꾸며 지움)

/** 등록 시각 KST ISO → `YYYY-MM-DD` */
export const dayOf = (iso: string | null | undefined): string => (iso ? iso.slice(0, 10) : "")

/** A1 한 행 → 목록 행. 썸네일 주소는 부르는 쪽이 루트 기준 경로를 백엔드 주소로 바꿔 넘긴다(볼 수 없으면 빈 칸) */
export function toCaseListRow(item: RequestListItem, mediaUrl: (path: string) => string): CaseListRow {
  return {
    aprthngNo: item.apprslReqestNo,
    docNo: item.docNo ?? "",
    caseName: item.crimeNm ?? "",
    requestOffice: item.rqestOrgNm ?? "",
    scasNo: item.scasCaseNo ?? "",
    processOffice: "",
    occurOffice: "",
    // 대조(용의자 신발 1:1) 구분은 서버에 아직 없다 — 모두 현장
    kind: "현장",
    shoeCount: item.imageCnt.shoe,
    tireCount: item.imageCnt.tire,
    suspect: item.suspectExstAt === "Y" ? "유" : "무",
    registeredAt: dayOf(item.frstRegistDt),
    confirmedAt: "",
    caseResult: "",
    receiver: "",
    author: "",
    results: { found: item.results.found, missed: item.results.notFound, unable: item.results.unable },
    progress: item.progress,
    thumbSrc: item.thumbUrl ? mediaUrl(item.thumbUrl) : "",
    flowStage: item.flowStage,
    crossReviewer: item.crossReviewerNm ?? undefined,
  }
}

/** 바로 찾기 · 「탭 추가」 사건 찾기 — 이미 받은 행 안에서 감정번호 · 사건명 · 의뢰관서 · SCAS · 문서번호 */
export function itemMatches(item: RequestListItem, needle: string): boolean {
  if (needle === "") return true
  return [item.apprslReqestNo, item.crimeNm, item.rqestOrgNm, item.scasCaseNo, item.docNo].some((v) =>
    (v ?? "").toLowerCase().includes(needle)
  )
}

const IMAGE_STATUSES: readonly CaseImageStatus[] = ["등록", "검색됨", "확인", "발견", "불발견", "감정불능"]

/** A2 장 상태 글자 → 창 이미지 상태(모르는 값은 「등록」) */
export function imageStatusOf(img: RequestImage): CaseImageStatus {
  return (IMAGE_STATUSES as readonly string[]).includes(img.imgSttus) ? (img.imgSttus as CaseImageStatus) : "등록"
}

/** A2 이미지 → 사건 창 왼쪽 목록(주소 `img` = 이미지 번호) */
export function toWindowImages(detail: RequestDetail, mediaUrl: (path: string) => string): CaseWindowImage[] {
  return detail.images.map((img) => ({
    no: String(img.no),
    imageNo: img.aprthngNo,
    kind: img.kind === "tire" ? "타이어" : "신발",
    status: imageStatusOf(img),
    thumbSrc: img.thumbUrl ? mediaUrl(img.thumbUrl) : undefined,
  }))
}

/** 주소 `img`(이미지 번호) 또는 감정물 번호 전체 → 그 장(없으면 첫 장) */
export function pickDetailImage(detail: RequestDetail, img: string | null): RequestImage | null {
  if (img) {
    const hit = detail.images.find((i) => String(i.no) === img || i.aprthngNo === img)
    if (hit) return hit
  }
  return detail.images[0] ?? null
}

/** A2 흐름 5칸 → 창 머리 흐름(과거 사건은 없음) */
export function toWindowStages(detail: RequestDetail): CaseWindowStage[] | undefined {
  return detail.flow ?? undefined
}

/** 흐름 단계 이름(목록 알약과 같은 말) — 과거 사건은 「과거 사건」 */
export function stageLabelOf(flowStage: RequestDetail["flowStage"]): string {
  if (flowStage === null) return "과거 사건"
  return ["접수 대기", "1차 작업", "검색·판정", "교차 검증", "감정서", "완료"][flowStage]
}

const JUDGED: ReadonlySet<CaseImageStatus> = new Set(["확인", "발견", "불발견", "감정불능"])

/** 탭 이름 뒤 표시 — 사건 정보 = 서버 빈 칸 수, 결과 확인 = 판정 안 한 장 수(교차 검증부터 ✓), 그 밖 = 고른 장 상태 */
export function windowTabMarks(
  detail: RequestDetail,
  images: readonly CaseWindowImage[],
  selected: string | null
): Partial<Record<CaseWindowTab, CaseWindowTabMark>> {
  const marks: Partial<Record<CaseWindowTab, CaseWindowTabMark>> = {
    info: detail.infoBlanks > 0 ? { kind: "blanks", count: detail.infoBlanks } : { kind: "done" },
  }
  const img = images.find((i) => i.no === selected)
  if (img) {
    if (img.status !== "등록") marks.pattern = { kind: "done" }
    if (JUDGED.has(img.status)) marks.search = { kind: "done" }
    if (img.status === "발견") marks.compare = { kind: "done" }
    else if (img.status === "불발견" || img.status === "감정불능") marks.compare = { kind: "notApplicable" }
  }
  const stage = detail.flowStage ?? 0
  marks.confirm =
    stage >= 3 ? { kind: "done" } : { kind: "count", count: images.filter((i) => !JUDGED.has(i.status)).length }
  return marks
}
