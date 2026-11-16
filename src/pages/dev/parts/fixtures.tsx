import type { ReactNode } from "react";

import { AiTag } from "@/shared/ui/ai";
import { Button, Chip, Field, StatePill } from "@/shared/ui/kit";
import {
  ButtonBar,
  CaseWindowFrame,
  Panel,
  StageStrip,
  Stepper,
  TabMark,
  TaskBoxes,
  UnderlineTabs,
  WindowHead,
  WindowRail,
  WorkTabStrip,
} from "@/shared/ui/panel";

import { AI_FIXTURE_RENDERS } from "./fixtures-ai";
import { KIT_FIXTURE_RENDERS } from "./fixtures-kit";
import { VIEWER_FIXTURE_RENDERS } from "./fixtures-viewer";

// 진열 예시를 그리는 쪽(id → 그리기). 진열 화면만 읽는다 — 데이터는 fixtures-meta.ts.
// 시안과 같은 글자로 그리고, 부품에는 props 만 넘긴다(className · 손으로 쓴 data-part-* 금지).
// 부모에서 상속되는 줄 높이 같은 맥락은 fixtures-meta.ts 의 boxClass 로 상자에 준다.

const noop = () => undefined;
const WINDOW_TABS = [
  { id: "a", label: "00001-25-0649 · 주거침입" },
  { id: "b", label: "00001-25-0647 · 절도" },
];
const WINDOW_RAIL = [
  {
    name: "신발",
    items: [
      { id: "1", name: "_1", sub: "00001-25-0649_1", pill: <StatePill tone="done">발견</StatePill> },
      { id: "2", name: "_2", sub: "00001-25-0649_2", pill: <StatePill tone="fact">검색됨</StatePill> },
      { id: "3", name: "_3", sub: "00001-25-0649_3", pill: <StatePill tone="pending">등록</StatePill> },
    ],
  },
];

