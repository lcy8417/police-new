import { RegisterStage, RegisterHeaderTitle } from "@/widgets/crime-register-stage"
import { usePageHeader } from "@/widgets/app-shell"

// 등록 헤더 제목은 정적 — 헤더 effect가 매 렌더 재실행되지 않도록 한 번만 생성한다.
const HEADER_TITLE = <RegisterHeaderTitle />

/**
 * 독립 사건 등록 페이지 `/crimeRegister`. 이관된 `RegisterStage` 위젯(회전·크롭·
 * 각도보정·폼)을 얇게 감싸 렌더하고, 앱셸 헤더에 제목만 게시한다. 독립 페이지라
 * `onExit`는 no-op — 저장 성공 시 위젯이 폼을 리셋하므로 연속 등록을 이어간다.
 */
export function CrimeRegisterPage() {
  usePageHeader({ title: HEADER_TITLE })
  return <RegisterStage onExit={() => {}} />
}
