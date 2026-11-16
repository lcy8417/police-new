import { cn } from "@/shared/lib/utils"
import { CheckList, LiveDot, StatTile } from "@/shared/ui/ai"
import { Chip } from "@/shared/ui/kit"
import { Panel } from "@/shared/ui/panel"

import type { AdminLogsInsights, AuditKindTone, LogAlert } from "../model/types"

// S14 시안 r3 요약 칸(시간대별 사용량 · 이상 징후 · 기록 무결성)과 오른쪽 칸(감사 항목 · 내려받기 제한 · 관리자 행위).
// 값은 props 그대로 그리고, 좌표는 시안 차트 그대로(viewBox 400×142).

const TONE_CHIP: Record<AuditKindTone, string> = {
  default: "",
  blue: "border-brand-line bg-brand-bg text-brand",
  green: "border-ok-line bg-ok-bg text-ok-fg",
  amber: "border-warn-line bg-warn-bg text-warn",
  red: "border-danger-line bg-danger-bg text-danger-fg",
  violet: "border-violet-line bg-violet-bg text-violet",
}

export function KindChip({ label, tone }: { label: string; tone: AuditKindTone }) {
  return <Chip className={cn("h-[20px] text-[11px]", TONE_CHIP[tone])}>{label}</Chip>
}

function PanelTitle({ children }: { children: string }) {
  return <h2 className="border-none text-[13px] font-semibold">{children}</h2>
}

/* 시간대별 사용량(시안 핀 10) */

const X0 = 24
const BW = 15.5
const BASE = 124
const SC = 96 / 70
const hx = (h: number) => X0 + h * BW
const LABEL = "font-code text-[9px]"

function ActivityChart({ hourly, weekAvg, nowHour }: AdminLogsInsights["activity"]) {
  const peak = hourly.reduce((best, v, h) => (v > hourly[best] ? h : best), 0)
  return (
    <svg viewBox="0 0 400 142" role="img" aria-label="시간대별 사용량" className="block w-full">
      <rect x={hx(0)} y={14} width={8 * BW} height={BASE - 14} className="fill-strip" />
      <rect x={hx(18)} y={14} width={6 * BW} height={BASE - 14} className="fill-strip" />
      <text x={hx(4)} y={24} textAnchor="middle" className="fill-faint font-ui text-[9px]">
        업무 시간 밖
      </text>
      <text x={hx(21)} y={24} textAnchor="middle" className="fill-faint font-ui text-[9px]">
        업무 시간 밖
      </text>
      {[20, 40, 60].map((v) => (
        <g key={v}>
          <line x1={X0} x2={hx(24)} y1={BASE - v * SC} y2={BASE - v * SC} className="stroke-line-2" />
          <text x={X0 - 4} y={BASE - v * SC + 3} textAnchor="end" className="fill-faint font-code text-[8.5px]">
            {v}
          </text>
        </g>
      ))}
      {hourly.map((v, h) =>
        v ? (
          <rect
            key={h}
            x={hx(h) + 2}
            y={BASE - v * SC}
            width={BW - 4}
            height={v * SC}
            rx={2}
            className={h === peak ? "fill-brand" : "fill-brand-2"}
            opacity={h === peak ? 1 : 0.75}
          />
        ) : null,
      )}
      <polyline
        points={weekAvg.map((v, h) => `${hx(h) + BW / 2},${BASE - v * SC}`).join(" ")}
        fill="none"
        className="stroke-fg-2"
        strokeWidth={1.2}
        strokeDasharray="3 3"
        opacity={0.7}
      />
      <line x1={hx(nowHour)} x2={hx(nowHour)} y1={10} y2={BASE} className="stroke-warn" strokeWidth={1.2} />
      <text x={hx(nowHour) + 3} y={12} className={cn("fill-warn", LABEL)}>
        지금 {String(nowHour).padStart(2, "0")}:00
      </text>
      <text x={hx(peak) + BW / 2} y={BASE - hourly[peak] * SC - 4} textAnchor="middle" className={cn("fill-foreground font-semibold", LABEL)}>
        {hourly[peak]}
      </text>
      <line x1={X0} x2={hx(24)} y1={BASE} y2={BASE} className="stroke-line-3" />
      {[0, 6, 9, 12, 18, 24].map((h) => (
        <text key={h} x={hx(h)} y={BASE + 12} textAnchor="middle" className={cn("fill-dim", LABEL)}>
          {h}시
        </text>
      ))}
    </svg>
  )
}

