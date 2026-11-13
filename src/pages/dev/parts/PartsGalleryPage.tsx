import type { ReactNode } from "react";
import { useSearchParams } from "react-router-dom";

import { AiTag } from "@/shared/ui/ai";
import { Button, Chip, Field } from "@/shared/ui/kit";
import { ButtonBar, Panel } from "@/shared/ui/panel";

import { FIXTURE_RENDERS } from "./fixtures";
import { PART_FIXTURES, type FixtureSurface, type PartFixture } from "./fixtures-meta";

// 상자 바탕 토큰 클래스(R12). 시안 요소의 가장 가까운 불투명 조상 배경에 대응한다.
const SURFACE_CLASS: Record<FixtureSurface, string> = {
  canvas: "bg-canvas",
  panel: "bg-panel",
  "panel-2": "bg-panel-2",
  "panel-3": "bg-panel-3",
  strip: "bg-strip",
  ai: "bg-ai-bg",
};

/**
 * 부품 진열 화면(`/dev/parts`, 개발 실행 전용 — 설계서 §9).
 *
 * - 구현된 부품 예시(`PART_FIXTURES`)를 폭 `parentWidth`px 상자 안에 하나씩 그린다.
 * - `?id=S01-03` 이면 그 예시 하나만 그린다(자동 대조가 이 주소를 연다).
 * - 바탕 글꼴 · 글자 크기 · 줄 높이 · 글자색 · 배경은 시안 `body`(`font: 14px/1.6 var(--font-ui)`,
 *   `color: var(--fg)`, `background: var(--bg)`, antialiased)와 같게 — 이 화면 틀에만 건다(앱 body 는 그대로).
 */
export function PartsGalleryPage() {
  const [params] = useSearchParams();
  const id = params.get("id");
  const fixtures = id ? PART_FIXTURES.filter((f) => f.id === id) : PART_FIXTURES;

  // `?view=example` 이면 S01 · S02 조립 예시만 그린다(반응형 확인용 — 시안 고정 폭 상자 제외, R32).
  if (!id && params.get("view") === "example") {
    return (
      <main
        data-parts-gallery=""
        className="h-full overflow-auto bg-canvas p-6 font-ui text-[14px] leading-[1.6] text-foreground antialiased"
      >
        <Assemblies />
      </main>
    );
  }

  return (
    <main
      data-parts-gallery=""
      className="h-full overflow-auto bg-canvas p-6 font-ui text-[14px] leading-[1.6] text-foreground antialiased"
    >
      <h1 className="mb-4 text-[13px] font-semibold text-muted-foreground">부품 진열</h1>
      {fixtures.length === 0 ? (
        <p className="text-muted-foreground">진열할 부품 없음</p>
      ) : (
        <div className="flex flex-col gap-6">
          {fixtures.map((fixture) => (
            <FixtureBox key={fixture.id} fixture={fixture} />
          ))}
        </div>
      )}
      {/* 조립 예시는 대조 대상이 아니라 전체 진열에서만 보인다(?id= 로 하나만 열 때는 숨김). */}
      {!id && <Assemblies />}
    </main>
  );
}

/** 조립 예시 묶음: 시안을 베낀 것이 아니라 시안 S01 · S02 의 한 부분을 부품으로 다시 짠 것(R37). */
function Assemblies() {
  return (
    <>
      <p className="mt-10 text-[12px] text-dim">
        조립 예시 — 시안 복사본이 아니라 S01 · S02 의 한 부분을 부품으로 다시 짠 것(자동 대조 대상 아님, 폭별 배치 확인용)
      </p>
      <S01Assembly />
      <S02Assembly />
    </>
  );
}

/** 라벨 칸 + 값 칸 한 쌍(시안 S01 검색 조건 표의 `.l` · `.v`). */
function FormRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <div className="flex items-center border-b border-b-line-2 bg-strip px-[10px] py-[6px] text-[12px] text-fg-2 [border-style:none_none_solid] [border-width:0_0_1px]">
        {label}
      </div>
      <div className="flex min-w-0 items-center border-b border-b-line-2 px-[10px] py-[6px] [border-style:none_none_solid] [border-width:0_0_1px]">
        {children}
      </div>
    </>
  );
}

/**
 * S01 조립 예시(설계서 §9, Task 11 반응형 확인용): 시안 S01 의 검색 조건 패널 한 개를 Panel + ButtonBar + Button + Field + Chip 으로
 * 다시 그린 것. `data-part-id` 가 없으므로 자동 대조(parts-compare)에는 들어가지 않는다.
 * 좁은 화면에서는 라벨·값 한 쌍씩 2열로, 넓은 화면(lg)에서는 시안처럼 3쌍(6열)로 놓인다.
 */
