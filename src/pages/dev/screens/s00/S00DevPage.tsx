import { useMemo, useState, type ReactNode } from "react"
import { toast } from "sonner"

import { insertPatternPath } from "@/entities/pattern"
import { useDisplayPrefs } from "@/shared/lib/display-prefs"
import { PASSWORD_MESSAGES, passwordRuleError } from "@/entities/session"
import { LoginScreen, type DemoScreen, type LoginDemoArt } from "@/widgets/login-screen"

import { DEV_SCREENS, DevScreenFrame, devScreen, useDevCase, useDevNavigate, useDevPlus, useDevViewer } from "../frame"
import { fakeSoleUrl } from "../mock-assets/FakeSole"
import { hasSamplePhotos, samplePhotoUrl, sampleSoleUrl } from "../mock-assets/sample-images"
import type { ZoneTriple } from "../mock-assets/fake-art"
import {
  ATTEMPT_LIMIT,
  DEMO_CANDIDATE_ZONES,
  DEMO_PATTERN_NAMES,
  DEMO_SOLE_ZONES,
  FAILED_REMAINING,
  LOCKED_MESSAGE,
  LOGIN_FAILED_MESSAGE,
  MOCK_ACCOUNT,
  MOCK_LAST_LOGIN,
} from "./mock-cases"

const info = devScreen("s00")

const triple = (z: readonly [string, string, string]) => [z[0], z[1], z[2]] as ZoneTriple

/** 시연 그림(가짜 밑창 · 문양) — 한 번 만들어 계속 같은 값을 넘긴다(시연이 다시 그려지지 않게) */
// 표본 그림이 있으면: 현장 = 실제 현장 사진 · 그 이진화본, 정답 = 상 · 중 · 하가 모두 헤링본(n32_04)인 실제 신발 209608,
// 후보 4켤레 = 다른 실제 신발(없으면 가짜 그림)
const DEMO_SCENE_KEY = "로그인 시연"
const DEMO_ANSWER = "209608"
const DEMO_CANDIDATES = ["205078", "206815", "205002", "208969"] as const

function buildDemoArt(): LoginDemoArt {
  const zones = triple(DEMO_SOLE_ZONES)
  const [c1, c2, c3, c4] = DEMO_CANDIDATE_ZONES.map((z, i) =>
    sampleSoleUrl(DEMO_CANDIDATES[i], { kind: "shoe", zones: triple(z), seed: i + 2 }),
  )
  return {
    scene: sampleSoleUrl(DEMO_SCENE_KEY, { kind: "scene", zones, cut: true }),
    binary: hasSamplePhotos ? samplePhotoUrl(DEMO_SCENE_KEY, { look: "binary" }) : fakeSoleUrl({ kind: "bin", zones }),
    answer: sampleSoleUrl(DEMO_ANSWER, { kind: "shoe", zones }),
    candidates: [c1, c2, c3, c4],
    patterns: {
      top: insertPatternPath(DEMO_PATTERN_NAMES.top) as string,
      mid: insertPatternPath(DEMO_PATTERN_NAMES.mid) as string,
      bottom: insertPatternPath(DEMO_PATTERN_NAMES.bottom) as string,
    },
  }
}

// 로그인 화면은 위쪽 진열 막대(30px)를 뺀 높이 안에서 스스로 스크롤한다(#root 가 overflow hidden)
function Stage({ children }: { children: ReactNode }) {
  return <div className="flex h-[calc(100vh-30px)] min-h-0 flex-col">{children}</div>
}

