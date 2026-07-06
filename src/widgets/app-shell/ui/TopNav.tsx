import { ShieldCheck } from "lucide-react"

import { EdgeGlow } from "@/shared/ui/glow-fx"

import { usePageHeaderStore } from "../model/page-header"

/**
 * Fixed 110px top bar: brand mark + title slot on the left, page-supplied
 * actions on the right. Title/actions come from the `usePageHeaderStore`
 * Zustand store, published by individual route pages via `usePageHeader`.
 */
export function TopNav() {
  const title = usePageHeaderStore((s) => s.title)
  const actions = usePageHeaderStore((s) => s.actions)

  return (
    <header className="relative flex h-[110px] shrink-0 items-center justify-between border-b border-[#1C2636] bg-[#0D1420] px-6">
      <div className="flex min-w-0 items-center gap-6">
        <div className="flex shrink-0 items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#16233B] shadow-[0_0_14px_rgba(59,130,246,0.45)] ring-1 ring-[#2A3B54]">
            {/* TODO: replace with 경찰청 emblem asset */}
            <ShieldCheck className="size-6 text-[#3B82F6]" aria-hidden="true" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-[15px] font-bold text-[#E5E9F0]">
              경찰청 과학수사
            </span>
            <span className="text-[9px] tracking-wide text-[#8A93A6]">
              KOREAN NATIONAL POLICE AGENCY
            </span>
            <span className="text-[9px] font-semibold tracking-wide text-[#4A9EFF]">
              FORENSIC SERVICE
            </span>
          </div>
        </div>

        {title ? (
          <div className="min-w-0 truncate border-l border-[#1C2636] pl-6 text-[26px] font-bold text-white">
            {title}
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-3">{actions}</div>

      <EdgeGlow className="right-0 bottom-[-1px] left-0" />
    </header>
  )
}
