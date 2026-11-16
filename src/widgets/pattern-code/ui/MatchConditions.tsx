import * as React from "react"

import { Button, Field, RadioRow } from "@/shared/ui/kit"

import { Band } from "./Band"

// SCAS 「매칭 조건」(시안 핀 1 · 10, SCAS 유지). 지금 검색은 필수 문양만 쓰고 이 조건을 보내지 않으므로
// 라벨 · 순서 · 가짜 값만 두고 모두 비활성 + 「준비 중」(spec §5-2 규칙 3). 화면 안 상태도 없다.

const noop = () => undefined

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="border-b border-solid border-line-2 bg-strip px-[8px] py-[6px] text-[12px] text-muted-foreground">{label}</dt>
      <dd className="m-0 min-w-0 border-b border-solid border-line-2 px-[8px] py-[6px] text-[12px]">{children}</dd>
    </>
  )
}

function Radio({ name, options }: { name: string; options: string[] }) {
  return (
    <RadioRow
      name={name}
      options={options.map((o) => ({ value: o, label: o }))}
      value={options[0]}
      onValueChange={noop}
      disabled
      className="text-[12px]"
    />
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

export function MatchConditions() {
  return (
    <section aria-label="매칭 조건" title="준비 중" className="flex flex-col gap-[6px]">
      <Band title="매칭 조건">
        <span className="text-[11px] text-dim">준비 중</span>
      </Band>
      <dl className="m-0 grid grid-cols-[66px_minmax(0,1fr)]">
        <Row label="검색구분">
          <Radio name="검색구분" options={["현장문양", "동일범", "용의자문양"]} />
        </Row>
        <Row label="등록기간">
          <span className="grid gap-[3px]">
            <Field variant="mono-sm" aria-label="등록기간 시작" readOnly value="2000-01-01" />
            <Field variant="mono-sm" aria-label="등록기간 끝" readOnly value="2025-07-24" />
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
        <Row label="성별">
          <Radio name="성별" options={["전체", "남", "여", "혼용"]} />
        </Row>
        <Row label="굽유무">
          <Radio name="굽유무" options={["전체", "유", "무", "불상"]} />
        </Row>
        <Row label="등록관서">
          <Find label="등록관서" />
        </Row>
      </dl>
      <p className="text-[11px] text-dim">지금 검색은 필수 문양만으로 찾습니다(매칭 조건은 운영 연결 때).</p>
    </section>
  )
}
