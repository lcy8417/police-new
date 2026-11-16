import { DEV_CASES, DevScreenFrame } from "../frame"

// S00 로그인 진열 페이지(자리). 화면 트랙이 위젯으로 채운다.
export function S00DevPage() {
  return (
    <DevScreenFrame screen="S00" title="로그인" cases={DEV_CASES} bare>
      <p className="text-[12.5px] text-muted-foreground">준비 중</p>
    </DevScreenFrame>
  )
}
