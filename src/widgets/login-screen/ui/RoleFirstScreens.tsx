import type { FeatureCode } from "@/entities/session"
import { Chip } from "@/shared/ui/kit"
import { Panel } from "@/shared/ui/panel"

import { currentDemoRole, ROLE_FIRST_SCREENS } from "../model/demo-script"

// S00 「로그인하면 처음 열리는 화면」(시안 핀 5 · 6). 보는 사람이 해당하는 역할 줄에만 「지금」 표시(시안 data-role).
export function RoleFirstScreens({ isAdmin, features }: { isAdmin: boolean; features: readonly FeatureCode[] }) {
  const current = currentDemoRole(isAdmin, features)
  return (
    <Panel
      data-plus
      role="region"
      aria-label="역할별 첫 화면"
      label="ROLES"
      actions={<h2 className="border-none text-[13px] font-semibold">로그인하면 처음 열리는 화면</h2>}
    >
      <ul className="m-0 grid list-none gap-[6px] px-[12px] py-[10px]">
        {ROLE_FIRST_SCREENS.map((r) => (
          <li
            key={r.role}
            data-role-row={r.role}
            className="grid grid-cols-[78px_minmax(0,1fr)_auto] items-center gap-[8px] rounded-[9px] border border-solid border-line-2 bg-panel-2 px-[10px] py-[7px]"
          >
            <Chip variant="blue" className="justify-center">
              {r.label}
            </Chip>
            <span className="grid min-w-0 leading-[1.35]">
              <b className="truncate text-[12px] font-semibold text-fg-2">→ {r.first}</b>
              <span className="text-[11px] text-dim">{r.hint}</span>
            </span>
            <span className="flex items-center gap-[6px]">
              {current === r.role && (
                <Chip data-now="" className="h-[19px] border-ai-line bg-ai-bg text-[10px] text-ai">
                  <span aria-hidden="true" className="size-[7px] rounded-full bg-current [box-shadow:0_0_6px_0_currentColor]" />
                  지금
                </Chip>
              )}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
