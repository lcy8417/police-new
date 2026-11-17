import type { ReactNode } from "react"

import { cn } from "@/shared/lib/utils"
import { CheckList } from "@/shared/ui/ai"
import { BoardFrame, InlineError, ListNote, StatePill, StatusDot } from "@/shared/ui/kit"
import { PaneHead } from "@/shared/ui/panel"

import type { AdminLogsInsights, AuditKindTone, LogAlert, LogIntegrity } from "../model/types"

// S14 시안 r3 요약 칸(시간대별 사용량 · 이상 징후 · 기록 무결성)과 오른쪽 칸(감사 항목 · 내려받기 제한 · 관리자 행위).
// 값은 props 그대로 그리고, 좌표는 시안 차트 그대로(viewBox 400×142).
// R6: 영문 꼬리표 · 큰 숫자 타일 · 긴 설명을 빼고 칸 머리(PaneHead) + 흰 판(BoardFrame), 알약은 회색 · 실제 문제만 색(StatePill).

/** 알약 색 — 실제 문제(빨강 · 주황)만 색, 나머지는 회색 사실 알약 */
const TONE_PILL: Record<AuditKindTone, string | undefined> = {
  default: undefined,
  blue: undefined,
  green: "bg-ok-bg text-ok-fg",
  amber: "bg-warn-bg text-warn",
  red: "bg-danger-bg text-danger-fg",
  violet: undefined,
}

export function KindChip({ label, tone }: { label: string; tone: AuditKindTone }) {
  return (
    <StatePill tone="fact" className={TONE_PILL[tone]}>
      {label}
    </StatePill>
  )
}

/** 칸 머리 + 흰 판 */
function InsightBox({ label, title, end, children }: { label: string; title: string; end?: ReactNode; children: ReactNode }) {
  return (
    <section data-plus role="region" aria-label={label} className="grid min-w-0 content-start gap-[8px]">
      <PaneHead as="h2" title={title} end={end} />
      <BoardFrame className="mt-0">{children}</BoardFrame>
    </section>
  )
}

/* 시간대별 사용량(시안 핀 10) */

const X0 = 24
const BW = 15.5
const BASE = 124
const SC = 96 / 70
const hx = (h: number) => X0 + h * BW
const LABEL = "font-code text-[9px]"

type Activity = NonNullable<AdminLogsInsights["activity"]>

