import { useNavigate, useSearchParams } from "react-router-dom"

/**
 * 진열 화면 사이를 옮기는 함수 모양 — `go("/dev/s04", { id })`.
 * 진열 페이지는 주소를 옮기고, 사건 창(S01) 안의 내용 컴포넌트는 같은 호출을 창 탭 바꾸기로 받는다.
 */
export type DevGo = (path: string, extra?: Record<string, string>) => void

/** 진열 화면 사이를 옮기는 함수. 지금 보는 사람(`?as=`)과 신규 기능 끄기(`?plus=0`)를 유지하고 `extra` 쿼리를 붙인다. */
export function useDevNavigate(): DevGo {
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