// S00 로그인 진열 페이지: 케이스(ready · loading · failed · locked · error · password-change)로 상태를 바꿔 본다.
// 입력 값은 여기서 들고(제어형), 제출은 검사 문구를 보이거나 다음 진열 화면으로 이동한다.
// r2: 시안 r3 의 시연 · 안내 · 역할별 첫 화면(`showPlus`, `?plus=0` 이면 숨김). 보는 사람(`?as=`)에 따라 「지금」 줄이 옮겨 간다.
export function S00DevPage() {
  const to = useDevNavigate()
  const plus = useDevPlus()
  const viewer = useDevViewer()
  const activeCase = useDevCase(info.cases, "ready")
  const art = useMemo(buildDemoArt, [])
  // 화면 설정 「움직임 줄이기」 — 시연은 Web Animations 라 범위 CSS 로 멈추지 않으므로 값으로 넘긴다
  const { reducedMotion } = useDisplayPrefs()
  const [userId, setUserId] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(true)
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  // 입력 검사 문구는 만든 케이스에서만 보인다(케이스를 바꾸면 사라짐)
  const [local, setLocal] = useState<{ at: string; message: string } | null>(null)
  const localError = local && local.at === activeCase ? local.message : null
  const setLocalError = (message: string | null) => setLocal(message === null ? null : { at: activeCase, message })

  const fixed =
    activeCase === "failed" ? LOGIN_FAILED_MESSAGE : activeCase === "locked" ? LOCKED_MESSAGE : null
  const errorMessage = localError ?? fixed
  // 입력 검사 문구(빈 칸 등)는 서버 장애와 다르다 — 장애 시각 · 「다시」 없이 검사 문구만(3회차 검수)
  const status = activeCase === "loading" ? "loading" : activeCase === "error" && localError === null ? "error" : "ready"
  // 서버 거절(failed · locked)일 때만 남은 시도 안내가 붙는다. 입력 검사 문구에는 없다.
  const attempts =
    localError === null && activeCase === "failed"
      ? { remaining: FAILED_REMAINING, limit: ATTEMPT_LIMIT }
      : localError === null && activeCase === "locked"
        ? { remaining: 0, limit: ATTEMPT_LIMIT }
        : null

  const handleOpenDemoStep = (screen: DemoScreen) => {
    if (DEV_SCREENS.some((s) => s.id === screen)) to(`/dev/${screen}`)
    else toast("시안 — 기능 준비 중")
  }

  const common = {
    status,
    errorMessage: activeCase === "error" ? localError : errorMessage,
    errorAt: "14:05",
    onRetry: () => {
      setLocalError(null)
      toast("다시 시도합니다(진열용)")
      to("/dev/s00", { case: "ready" })
    },
    showPlus: plus,
    isAdmin: viewer.isAdmin,
    features: viewer.features,
    demoArt: art,
    onOpenDemoStep: handleOpenDemoStep,
    reducedMotion,
  } as const

  if (activeCase === "password-change") {
    const handleSubmit = () => {
      if (!current) return setLocalError("현재 비밀번호를 입력하세요")
      const rule = passwordRuleError(next)
      if (rule) return setLocalError(rule)
      if (next !== confirm) return setLocalError(PASSWORD_MESSAGES.mismatch)
      if (next === current) return setLocalError(PASSWORD_MESSAGES.sameAsCurrent)
      setLocalError(null)
      toast.success("비밀번호가 변경되었습니다")
      to("/dev/s01")
    }
    return (
      <DevScreenFrame screen={info.screen} title={info.title} cases={info.cases} bare>
        <Stage>
          <LoginScreen
            {...common}
            mode="password-change"
            currentPassword={current}
            onCurrentPasswordChange={setCurrent}
            newPassword={next}
            onNewPasswordChange={setNext}
            confirmPassword={confirm}
            onConfirmPasswordChange={setConfirm}
            forced
            account={MOCK_ACCOUNT}
            onSecondary={() => to("/dev/s00", { case: "ready" })}
            onSubmit={handleSubmit}
          />
        </Stage>
      </DevScreenFrame>
    )
  }

  const handleSubmit = () => {
    if (!userId.trim() || !password) return setLocalError("아이디와 비밀번호를 입력하세요")
    setLocalError(null)
    toast.success("로그인 시안 — 사건관리로 이동합니다")
    to("/dev/s01")
  }

  return (
    <DevScreenFrame screen={info.screen} title={info.title} cases={info.cases} bare>
      <Stage>
        <LoginScreen
          {...common}
          mode="login"
          userId={userId}
          onUserIdChange={setUserId}
          password={password}
          onPasswordChange={setPassword}
          remember={remember}
          onRememberChange={setRemember}
          attempts={attempts}
          lastLogin={MOCK_LAST_LOGIN}
          onSubmit={handleSubmit}
        />
      </Stage>
    </DevScreenFrame>
  )
}
