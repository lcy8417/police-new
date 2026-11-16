import { DEV_CASES, DevScreenFrame } from "../frame"

// S01 사건관리 진열 페이지(자리). 화면 트랙이 위젯으로 채운다.
export function S01DevPage() {
  return (
    <DevScreenFrame screen="S01" title="사건관리" cases={DEV_CASES}>
      <p className="text-[12.5px] text-muted-foreground">준비 중</p>
    </DevScreenFrame>
  )
}
