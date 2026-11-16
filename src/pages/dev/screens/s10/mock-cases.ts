import type { Shoe } from "@/entities/shoe"
import type { ShoeDbFilters, ShoeOfficeItem } from "@/widgets/shoe-db"

import type { ZoneTriple } from "../mock-assets/fake-art"
import { fakeSoleUrl } from "../mock-assets/FakeSole"

// S10 가짜 값. 신발 ID 는 문자열(앞자리 0 보존), 긴 값 1건 포함(가로 넘침 점검).
export const S10_CASES = ["ready", "loading", "error", "empty", "duplicate"] as const
export type S10Case = (typeof S10_CASES)[number]

export const S10_PAGE_SIZE = 16
export const S10_TOTAL = 536

export const S10_OFFICES: ShoeOfficeItem[] = [
  { value: "all", label: "전체" },
  { value: "kn", label: "경찰청 범죄분석과" },
  { value: "dg", label: "대구청 과학수사과" },
]

export const S10_EMPTY_FILTERS: ShoeDbFilters = {
  ftwrId: "",
  makrCode: "",
  sex: "all",
  regFrom: "2025-03-01",
  regTo: "2025-03-31",
  brandCode: "",
  approval: "no",
  office: null,
  groupNm: "",
  patternInput: "out",
  shoeKind: "",
  remark: "",
}

export const S10_DUPLICATE_MESSAGE = "이미 등록된 번호입니다"

const ZONES: ZoneTriple[] = [
  ["herring", "herring", "herring"],
  ["grid", "dots", "grid"],
  ["wave", "blocks", "lines"],
  ["tri", "grid", "dots"],
]

const LONG_MODEL = "에어 줌 페가수스 트레일 고어텍스 방수 경량 러닝화 남녀공용 2025 봄여름 신상 한정판 컬러웨이"

// 색 토큰을 읽어야 해서 호출 때 만든다.
export function makeS10Shoes(): Shoe[] {
  const ids = ["00758", "303352", "303351", "303349", "303348", "303347", "303346", "303344", "303342", "303341", "303340", "303339", "303338", "303337", "303336", "303335"]
  return ids.map((id, i) => ({
    ftwrId: id,
    ftwrGroupId: `G${String(i + 38).padStart(3, "0")}`,
    ftwrGroupNm: i === 0 ? "crocs(크록스)-038" : `브랜드${i}-0${i + 10}`,
    modlNm: i === 1 ? LONG_MODEL : `모델 ${100 + i}`,
    brandCode: `B00${i + 38}`,
    makrCode: i % 3 === 0 ? null : `M0${i + 10}`,
    colctPlace: i % 2 === 0 ? "신발닷컴" : "공식몰",
    colctYear: i === 0 ? "2019" : "2025",
    image: fakeSoleUrl({ kind: "shoe", zones: ZONES[i % ZONES.length] }),
    top: i % 3 === 2 ? [] : ["s21b"],
    mid: i % 3 === 1 ? ["n32_04"] : [],
    bottom: i % 3 === 2 ? [] : ["s21b"],
    outline: [],
  }))
}
