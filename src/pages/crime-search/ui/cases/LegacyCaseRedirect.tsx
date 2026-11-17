import { useQuery } from "@tanstack/react-query"
import { Navigate, useParams } from "react-router-dom"

import { fetchRequestList } from "@/entities/request"
import { ListNote } from "@/shared/ui/kit"

import type { CaseWindowTab } from "@/widgets/case-window"

export interface LegacyCaseRedirectProps {
  /** 열 탭 — 옛 통합 화면 = 문양 코드, 옛 편집 = 이미지 편집 */
  tab: CaseWindowTab
}

/**
 * 옛 주소(`/search/:aprthngNo` · `/edit/:aprthngNo` …) → 새 사건관리 사건 창(화면 이식 계획 §1 표 — 묶음 ③ 끝 넘겨주기).
 * 감정물 번호로 A1 `aprthng=`(그 감정물의 의뢰 1행)을 불러 감정번호를 얻는다 — 끝 `_n`을 잘라 짐작하지 않는다
 * (`_`가 든 번호 · SCAS 감정물 번호에서 깨짐). 못 찾으면 `/cases`(목록)로.
 */
export function LegacyCaseRedirect({ tab }: LegacyCaseRedirectProps) {
  const { aprthngNo = "" } = useParams()
  const query = useQuery({
    queryKey: ["request", "by-aprthng", aprthngNo],
    queryFn: () => fetchRequestList({ aprthng: aprthngNo }),
    enabled: aprthngNo !== "",
    retry: false,
  })
  if (aprthngNo === "") return <Navigate to="/cases" replace />
  if (query.isPending) {
    return (
      <ListNote role="status" className="text-center">
        사건을 찾는 중…
      </ListNote>
    )
  }
  const no = query.data?.items[0]?.apprslReqestNo
  if (!no) return <Navigate to="/cases" replace />
  const params = new URLSearchParams({ open: no, img: aprthngNo, tab, tabs: no })
  return <Navigate to={`/cases?${params.toString()}`} replace />
}
