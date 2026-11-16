import { Link, useSearchParams } from "react-router-dom"

import { DEV_SCREENS } from "../frame"

// `/dev` 목차: 11개 화면 · 화면마다 실제로 있는 케이스 바로가기.
export function DevIndexPage() {
  // 보는 사람(`as`)은 목차에서 화면으로 넘어갈 때 유지한다
  const params = useSearchParams()[0]
  const as = params.get("as")
  const plusOff = params.get("plus") === "0"
  const asQuery = (as ? `&as=${encodeURIComponent(as)}` : "") + (plusOff ? "&plus=0" : "")
  const asOnly = asQuery ? `?${asQuery.slice(1)}` : ""
  return (
    <main className="min-h-screen bg-canvas px-[24px] py-[20px] text-foreground">
      <h1 className="m-0 text-[22px] font-semibold">화면 진열 목차</h1>
      <p className="mt-[4px] mb-[16px] text-[12.5px] text-muted-foreground">
        가짜 값으로 그린 화면 11개. 주소 끝에 <code className="font-code">?case=</code> · <code className="font-code">?as=</code> · <code className="font-code">?plus=0</code> 로 상태 · 보는 사람 · 신규 기능 보기를 바꾼다.
      </p>
      <ul className="m-0 grid list-none gap-[8px] p-0">
        {DEV_SCREENS.map((s) => (
          <li
            key={s.id}
            className="flex flex-wrap items-center gap-[10px] rounded-[8px] border border-solid border-border bg-panel px-[12px] py-[8px]"
          >
            <Link to={`/dev/${s.id}${asOnly}`} className="w-[240px] text-[13px] text-foreground no-underline">
              <span className="mr-[8px] font-code text-brand">{s.screen}</span>
              {s.title}
            </Link>
            {s.cases.map((c) => (
              <Link
                key={c}
                to={`/dev/${s.id}?case=${c}${asQuery}`}
                aria-label={`${s.screen} ${c}`}
                className="font-code text-[11px] text-dim no-underline"
              >
                {c}
              </Link>
            ))}
          </li>
        ))}
      </ul>
      <p className="mt-[16px] text-[12px]">
        <Link to="/dev/parts" className="text-brand no-underline">
          부품 진열(/dev/parts)
        </Link>
      </p>
    </main>
  )
}
