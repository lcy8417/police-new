import * as React from "react"

/** 그림 자연 크기(px) — 대응점 좌표계 크기. 아직 못 읽었거나 실패하면 null */
export function useNaturalSize(src: string | null | undefined): { width: number; height: number } | null {
  const [size, setSize] = React.useState<{ src: string; width: number; height: number } | null>(null)
  React.useEffect(() => {
    if (!src) return
    let alive = true
    const img = new Image()
    img.onload = () => {
      if (alive && img.naturalWidth > 0) setSize({ src, width: img.naturalWidth, height: img.naturalHeight })
    }
    img.src = src
    return () => {
      alive = false
    }
  }, [src])
  return size && size.src === src ? { width: size.width, height: size.height } : null
}
