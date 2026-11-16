import { useNavigate, useSearchParams } from "react-router-dom"

/** 진열 화면 사이를 옮기는 함수. 지금 보는 사람(`?as=`)을 유지하고 `extra` 쿼리를 붙인다. */
export function useDevNavigate(): (path: string, extra?: Record<string, string>) => void {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const as = params.get("as")
  return (path, extra = {}) => {
    const q = new URLSearchParams(extra)
    if (as) q.set("as", as)
    const s = q.toString()
    navigate(s ? `${path}?${s}` : path)
  }
}
