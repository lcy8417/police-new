import * as React from "react"

import { Button, Field, RadioRow } from "@/shared/ui/kit"

import { MATCH_OPTIONS } from "../model/constants"
import type { MatchConditionValues } from "../model/types"
import { Band } from "./Band"

// SCAS 「매칭 조건」(시안 핀 1 · 10, SCAS 유지). 지금 검색은 필수 문양만 쓰고 이 조건을 보내지 않으므로
// 라벨 · 순서 · 값만 보이고 모두 비활성 + 「준비 중」(spec §5-2 규칙 3). 값은 제어형(운영 연결 때 그대로 씀).

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="border-b border-solid border-line-2 bg-strip px-[8px] py-[6px] text-[12px] text-muted-foreground">{label}</dt>
      <dd className="m-0 min-w-0 border-b border-solid border-line-2 px-[8px] py-[6px] text-[12px]">{children}</dd>
    </>
  )
}

function Find({ label }: { label: string }) {
  return (
    <span className="flex gap-[4px]">
      <Field aria-label={label} readOnly value="" placeholder="전체" className="flex-1" />
      <Button size="sm-h26" disabled>
        찾기
      </Button>
    </span>
  )
}

export interface MatchConditionsProps {
  value: MatchConditionValues
  onChange: (next: MatchConditionValues) => void
}

export function MatchConditions({ value, onChange }: MatchConditionsProps) {
  const radio = (name: string, key: "searchKind" | "gender" | "heel") => (
    <RadioRow
      name={name}
      options={MATCH_OPTIONS[key].map((o) => ({ value: o, label: o }))}
      value={value[key]}
      onValueChange={(v) => onChange({ ...value, [key]: v })}
      disabled
      className="text-[12px]"
    />
  )
  return (
    <section aria-label="매칭 조건" title="준비 중" className="flex flex-col gap-[6px]">
      <Band title="매칭 조건">
        <span className="text-[11px] text-dim">준비 중</span>
      </Band>
      <dl className="m-0 grid grid-cols-[66px_minmax(0,1fr)]">
        <Row label="검색구분">{radio("검색구분", "searchKind")}</Row>
        <Row label="등록기간">
          <span className="grid gap-[3px]">
            <Field variant="mono-sm" aria-label="등록기간 시작" readOnly value={value.periodFrom} />
            <Field variant="mono-sm" aria-label="등록기간 끝" readOnly value={value.periodTo} />
          </span>
        </Row>
        <Row label="제조사">
          <Find label="제조사" />
        </Row>
        <Row label="상표">
          <Find label="상표" />
        </Row>
        <Row label="화종">
          <Find label="화종" />
        </Row>
        <Row label="성별">{radio("성별", "gender")}</Row>
        <Row label="굽유무">{radio("굽유무", "heel")}</Row>
        <Row label="등록관서">
          <Find label="등록관서" />
        </Row>
      </dl>
      <p className="text-[11px] text-dim">지금 검색은 필수 문양만으로 찾습니다(매칭 조건은 운영 연결 때).</p>
    </section>
  )
}
