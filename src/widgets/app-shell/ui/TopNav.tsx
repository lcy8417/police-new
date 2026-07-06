import { ShieldCheck } from "lucide-react"

import { usePageHeaderValue } from "../model/page-header"

/**
 * Fixed 110px top bar: brand mark + title slot on the left, page-supplied
 * actions on the right. Title/actions come from `PageHeaderProvider` via
 * `usePageHeader`, published by individual route pages.
 */
export function TopNav() {
  const { title, actions } = usePageHeaderValue()

  return (
    <header className="flex h-[110px] shrink-0 items-center justify-between border-b border-[#1C2636] bg-[#0D1420] px-6">
      <div className="flex min-w-0 items-center gap-6">
        <div className="flex shrink-0 items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#16233B]">
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
          </div>
        </div>

        {title ? (
          <div className="min-w-0 truncate border-l border-[#1C2636] pl-6 text-[26px] font-bold text-white">
            {title}
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-3">{actions}</div>
    </header>
  )
}