const BASE_FIXTURE_RENDERS: Record<string, () => ReactNode> = {
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
      defaultValue="기타"
      after={<Chip variant="amber-h18">확인 필요</Chip>}
      partId="S02-20"
      aria-label="채취 방법"
    />
  ),
  // Panel (높이는 fixtures-meta 의 boxClass 가 정한다)
  "S02-17": () => <Panel variant="default" partId="S02-17" />,
  "S02-18": () => (
    <Panel variant="default-pad" partId="S02-18">
      {Array.from({ length: 12 }, (_, i) => (
        // 시안 안쪽 12줄(높이 44 · 아래 줄 line-2). 부품이 아니라 내용이다.
        <div key={i} className="h-[44px] border-b-line-2 [border-style:none_none_solid] [border-width:0_0_1px]" />
      ))}
    </Panel>
  ),
  "S01-15": () => (
    <Panel
      title="사건관리 목록"
      corners
      partId="S01-15"
      actions={
        <ButtonBar>
          <Button size="sm">초기화</Button>
          <Button size="sm">엑셀</Button>
          <Button size="sm">조회</Button>
        </ButtonBar>
      }
    />
  ),
  // ButtonBar
  "S01-16": () => (
    <ButtonBar variant="panel-head" partId="S01-16">
      <Button size="sm">초기화</Button>
      <Button size="sm">엑셀</Button>
      <Button size="sm">조회</Button>
      <Button size="sm" variant="pri">
        등록
      </Button>
    </ButtonBar>
  ),
  "S02-23": () => (
    <ButtonBar variant="modal-head" partId="S02-23">
      <span className="inline-flex gap-[6px]">
        <Button size="sm">이전</Button>
        <Button size="sm">다음</Button>
        <Button size="sm">사건복사</Button>
        <Button size="sm" roleLock>
          수정
        </Button>
        <Button size="sm">닫기</Button>
      </span>
      <span className="h-[20px] w-px bg-line-3" />
      <span className="inline-flex gap-[6px]">
        <Button size="sm" variant="pri">
          검색 (문양 상세보기) →
        </Button>
      </span>
    </ButtonBar>
  ),
  // AiTag
  "S01-17": () => (
    <AiTag variant="progress" partId="S01-17">
      7/12
    </AiTag>
  ),
  "S01-18": () => <AiTag variant="done" partId="S01-18" />,
  "S02-21": () => (
    <AiTag variant="default" partId="S02-21">
      AI 제안
    </AiTag>
  ),
  // Stepper(r2) — S01 사건 진행 단계 막대: 교차 검증 단계(2번째 칸이 지금)
  "S01-44": () => <Stepper steps={["검증요청", "교차 검증", "감정서", "결재"]} current={1} partId="S01-44" />,
  // Stepper labeled(r2 검수) — S02 제목 줄 단계 띠(접수 완료, 지금 1차 작업)
  "S02-42": () => (
    <Stepper
      variant="labeled"
      steps={["접수", "1차 작업", "검색·판정", "교차 검증", "감정서", "결재"]}
      current={1}
      partId="S02-42"
    />
  ),
  // r4 창 부품(로망 이식) — 진열만(noMockup)
  "S01-96": () => (
    <CaseWindowFrame
      label="진열 — 사건 창"
      onClose={noop}
      partId="S01-96"
      tabs={<WorkTabStrip tabs={WINDOW_TABS} activeId="a" onSelect={noop} onClose={noop} />}
      head={<WindowHead mark="주" title="00001-25-0649" subtitle="주거침입" tags={["대구청"]} onPrev={noop} onNext={noop} prevOff onClose={noop} />}
      rail={<WindowRail label="진열 — 이미지 목록" groups={WINDOW_RAIL} selectedId="1" onSelect={noop} />}
    >
      <p className="m-0 p-4 text-[12px] text-muted-foreground">본문 자리</p>
    </CaseWindowFrame>
  ),
  "S01-97": () => (
    <WorkTabStrip tabs={WINDOW_TABS} activeId="a" onSelect={noop} onClose={noop} full="최대 8개까지 열 수 있어요" partId="S01-97" />
  ),
  "S01-98": () => <WindowRail label="진열 — 현장 이미지" groups={WINDOW_RAIL} selectedId="1" onSelect={noop} partId="S01-98" />,
  "S01-99": () => (
    <WindowHead
      mark="주"
      title="00001-25-0649"
      subtitle="주거침입"
      tags={["대구청", "07-24 등록", "12장"]}
      now={{ num: 2, stage: "1차 작업", task: "사건 정보 빈 칸", badge: "지금 할 차례" }}
      menu={[
        { label: "사건복사", onSelect: noop },
        { label: "수정", onSelect: noop },
      ]}
      onPrev={noop}
      onNext={noop}
      prevOff
      onClose={noop}
      partId="S01-99"
    />
  ),
  // r4 창 단계 · 탭 부품(로망 이식) — 진열만(noMockup). 상태 다섯(끝 · 문제 · 지금 · 아직 · 마지막)을 한 띠에
  "S01-61": () => (
    <StageStrip
      label="진열 — 사건 진행 단계"
      items={[
        { key: 0, state: "done", label: "접수", note: "끝" },
        { key: 1, state: "problem", label: "1차 작업", note: "확인 2개", dot: true },
        { key: 2, state: "pending", label: "검색·판정", note: "2개 남음", now: true },
        { key: 3, state: "pending", label: "교차 검증", note: "아직" },
        { key: 4, state: "notApplicable", label: "감정서", note: "해당 없음" },
        { key: 5, state: "pending", label: "결재", note: "아직", final: true },
      ]}
      onPick={noop}
      partId="S01-61"
    />
  ),
  "S01-62": () => (
    <TaskBoxes
      label="이 단계 할 일"
      items={[
        { key: "a", state: "done", label: "미검색 이미지", note: "0장", hint: "검색 결과" },
        { key: "b", state: "pending", label: "판정 안 한 이미지", note: "2장 · 지금", hint: "검색 결과", now: true, current: true },
        { key: "c", state: "problem", label: "흐린 사진", note: "_9", hint: "이미지 편집", badge: "! 재촬영?" },
        { key: "d", state: "pending", label: "결과 확인", note: "아직", hint: "결과 확인" },
      ]}
      onPress={noop}
      right={<span className="text-[11px] text-muted-foreground">✓ 저장됨 09:12</span>}
      partId="S01-62"
    />
  ),
  "S01-63": () => (
    <UnderlineTabs
      label="진열 — 작업"
      tabs={[
        ["info", <>사건 정보<TabMark kind="blanks" count={1} /></>],
        ["edit", <>이미지 편집<TabMark kind="problem" /></>],
        ["pattern", <>문양 코드<TabMark kind="done" /></>],
        ["search", "검색 결과"],
        ["compare", <>정밀 대조<TabMark kind="notApplicable" /></>],
        ["confirm", <>결과 확인<TabMark kind="count" count={3} /></>],
      ]}
      value="info"
      onChange={noop}
      endKey="confirm"
      partId="S01-63"
    />
  ),
};

// 갈래별 그리기를 합친다(잠금, Task 5).
export const FIXTURE_RENDERS: Record<string, () => ReactNode> = {
  ...BASE_FIXTURE_RENDERS,
  ...KIT_FIXTURE_RENDERS,
  ...VIEWER_FIXTURE_RENDERS,
  ...AI_FIXTURE_RENDERS,
};