function ActivityPanel({ activity }: { activity: AdminLogsInsights["activity"] }) {
  const peak = activity.hourly.reduce((best, v, h) => (v > activity.hourly[best] ? h : best), 0)
  return (
    <Panel
      data-plus
      role="region"
      aria-label="시간대별 사용량"
      label="ACTIVITY"
      actions={
        <>
          <PanelTitle>시간대별 사용량 · 오늘</PanelTitle>
          <span className="ml-auto inline-flex items-center gap-[5px] text-[11px] text-dim">
            <LiveDot state="busy" label="기능 기록 실시간" hideLabel />
            기능 기록 <b className="tabular-nums text-foreground">{activity.total}</b>건
          </span>
        </>
      }
    >
      <div className="grid gap-[8px] px-[14px] pt-[6px] pb-[12px]">
        <ActivityChart {...activity} />
        <div className="flex flex-wrap gap-x-[14px] gap-y-[4px] text-[11px] text-dim">
          <span>
            <i aria-hidden="true" className="mr-[4px] inline-block size-[9px] rounded-[2px] bg-brand-2 align-[-1px]" />
            오늘 한 시간 건수
          </span>
          <span>
            <i aria-hidden="true" className="mr-[4px] inline-block w-[14px] border-t-[1.5px] border-dashed border-fg-2 align-[3px]" />
            최근 7일 평균
          </span>
          <span className="ml-auto">
            가장 바쁜 때{" "}
            <b className="tabular-nums text-fg-2">
              {peak}시 {activity.hourly[peak]}건
            </b>
          </span>
        </div>
        <div className="grid grid-cols-3 gap-[6px]">
          <StatTile size="xs" label="로그인" value={activity.logins} />
          <StatTile size="xs" label="업무 시간 밖" value={activity.offHours} />
          <StatTile size="xs" glow="danger" valueTone="danger" label="실패·권한 없음" value={activity.failures} />
        </div>
      </div>
    </Panel>
  )
}

/* 이상 징후 · 최근 7일(시안 핀 11) */

const ALERT_ICON: Record<LogAlert["tone"], string> = { bad: "!", warn: "?", ok: "✓" }

function AlertBadge({ alert }: { alert: LogAlert }) {
  if (alert.badgeTone === "none") return <span className="text-[11px] text-faint">{alert.badge}</span>
  return <KindChip label={alert.badge} tone={alert.badgeTone} />
}

function AlertPanel({ alerts }: { alerts: LogAlert[] }) {
  const open = alerts.filter((a) => a.badgeTone === "red").length
  return (
    <Panel
      data-plus
      role="region"
      aria-label="이상 징후"
      label="ALERT"
      actions={
        <>
          <PanelTitle>이상 징후 · 최근 7일</PanelTitle>
          <span className="ml-auto">
            <KindChip label={`확인 전 ${open}`} tone="red" />
          </span>
        </>
      }
    >
      <CheckList
        className="px-[14px] pt-[4px] pb-[6px]"
        items={alerts.map((a) => ({
          tone: a.tone,
          icon: ALERT_ICON[a.tone],
          text: <span className="text-fg-2">{a.title}</span>,
          detail: <span className="font-code text-[10.5px]">{a.detail}</span>,
          action: <AlertBadge alert={a} />,
        }))}
      />
    </Panel>
  )
}

/* 기록 무결성 — 해시 사슬(시안 핀 12) */

