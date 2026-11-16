import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

import { themeScopeAttrs, useActiveThemeScope } from "@/shared/lib/display-prefs"

// App has no theme toggle (see index.html's hardcoded `class="dark"`), so the
// toaster is pinned to dark instead of pulling in next-themes for a single
// read.
// 시안 화면 범위(ThemeScope)가 열려 있으면 알림도 그 범위의 팔레트 · 글꼴 · 배율을 받는다(설계서 §14-1).
// 알림 상자는 앱 전체에 하나라 범위 트리 밖에 있으므로, 같은 범위 속성을 단 상자로 감싼다. 범위가 없으면 전과 같다.
const Toaster = ({ ...props }: ToasterProps) => {
  const scope = useActiveThemeScope()
  const toaster = (
    <Sonner
      theme={scope && scope.theme !== "dark" ? "light" : "dark"}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
  if (!scope) return toaster
  return (
    <div data-toaster-scope="" {...themeScopeAttrs(scope)}>
      {toaster}
    </div>
  )
}

export { Toaster }
