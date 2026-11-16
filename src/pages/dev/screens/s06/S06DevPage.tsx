import { DEV_CASES, DevScreenFrame } from "../frame"

// S06 정밀 대조 진열 페이지(자리). 화면 트랙이 위젯으로 채운다.
export function S06DevPage() {
  return (
    <DevScreenFrame screen="S06" title="정밀 대조" cases={DEV_CASES}>
      <p className="text-[12.5px] text-muted-foreground">준비 중</p>
    </DevScreenFrame>
  )
}
