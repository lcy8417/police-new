import { cn } from "@/shared/lib/utils"

// r3 단축키 안내(? 키 · 「단축키 ?」 버튼): 결과 머리 아래 작은 창. Esc · ? 다시 · 버튼으로 닫는다.
// 글자 입력 칸에 초점이 있으면 단축키는 듣지 않는다(검색 칸에 ? 를 쓸 수 있게).

const KEYS: readonly (readonly [string, string])[] = [
  ["← →", "앞 · 뒤 카드(쪽 끝이면 쪽 넘김)"],
  ["Space", "자동 모드 재생 · 일시정지"],
  ["Enter", "초점 카드 상세조회"],
  ["S", "초점 카드 확인대상 ★ 넣기 · 빼기"],
  ["PgDn · PgUp", "다음 · 앞 쪽"],
  ["?", "이 안내 열기 · 닫기"],
  ["Esc", "안내 닫기 · 전체 화면 끝내기"],
]

export function ShortcutHelp({ className }: { className?: string }) {
  return (
    <div
      id="s05-shortcut-help"
      role="dialog"
      aria-label="단축키 안내"
      data-shortcut-help
      className={cn(
        "absolute top-[calc(100%+4px)] right-0 z-[8] w-[300px] rounded-[10px] border border-solid border-line-3 bg-panel p-[10px] text-[11.5px] shadow-[0_8px_24px_0_var(--t-ai-tag-drop)]",
        className,
      )}
    >
      <b className="mb-[6px] block text-[12px]">단축키</b>
      <dl className="grid grid-cols-[86px_minmax(0,1fr)] gap-x-[8px] gap-y-[4px]">
        {KEYS.map(([key, what]) => (
          <div key={key} className="contents">
            <dt>
              <kbd className="rounded-[4px] border border-solid border-line-3 bg-panel-2 px-[5px] font-code text-[10.5px] text-fg-2">
                {key}
              </kbd>
            </dt>
            <dd className="m-0 text-muted-foreground">{what}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
