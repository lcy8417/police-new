import { useSearchParams } from "react-router-dom";

import { FIXTURE_RENDERS } from "./fixtures";
import { PART_FIXTURES, type FixtureSurface, type PartFixture } from "./fixtures-meta";

// 상자 바탕 토큰 클래스(R12). 시안 요소의 가장 가까운 불투명 조상 배경에 대응한다.
const SURFACE_CLASS: Record<FixtureSurface, string> = {
  canvas: "bg-canvas",
  panel: "bg-panel",
  "panel-2": "bg-panel-2",
  "panel-3": "bg-panel-3",
  strip: "bg-strip",
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
    </main>
  );
}

interface FixtureBoxProps {
  fixture: PartFixture;
}

function FixtureBox({ fixture }: FixtureBoxProps) {
  const label = [fixture.id, fixture.part, fixture.variant, fixture.state].filter(Boolean).join(" · ");
  return (
    <section data-fixture-id={fixture.id} className="flex flex-col gap-2">
      <h2 className="font-mono text-[11px] text-muted-foreground">{label}</h2>
      {/* 부모 폭은 예시마다 다른 데이터 값이라 인라인 width 로 준다(위치값 예외). */}
      <div
        className={SURFACE_CLASS[fixture.surface ?? "canvas"]}
        style={{ width: fixture.parentWidth }}
      >
        {FIXTURE_RENDERS[fixture.id]?.()}
      </div>
    </section>
  );
}