function S01Assembly() {
  return (
    <section aria-labelledby="s01-assembly-title" className="mt-4 flex flex-col gap-2">
      <h2 id="s01-assembly-title" className="text-[13px] font-semibold text-muted-foreground">
        S01 조립 예시
      </h2>
      <Panel
        title="검색 조건"
        label="SEARCH"
        actions={
          <ButtonBar>
            <Button size="sm">초기화</Button>
            <Button size="sm" variant="pri">
              조회
            </Button>
          </ButtonBar>
        }
      >
        <div className="grid grid-cols-[84px_minmax(0,1fr)] lg:grid-cols-[84px_minmax(0,1fr)_84px_minmax(0,1fr)_84px_minmax(0,1fr)]">
          <FormRow label="감정번호">
            <Field variant="mono" defaultValue="00001-25-" aria-label="감정번호" />
          </FormRow>
          <FormRow label="문서번호">
            <Field aria-label="문서번호" />
          </FormRow>
          <FormRow label="사건명">
            <Field variant="select" defaultValue="전체" aria-label="사건명" />
          </FormRow>
          <FormRow label="등록일자">
            <Field variant="mono-sm" defaultValue="2025-06-25 ~ 2025-07-24" aria-label="등록일자" />
          </FormRow>
          <FormRow label="피해자">
            <Field aria-label="피해자" />
          </FormRow>
          <FormRow label="검거여부">
            <Field variant="select" defaultValue="전체" aria-label="검거여부" />
          </FormRow>
          <FormRow label="처리관서">
            <span className="flex w-full gap-[4px]">
              <Field defaultValue="경찰청" aria-label="처리관서" />
              <Button size="sm-h26">검색</Button>
            </span>
          </FormRow>
          <FormRow label="의뢰관서">
            <span className="flex w-full gap-[4px]">
              <Field aria-label="의뢰관서" />
              <Button size="sm-h26">검색</Button>
            </span>
          </FormRow>
          <FormRow label="보는 사람">
            <Chip variant="blue">감정관</Chip>
          </FormRow>
        </div>
      </Panel>
    </section>
  );
}

/**
 * S02 조립 예시(R37): 시안 S02 등록 모달의 머리 띠(제목 + 오른쪽 ButtonBar `modal-head`)와
 * 채취 방법 한 줄(Field `select-warn` + 「확인 필요」 Chip + AiTag 「AI 제안」)을 부품으로 다시 그린 것.
 */
function S02Assembly() {
  return (
    <section aria-labelledby="s02-assembly-title" className="mt-6 flex flex-col gap-2">
      <h2 id="s02-assembly-title" className="text-[13px] font-semibold text-muted-foreground">
        S02 조립 예시
      </h2>
      <div className="min-w-0 rounded-[14px] border border-solid border-border bg-panel">
        <div className="flex min-w-0 items-center gap-[10px] border-b-line-2 bg-panel-2 px-[14px] py-[10px] [border-style:none_none_solid] [border-width:0_0_1px]">
          <h3 className="border-none text-[13px] font-semibold">사건 등록</h3>
          <ButtonBar variant="modal-head">
            <Button size="sm">이전</Button>
            <Button size="sm">다음</Button>
            <Button size="sm">사건복사</Button>
            <Button size="sm" roleLock>
              수정
            </Button>
            <Button size="sm">닫기</Button>
            <Button size="sm" variant="pri">
              검색 (문양 상세보기) →
            </Button>
          </ButtonBar>
        </div>
        <div className="grid grid-cols-[84px_minmax(0,1fr)]">
          <FormRow label="채취 방법">
            <span className="flex w-full min-w-0 items-center gap-[6px]">
              <Field
                variant="select-warn"
                defaultValue="기타"
                after={<Chip variant="amber-h18">확인 필요</Chip>}
                aria-label="채취 방법"
              />
              <AiTag>AI 제안</AiTag>
            </span>
          </FormRow>
        </div>
      </div>
    </section>
  );
}

interface FixtureBoxProps {
  fixture: PartFixture;
}

function FixtureBox({ fixture }: FixtureBoxProps) {
  const label = [fixture.id, fixture.part, fixture.variant, fixture.state].filter(Boolean).join(" · ");
  return (
    <section data-fixture-id={fixture.id} className="flex flex-col gap-2">
      <h2 className="font-code text-[11px] text-muted-foreground">{label}</h2>
      {/* 부모 폭은 예시마다 다른 데이터 값이라 인라인 width 로 준다(위치값 예외). */}
      <div
        className={[SURFACE_CLASS[fixture.surface ?? "canvas"], fixture.boxClass].filter(Boolean).join(" ")}
        style={{ width: fixture.parentWidth }}
      >
        {FIXTURE_RENDERS[fixture.id]?.()}
      </div>
    </section>
  );
}
