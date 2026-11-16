import { DEV_CASES, DevScreenFrame } from "../frame"

// S03 이미지 편집 진열 페이지(자리). 화면 트랙이 위젯으로 채운다.
export function S03DevPage() {
  return (
    <DevScreenFrame screen="S03" title="이미지 편집" cases={DEV_CASES}>
      <p className="text-[12.5px] text-muted-foreground">준비 중</p>
    </DevScreenFrame>
  )
}