function ActivityChart({ hourly, weekAvg, nowHour }: Activity) {
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

function ActivityPanel({ activity }: { activity: Activity }) {
  const peak = activity.hourly.reduce((best, v, h) => (v > activity.hourly[best] ? h : best), 0)
  return (
    <InsightBox
      label="시간대별 사용량"
      title="시간대별 사용량 · 오늘"
      end={
        <span className="inline-flex items-center gap-[5px] text-[11px] text-dim">
          {/* 실시간 기록은 AI 가 아니다 — AI 실시간 점(맥박) 대신 일반 상태 점(2회차 검수) */}
          <StatusDot tone="ok" label="실시간" className="text-[11px]" />
          기능 기록 <b className="tabular-nums text-foreground">{activity.total}</b>건
        </span>
      }
    >
      <div className="grid gap-[8px] px-[14px] pt-[6px] pb-[10px]">
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
        {/* R6: 숫자 타일 3장 대신 한 줄 */}
        <div className="flex flex-wrap gap-x-[14px] gap-y-[4px] border-0 border-t border-solid border-border pt-[8px] text-[11px] text-muted-foreground">
          <span>
            <span>로그인</span> <b className="font-code text-[12.5px] tabular-nums text-foreground">{activity.logins}</b>
          </span>
          <span>
            <span>업무 시간 밖</span> <b className="font-code text-[12.5px] tabular-nums text-foreground">{activity.offHours}</b>
          </span>
          <span>
            <span>실패·권한 없음</span>{" "}
            <b className={cn("font-code text-[12.5px] tabular-nums", activity.failures > 0 ? "text-danger" : "text-foreground")}>{activity.failures}</b>
          </span>
        </div>
      </div>
    </InsightBox>
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
    <InsightBox label="이상 징후" title="이상 징후 · 최근 7일" end={<KindChip label={`확인 전 ${open}`} tone={open > 0 ? "red" : "default"} />}>
      <CheckList
        className="px-[14px] pt-[4px] pb-[6px]"
        items={alerts.map((a) => ({
          tone: a.tone,
          icon: ALERT_ICON[a.tone],
          text: <span className="text-fg-2">{a.title}</span>,
          detail: <span className="font-code text-[10px]">{a.detail}</span>,
          action: <AlertBadge alert={a} />,
        }))}
      />
    </InsightBox>
  )
}

/* 기록 무결성 — 해시 사슬(시안 핀 12) */

function IntegrityPanel({ integrity }: { integrity: LogIntegrity }) {
  const last = integrity.chain.length - 1
  const status = integrity.status ?? "ready"
  const broken = integrity.brokenAt ?? null
  // 검증 결과가 있을 때만 알약 — 확인 중 · 실패에 「변조 없음」을 보이지 않는다
  const chip =
    status !== "ready" && status !== "empty" ? null : broken !== null ? (
      <KindChip label={`! 사슬 어긋남 #${broken}`} tone="red" />
    ) : (
      <KindChip label="✓ 변조 없음" tone="default" />
    )
  if (status === "loading" || status === "error") {
    return (
      <InsightBox label="기록 무결성" title="기록 무결성" end={chip}>
        {status === "loading" ? (
          <ListNote role="status" className="text-center">
            확인 중…
          </ListNote>
        ) : (
          <div className="flex justify-center px-[14px] py-[10px]">
            <InlineError message="사슬을 확인하지 못했습니다" at={integrity.errorAt} onRetry={integrity.onRetry} />
          </div>
        )}
      </InsightBox>
    )
  }
  return (
    <InsightBox label="기록 무결성" title="기록 무결성" end={chip}>
      <div className="grid gap-[6px] px-[14px] pt-[6px] pb-[10px]">
        <svg viewBox="0 0 270 40" role="img" aria-label="해시 사슬" className="block h-[40px] w-full">
          <title>기록마다 바로 앞 기록의 지문(해시)을 품고 저장 — 한 줄이라도 고치면 뒤 사슬이 모두 어긋남</title>
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
        <CheckList
          items={integrity.checks.map((c) => ({
            tone: "ok" as const,
            text: c.text,
            action: <span className="font-code text-[10px] text-dim">{c.note}</span>,
          }))}
        />
      </div>
    </InsightBox>
  )
}

/** 표 위 요약 한 줄(사용량 · 이상 징후 · 무결성) — 값이 있는 칸만 */
export function LogPulseRow({ insights }: { insights: AdminLogsInsights }) {
  return (
    <div data-plus className="grid items-start gap-[14px] xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_320px]">
      {insights.activity && <ActivityPanel activity={insights.activity} />}
      {insights.alerts && <AlertPanel alerts={insights.alerts} />}
      {insights.integrity && <IntegrityPanel integrity={insights.integrity} />}
    </div>
  )
}

/** 표 오른쪽 칸(감사 항목 · 내려받기 제한 · 관리자 행위) — 값이 있는 칸만. `withIntegrity`: 요약 줄이 없을 때 무결성 칸을 맨 위에 */
export function LogSidePanels({ insights, withIntegrity = false }: { insights: AdminLogsInsights; withIntegrity?: boolean }) {
  return (
    <div data-plus className="grid min-w-0 content-start gap-[14px]">
      {withIntegrity && insights.integrity && <IntegrityPanel integrity={insights.integrity} />}
      {insights.auditKinds && (
      <InsightBox label="감사 항목" title="감사 항목 · 오늘">
        <div className="grid gap-[6px] px-[14px] py-[10px]">
          {insights.auditKinds.map((k) => (
            <div key={k.label} className="grid grid-cols-[84px_36px_minmax(0,1fr)] items-center gap-[8px] text-[12.5px]">
              <span>
                <KindChip label={k.label} tone={k.tone} />
              </span>
              <span className="text-right font-code tabular-nums text-foreground">{k.count}</span>
              <span className="text-[11px] text-dim">{k.desc}</span>
            </div>
          ))}
        </div>
      </InsightBox>
      )}
      {insights.exportRules && (
        <InsightBox label="다운로드·출력 제한" title="다운로드·출력 제한">
          <ul className="m-0 grid list-none gap-[4px] px-[14px] py-[10px] text-[11px] leading-[1.5] text-fg-2">
            {insights.exportRules.map((r) => (
              <li key={r}>· {r}</li>
            ))}
          </ul>
        </InsightBox>
      )}
      {insights.adminActs && (
        <InsightBox label="관리자 행위" title="관리자 행위 · 최근">
          <div className="grid gap-[6px] px-[14px] py-[10px]">
            {insights.adminActs.length === 0 ? (
              <span className="text-[11px] text-dim">결과 없음</span>
            ) : (
              insights.adminActs.map((a) => (
                <div key={`${a.at}-${a.text}`} className="grid grid-cols-[76px_minmax(0,1fr)] gap-[8px] text-[11px] leading-[1.4]">
                  <span className="font-code text-dim">{a.at}</span>
                  <span className="text-fg-2">
                    <span className="font-code text-brand-3">{a.who}</span> {a.text}
                  </span>
                </div>
              ))
            )}
          </div>
        </InsightBox>
      )}
    </div>
  )
}
