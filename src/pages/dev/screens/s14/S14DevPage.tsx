import { DEV_CASES, DevScreenFrame } from "../frame"

// S14 사용 기록 진열 페이지(자리). 화면 트랙이 위젯으로 채운다.
export function S14DevPage() {
  return (
    <DevScreenFrame screen="S14" title="사용 기록" cases={DEV_CASES}>
      <p className="text-[12.5px] text-muted-foreground">준비 중</p>
    </DevScreenFrame>
  )
}
