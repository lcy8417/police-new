import { DEV_CASES, DevScreenFrame } from "../frame"

// S02 사건 상세 진열 페이지(자리). 화면 트랙이 위젯으로 채운다.
export function S02DevPage() {
  return (
    <DevScreenFrame screen="S02" title="사건 상세" cases={DEV_CASES}>
      <p className="text-[12.5px] text-muted-foreground">준비 중</p>
    </DevScreenFrame>
  )
}
