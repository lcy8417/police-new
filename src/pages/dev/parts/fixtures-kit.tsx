import type { ReactNode } from "react";

import {
  AutoPlayControl,
  Avatar,
  BoardFrame,
  BoardLid,
  ColumnPicker,
  Combobox,
  CountDot,
  DataGrid,
  FilterBar,
  InlineError,
  LidActiveFilterChip,
  LidChip,
  LidChipGroup,
  LidFilterLabel,
  LidResetLink,
  LidSearch,
  LidSeparator,
  LidViewTab,
  LidViewTabs,
  ListFoot,
  ListHeadRow,
  ListNote,
  ListRow,
  Pagination,
  RadioRow,
  Segmented,
  StatePill,
  StatusDot,
  ViewCountSwitch,
} from "@/shared/ui/kit";

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

const FILTER_GROUPS = [
  {
    key: "status",
    label: "상태",
    options: [
      { value: "ok", label: "확인", count: 4 },
      { value: "wait", label: "대기", count: 2 },
      { value: "fail", label: "불능", count: 1 },
    ],
    value: ["ok"],
  },
];

const PICKER_COLUMNS = [
  { key: "no", label: "감정번호", locked: true },
  { key: "name", label: "사건명" },
  { key: "place", label: "채취장소" },
];

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
  "S01-81": () => (
    <FilterBar
      query="침입"
      onQueryChange={noop}
      filters={FILTER_GROUPS}
      onFilterChange={noop}
      onClear={noop}
      resultCount={5}
      total={12}
      partId="S01-81"
    />
  ),
  "S01-82": () => <ColumnPicker columns={PICKER_COLUMNS} visible={["no", "name"]} onChange={noop} partId="S01-82" />,
  "S01-83": () => <ViewCountSwitch options={[1, 3, 5]} value={3} onChange={noop} label="보기" partId="S01-83" />,
  "S01-84": () => (
    <AutoPlayControl
      mode="auto"
      onModeChange={noop}
      intervalMs={2000}
      onIntervalChange={noop}
      playing
      onPlayPause={noop}
      position={{ index: 2, total: 12 }}
      remainingRatio={0.6}
      partId="S01-84"
    />
  ),
  "S01-85": () => (
    <AutoPlayControl
      mode="manual"
      onModeChange={noop}
      intervalMs={2000}
      onIntervalChange={noop}
      playing={false}
      onPlayPause={noop}
      position={{ index: 0, total: 12 }}
      remainingRatio={0}
      partId="S01-85"
    />
  ),
  // r4 목록 판(로망 이식) — 뚜껑 한 줄: 이름표 · 칩 켜짐/꺼짐/0건 · 칸막이 · 풀기 · 찾기
  "S01-86": () => (
    <BoardLid partId="S01-86">
      <LidFilterLabel>빠른 보기</LidFilterLabel>
      <LidChipGroup aria-label="빠른 보기">
        <LidChip active count={14}>결과 확인 전</LidChip>
        <LidChip count={9}>이미지 미검색</LidChip>
        <LidChip zero count={0}>교차 검증</LidChip>
      </LidChipGroup>
      <LidSeparator />
      <LidResetLink onClick={noop} />
      <LidSearch inputProps={{ "aria-label": "찾기", placeholder: "감정번호 · 사건명", value: "", onChange: noop }} />
    </BoardLid>
  ),
  "S01-87": () => (
    <LidChip active count={14} partId="S01-87">
      결과 확인 전
    </LidChip>
  ),
  "S01-88": () => (
    <LidSearch
      partId="S01-88"
      inputProps={{ "aria-label": "찾기", value: "0646", onChange: noop }}
      onClear={noop}
    />
  ),
  "S01-89": () => (
    <LidViewTabs aria-label="보기" partId="S01-89">
      <LidViewTab active>
        목록 <b>116</b>
      </LidViewTab>
      <LidViewTab active={false} menu>
        문양 <b>12</b>
      </LidViewTab>
    </LidViewTabs>
  ),
  "S01-90": () => (
    <LidActiveFilterChip aria-label="결과 확인 전 풀기" onClick={noop} partId="S01-90">
      결과 확인 전
    </LidActiveFilterChip>
  ),
  "S01-91": () => (
    <BoardFrame partId="S01-91" className="mt-0">
      <ListHeadRow>
        <span className="w-[120px]">감정번호</span>
        <span>사건명</span>
      </ListHeadRow>
      <ListRow>
        <span className="w-[120px]">00001-25-0646</span>
        <span>침입절도</span>
      </ListRow>
      <ListRow selected>
        <span className="w-[120px]">00001-25-0649</span>
        <span>상해</span>
      </ListRow>
      <ListFoot>
        2 / 전체 116<span className="ml-auto">1 / 6쪽</span>
      </ListFoot>
    </BoardFrame>
  ),
  "S01-92": () => (
    <ListRow selected partId="S01-92">
      <span className="w-[120px]">00001-25-0646</span>
      <span>침입절도</span>
    </ListRow>
  ),
  "S01-93": () => <ListNote partId="S01-93">조건에 맞는 항목 없음</ListNote>,
  "S01-94": () => (
    <StatePill tone="problem" partId="S01-94">
      불능 1
    </StatePill>
  ),
  "S01-95": () => <CountDot count={3} partId="S01-95" />,
};
