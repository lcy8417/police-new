import { DEV_CASES, DevScreenFrame } from "../frame"

// S07 결과 확인 진열 페이지(자리). 화면 트랙이 위젯으로 채운다.
export function S07DevPage() {
  return (
    <DevScreenFrame screen="S07" title="결과 확인" cases={DEV_CASES}>
      <p className="text-[12.5px] text-muted-foreground">준비 중</p>
    </DevScreenFrame>
  )
}
