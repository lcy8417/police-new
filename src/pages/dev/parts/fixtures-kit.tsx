import type { ReactNode } from "react";

import { Avatar, Combobox, DataGrid, InlineError, Pagination, RadioRow, Segmented, StatusDot } from "@/shared/ui/kit";

// kit 갈래 진열 예시를 그리는 쪽(id → 그리기). 컨트롤러가 fixtures.tsx 의 FIXTURE_RENDERS 에 합친다.
// 값은 고정(진열은 움직이지 않음). DialogShell 은 화면을 덮는 겹이라 진열 상자에 넣지 않는다(노트 참고).

const MODES = [
  { value: "기본", label: "기본 보기 15열" },
  { value: "전체", label: "SCAS 열 전체 보기 25열" },
];

const OFFICES = [
  { value: "dg-e", label: "동부서", path: "대구청 › 동부서" },
  { value: "dg-w", label: "서부서", path: "대구청 › 서부서" },
];

interface DemoRow {
  id: string;
  no: string;
  name: string;
  n: number;
}
const ROWS: DemoRow[] = [
  { id: "a", no: "00001-25-0646", name: "침입절도", n: 3 },
  { id: "b", no: "00001-25-0649", name: "상해", n: 12 },
];

const noop = () => {};

export const KIT_FIXTURE_RENDERS: Record<string, () => ReactNode> = {
  "S01-71": () => <Segmented items={MODES} value="기본" onValueChange={noop} partId="S01-71" />,
  "S01-72": () => <Segmented items={MODES} value="전체" onValueChange={noop} scas partId="S01-72" />,
  "S01-76": () => (
    <RadioRow
      name="보기 방식"
      options={[
        { value: "list", label: "목록보기" },
        { value: "pattern", label: "문양보기" },
      ]}
      value="list"
      onValueChange={noop}
      partId="S01-76"
    />
  ),
  "S02-72": () => (
    <Combobox items={OFFICES} value="dg-e" onValueChange={noop} placeholder="관서 검색" partId="S02-72" />
  ),
  "S11-71": () => <StatusDot tone="ok" label="정상" partId="S11-71" />,
  "S11-72": () => <StatusDot tone="danger" label="오류" partId="S11-72" />,
  "S01-73": () => <Avatar name="박○○" partId="S01-73" />,
  "S01-74": () => (
    <DataGrid
      columns={[
        { key: "no", header: "감정번호", render: (r: DemoRow) => r.no },
        { key: "name", header: "사건명", render: (r: DemoRow) => r.name },
        { key: "n", header: "건수", align: "right", render: (r: DemoRow) => r.n },
      ]}
      rows={ROWS}
      rowKey={(r) => r.id}
      selectedKey="a"
      partId="S01-74"
    />
  ),
  "S01-75": () => <Pagination total={116} page={1} pageSize={20} hasNext onPageChange={noop} partId="S01-75" />,
  "S00-71": () => <InlineError message="확인 못 함" at="09:12" onRetry={noop} partId="S00-71" />,
};
