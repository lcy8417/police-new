import { DEV_CASES, DevScreenFrame } from "../frame"

// S13 사용자 관리 진열 페이지(자리). 화면 트랙이 위젯으로 채운다.
export function S13DevPage() {
  return (
    <DevScreenFrame screen="S13" title="사용자 관리" cases={DEV_CASES}>
      <p className="text-[12.5px] text-muted-foreground">준비 중</p>
    </DevScreenFrame>
  )
}
