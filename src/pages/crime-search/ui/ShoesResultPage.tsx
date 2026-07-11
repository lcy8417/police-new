import { Navigate, useParams } from "react-router-dom"

import { searchDetailPath } from "../model/search-paths"

/**
 * 레거시 리다이렉트 스텁. 검색 결과는 이제 통합 커맨드센터(`CrimeDetailPage`,
 * `/search/:crimeNumber`)의 검색모드에 인라인으로 표시된다 — 별도의 결과
 * 페이지 이동은 없다. `App.jsx`는 `/search/:crimeNumber/shoesResult` 경로를
 * 자체 래퍼로 리다이렉트하므로 이 컴포넌트는 라우트에 배선되지 않지만,
 * 다른 곳에서 직접 import될 경우를 대비해 `index.ts` export와 동일한
 * 리다이렉트 동작을 유지한다.
 */
export function ShoesResultPage() {
  const { crimeNumber = "" } = useParams()
  return <Navigate to={searchDetailPath(crimeNumber)} replace />
}
