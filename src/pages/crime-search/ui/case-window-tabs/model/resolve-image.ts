import type { Crime } from "@/entities/crime"

// 사건 창이 넘기는 번호(사건 = 감정의뢰번호 · 이미지 = 감정물 번호 또는 그 뒤 순번)를 store 의 감정물 레코드로 푼다.
// 실제 데이터는 감정물(이미지 한 장) 단위 목록이라, 사건 하나 = 같은 감정의뢰번호(apprslReqestNo)를 가진 감정물들이다.

/**
 * 사건의 이미지(감정물) 목록 — 감정번호 순서.
 * caseNo 가 감정의뢰번호면 그 묶음, 감정물 번호 하나면 그 감정물의 의뢰 묶음(의뢰번호가 없으면 그 한 장).
 */
export function caseImagesOf(crimeData: readonly Crime[], caseNo: string): Crime[] {
  if (!caseNo) return []
  const group = crimeData.filter((c) => c.apprslReqestNo === caseNo)
  if (group.length > 0) return sortByImageNo(group)
  const self = crimeData.find((c) => c.aprthngNo === caseNo)
  if (!self) return []
  const req = self.apprslReqestNo
  return req ? sortByImageNo(crimeData.filter((c) => c.apprslReqestNo === req)) : [self]
}

/**
 * 고른 이미지 — imageNo 는 감정물 번호 전체(`05019-24-0017_5`) 또는 뒤 순번(`5`) 둘 다 받는다.
 * 없으면 caseNo 와 같은 감정물, 그것도 없으면 첫 장.
 */
export function pickImage(images: readonly Crime[], caseNo: string, imageNo: string | null): Crime | null {
  if (imageNo) {
    const hit =
      images.find((c) => c.aprthngNo === imageNo) ??
      images.find((c) => c.aprthngNo === `${caseNo}_${imageNo}`) ??
      images.find((c) => imageSeqOf(c.aprthngNo ?? "") === imageNo)
    if (hit) return hit
  }
  return images.find((c) => c.aprthngNo === caseNo) ?? images[0] ?? null
}

/** 감정물 번호 끝 순번(`…_5` → `5`). 밑줄이 없으면 빈 글자 */
export function imageSeqOf(aprthngNo: string): string {
  const at = aprthngNo.lastIndexOf("_")
  return at < 0 ? "" : aprthngNo.slice(at + 1)
}

/** 순번이 숫자면 숫자 순서, 아니면 글자 순서(앞자리 0 보존 — 표시 값은 바꾸지 않는다) */
function sortByImageNo(list: Crime[]): Crime[] {
  return [...list].sort((a, b) => {
    const sa = imageSeqOf(a.aprthngNo ?? "")
    const sb = imageSeqOf(b.aprthngNo ?? "")
    const na = Number(sa)
    const nb = Number(sb)
    if (sa !== "" && sb !== "" && Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb
    return (a.aprthngNo ?? "").localeCompare(b.aprthngNo ?? "")
  })
}
