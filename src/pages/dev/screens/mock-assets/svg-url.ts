import type { ReactElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

/** SVG 요소를 `<img src>` 용 데이터 URL 로 바꾼다(개발 진열 전용). */
export function svgToUrl(el: ReactElement): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderToStaticMarkup(el))}`
}
