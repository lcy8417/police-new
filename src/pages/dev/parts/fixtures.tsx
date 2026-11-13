import type { ReactNode } from "react";

import { Button, Chip } from "@/shared/ui/kit";

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
};
