import { DEV_CASES, DevScreenFrame } from "../frame"

// S04 문양 코드 진열 페이지(자리). 화면 트랙이 위젯으로 채운다.
export function S04DevPage() {
  return (
    <DevScreenFrame screen="S04" title="문양 코드" cases={DEV_CASES}>
      <p className="text-[12.5px] text-muted-foreground">준비 중</p>
    </DevScreenFrame>
  )
}
