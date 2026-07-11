import { Navigate, useParams } from "react-router-dom"

import { searchDetailPath } from "../model/search-paths"

/**
 * 패턴추출 화면은 통합 커맨드센터(`CrimeDetailPage`, `/search/:crimeNumber`)로 흡수됐다.
 * 기존 `/search/:crimeNumber/patternExtract` 경로(북마크·`ShoesResultPage`의 [문양추출]
 * 버튼)는 detail URL로 리다이렉트해 하위 호환을 유지한다.
 */
export function PatternExtractPage() {
  const { crimeNumber = "" } = useParams()
  return <Navigate to={searchDetailPath(crimeNumber)} replace />
}
