import { useNavigate, useSearchParams } from "react-router-dom"

/** 진열 화면 사이를 옮기는 함수. 지금 보는 사람(`?as=`)과 신규 기능 끄기(`?plus=0`)를 유지하고 `extra` 쿼리를 붙인다. */
export function useDevNavigate(): (path: string, extra?: Record<string, string>) => void {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const as = params.get("as")
  const plusOff = params.get("plus") === "0"
  return (path, extra = {}) => {
    const q = new URLSearchParams(extra)
    if (as) q.set("as", as)
    if (plusOff) q.set("plus", "0")
    const s = q.toString()
    navigate(s ? `${path}?${s}` : path)
  }
}
