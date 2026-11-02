import type { AdminEvent } from "@/entities/admin"

/** 펼친 실패 기록의 상세 — 상태 코드·오류 코드·소요 시간·오류 메시지(전체). */
export function EventErrorDetail({ event }: { event: AdminEvent }) {
  const items: { label: string; value: string | null }[] = [
    { label: "상태 코드", value: event.statusCode === null ? null : String(event.statusCode) },
    { label: "오류 코드", value: event.errorCode },
    { label: "소요", value: event.durationMs === null ? null : `${event.durationMs}ms` },
  ]

  return (
    <div className="flex flex-col gap-2 rounded-md border border-[#1E2A3C] bg-[#0D1420] px-3 py-2.5">
      <dl className="flex flex-wrap gap-x-6 gap-y-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-baseline gap-2">
            <dt className="text-[11px] text-[#5B6B85]">{item.label}</dt>
            <dd className="font-mono text-[12px] tabular-nums text-[#C7CEDB]">{item.value ?? "—"}</dd>
          </div>
        ))}
      </dl>
      <p className="text-[12px] leading-5 break-all whitespace-pre-wrap text-[#FCA5A5]">
        {event.errorMsg ?? "오류 메시지가 없습니다."}
      </p>
    </div>
  )
}