function IntegrityPanel({ integrity }: { integrity: AdminLogsInsights["integrity"] }) {
  const last = integrity.chain.length - 1
  return (
    <Panel
      data-plus
      role="region"
      aria-label="기록 무결성"
      label="INTEGRITY"
      actions={
        <>
          <PanelTitle>기록 무결성</PanelTitle>
          <span className="ml-auto">
            <KindChip label="✓ 변조 없음" tone="green" />
          </span>
        </>
      }
    >
      <div className="grid gap-[6px] px-[14px] pt-[6px] pb-[12px]">
        <svg viewBox="0 0 270 40" role="img" aria-label="해시 사슬" className="block h-[40px] w-full">
          {integrity.chain.map((c, i) => (
            <g key={c.no}>
              {i > 0 && <line x1={4 + i * 54 - 10} x2={4 + i * 54} y1={20} y2={20} className="stroke-ok-fg/40" strokeWidth={2} />}
              <rect x={4 + i * 54} y={7} width={44} height={26} rx={5} className={cn("fill-ok-bg", i === last ? "stroke-ok-fg" : "stroke-ok-line")} />
              <text x={26 + i * 54} y={18} textAnchor="middle" className="fill-fg-2 font-code text-[8.5px]">
                #{c.no}
              </text>
              <text x={26 + i * 54} y={28} textAnchor="middle" className="fill-dim font-code text-[7.5px]">
                {c.hash}…
              </text>
            </g>
          ))}
        </svg>
        <p className="m-0 text-[10.5px] leading-[1.4] text-dim">
          기록마다 바로 앞 기록의 지문(해시)을 품고 저장됩니다. 한 줄이라도 고치면 뒤 사슬이 모두 어긋나 바로 드러납니다.
        </p>
        <CheckList
          items={integrity.checks.map((c) => ({
            tone: "ok" as const,
            text: c.text,
            action: <span className="font-code text-[10.5px] text-dim">{c.note}</span>,
          }))}
        />
      </div>
    </Panel>
  )
}

/** 표 위 요약 한 줄(사용량 · 이상 징후 · 무결성) */
export function LogPulseRow({ insights }: { insights: AdminLogsInsights }) {
  return (
    <div data-plus className="mb-[10px] grid items-stretch gap-[12px] xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_340px]">
      <ActivityPanel activity={insights.activity} />
      <AlertPanel alerts={insights.alerts} />
      <IntegrityPanel integrity={insights.integrity} />
    </div>
  )
}

/** 표 오른쪽 칸(감사 항목 · 내려받기 제한 · 관리자 행위) */
export function LogSidePanels({ insights }: { insights: AdminLogsInsights }) {
  return (
    <div data-plus className="grid min-w-0 content-start gap-[12px]">
      <Panel role="region" aria-label="감사 항목" label="AUDIT" actions={<PanelTitle>감사 항목 · 오늘</PanelTitle>}>
        <div className="grid gap-[7px] p-[14px]">
          {insights.auditKinds.map((k) => (
            <div key={k.label} className="grid grid-cols-[86px_36px_minmax(0,1fr)] items-center gap-[8px] text-[12px]">
              <span>
                <KindChip label={k.label} tone={k.tone} />
              </span>
              <span className="text-right tabular-nums text-foreground">{k.count}</span>
              <span className="text-[11.5px] text-dim">{k.desc}</span>
            </div>
          ))}
        </div>
      </Panel>
      <Panel role="region" aria-label="다운로드·출력 제한" label="EXPORT" actions={<PanelTitle>다운로드·출력 제한</PanelTitle>}>
        <ul className="m-0 grid list-none gap-[6px] p-[14px] text-[12px] leading-[1.5] text-fg-2">
          {insights.exportRules.map((r) => (
            <li key={r}>· {r}</li>
          ))}
        </ul>
      </Panel>
      <Panel role="region" aria-label="관리자 행위" label="ADMIN" actions={<PanelTitle>관리자 행위 · 최근</PanelTitle>}>
        <div className="grid gap-[7px] p-[14px]">
          {insights.adminActs.map((a) => (
            <div key={`${a.at}-${a.text}`} className="grid grid-cols-[76px_minmax(0,1fr)] gap-[8px] text-[12px] leading-[1.4]">
              <span className="font-code text-[11px] text-dim">{a.at}</span>
              <span className="text-fg-2">
                <span className="font-code text-[11.5px] text-brand">{a.who}</span> {a.text}
              </span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
