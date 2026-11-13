import type { ReactNode } from "react";

import { Button, Chip, Field } from "@/shared/ui/kit";

// 진열 예시를 그리는 쪽(id → 그리기). 진열 화면만 읽는다 — 데이터는 fixtures-meta.ts.
// 시안과 같은 글자로 그리고, 부품에는 props 만 넘긴다(className · 손으로 쓴 data-part-* 금지).
// 부모에서 상속되는 줄 높이 같은 맥락은 fixtures-meta.ts 의 boxClass 로 상자에 준다.

export const FIXTURE_RENDERS: Record<string, () => ReactNode> = {
  // Button
  "S01-01": () => (
    <Button size="sm" partId="S01-01">
      초기화
    </Button>
  ),
  "S01-02": () => (
    <Button size="sm" variant="pri" partId="S01-02">
      등록
    </Button>
  ),
  "S01-03": () => (
    <Button size="sm-h26" partId="S01-03">
      검색
    </Button>
  ),
  "S01-04": () => (
    <Button size="sm" variant="ok" row partId="S01-04">
      검색
    </Button>
  ),
  "S01-06": () => (
    <Button size="sm" variant="warn" row partId="S01-06">
      검증
    </Button>
  ),
  "S02-02": () => (
    <Button size="sm-h22" partId="S02-02">
      적용
    </Button>
  ),
  "S02-03": () => (
    <Button size="sm" roleLock partId="S02-03">
      수정
    </Button>
  ),
  // Chip
  "S01-07": () => (
    <Chip variant="violet-h20" partId="S01-07">
      대조
    </Chip>
  ),
  "S01-08": () => (
    <Chip variant="green-h18" partId="S01-08">
      발견
    </Chip>
  ),
  "S01-09": () => (
    <Chip variant="h18" partId="S01-09">
      불발견
    </Chip>
  ),
  "S01-20": () => (
    <Chip variant="blue" partId="S01-20">
      감정관
    </Chip>
  ),
  "S02-04": () => (
    <Chip variant="amber-h18" partId="S02-04">
      중복? _4
    </Chip>
  ),
  "S02-05": () => (
    <Chip variant="amber" partId="S02-05">
      전사판 → 좌우반전 필요
    </Chip>
  ),
  "S02-06": () => (
    <Chip variant="amber-h19" partId="S02-06">
      오른쪽 ↗
    </Chip>
  ),
  "S02-07": () => (
    <Chip variant="h19" partId="S02-07">
      보류
    </Chip>
  ),
  "S02-08": () => (
    <Chip variant="blue-h20" partId="S02-08">
      공문 자동 접수 · 07-24 09:10
    </Chip>
  ),
  "S02-09": () => (
    <Chip variant="h20-warn" partId="S02-09">
      배당 절차: 확인 필요
    </Chip>
  ),
  "S02-10": () => (
    <Chip variant="blue-mono-h20" partId="S02-10">
      _2
    </Chip>
  ),
  // Field
  "S01-10": () => <Field variant="select" defaultValue="전체" partId="S01-10" aria-label="사건명" />,
  "S01-11": () => <Field partId="S01-11" aria-label="문서번호" />,
  "S01-12": () => <Field variant="mono" defaultValue="00001-25-" partId="S01-12" aria-label="감정번호" />,
  "S01-13": () => (
    <Field variant="mono-sm" defaultValue="2025-06-25 ~ 2025-07-24" partId="S01-13" aria-label="등록일자" />
  ),
  "S01-19": () => (
    <Field icon="search" placeholder="감정번호·문서번호·화류번호 바로 찾기" partId="S01-19" aria-label="바로 찾기" />
  ),
  "S02-14": () => <Field variant="pick" defaultValue="대구청 › 동부서" partId="S02-14" aria-label="의뢰관서" />,
  "S02-15": () => (
    <Field variant="mono-sm-flex" defaultValue="2025-07-22 23:00" partId="S02-15" aria-label="사건일시 시작" />
  ),
  "S02-16": () => (
    <Field variant="select-mono" defaultValue="00001-25-0649_2.jpg" partId="S02-16" aria-label="이미지 이름" />
  ),
  "S02-20": () => (
    <Field
      variant="select-warn"
      defaultValue="기타 "
      after={<Chip variant="amber-h18">확인 필요</Chip>}
      partId="S02-20"
      aria-label="채취 방법"
    />
  ),
};
