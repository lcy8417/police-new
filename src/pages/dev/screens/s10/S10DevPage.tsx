import { DEV_CASES, DevScreenFrame } from "../frame"

// S10 신발 DB 진열 페이지(자리). 화면 트랙이 위젯으로 채운다.
export function S10DevPage() {
  return (
    <DevScreenFrame screen="S10" title="신발 DB" cases={DEV_CASES}>
      <p className="text-[12.5px] text-muted-foreground">준비 중</p>
    </DevScreenFrame>
  )
}
