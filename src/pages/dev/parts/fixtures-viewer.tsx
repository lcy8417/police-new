import type { ReactNode } from "react";

import { EvidenceImage, CompareView, HeatOverlay, PatternIcon, PointPairs, SoleThumb, ZoneBands } from "@/shared/ui/viewer";
import { fakePhotoUrl } from "@/pages/dev/screens/mock-assets/FakePhoto";
import { fakeSoleUrl } from "@/pages/dev/screens/mock-assets/FakeSole";

// viewer 출입구 진열 예시를 그리는 쪽(id → 그리기). 데이터는 fixtures-viewer-meta.ts. 컨트롤러가 FIXTURE_RENDERS 에 합친다.
// 부품에는 props 만 넘긴다(className · 손으로 쓴 data-part-* 금지). 그림은 가짜 그림(개발 전용).
const PHOTO = { zones: ["herring", "grid", "tri"] as const };
const PATTERN_SRC = "/src/assets/Patterns/전체/n32_04.png"; // 소비 측이 붙인 경로를 그대로 받는다

export const VIEWER_FIXTURE_RENDERS: Record<string, () => ReactNode> = {
  // r2 — HeatOverlay: 밑창 그림 위에 얹는 모양(가짜 밑창 위)
  "S06-41": () => (
    <>
      <img src={fakeSoleUrl({ kind: "shoe", zones: [...PHOTO.zones] })} alt="밑창(가짜)" className="block size-full" />
      <HeatOverlay partId="S06-41" className="absolute inset-0" />
    </>
  ),
  "S01-45": () => (
    <>
      <img src={fakeSoleUrl({ kind: "shoe", zones: [...PHOTO.zones] })} alt="밑창(가짜)" className="block size-full" />
      <HeatOverlay variant="spots" partId="S01-45" className="absolute inset-0" />
    </>
  ),
  "S05-31": () => (
    <EvidenceImage
      src={fakePhotoUrl({ zones: [...PHOTO.zones], rotate: 0 })}
      alt="현장 족적(가짜)"
      tag="1"
      caption="00001-25-0646_1"
      partId="S05-31"
    />
  ),
  "S05-32": () => (
    <EvidenceImage
      src={fakePhotoUrl({ zones: [...PHOTO.zones], rotate: 0, tag: "" })}
      alt="현장 족적 이진화(가짜)"
      look="binary"
      partId="S05-32"
    />
  ),
  "S01-31": () => <SoleThumb src={fakeSoleUrl({ kind: "scene" })} alt="현장 족적 작은 그림" partId="S01-31" />,
  "S04-31": () => <PatternIcon name="n21_20" src="/src/assets/Patterns/전체/n21_20.png" partId="S04-31" />,
  "S04-32": () => <PatternIcon name="n32_04" src={PATTERN_SRC} selected partId="S04-32" />,
  "S04-33": () => (
    <ZoneBands
      partId="S04-33"
      zones={[
        { key: "top", label: "상", from: 0, to: 0.35 },
        { key: "mid", label: "중", from: 0.35, to: 0.67 },
        { key: "bottom", label: "하", from: 0.67, to: 1 },
      ]}
    />
  ),
  "S06-31": () => (
    <CompareView
      mode="side"
      leftLabel="현장 족적"
      rightLabel="등록 신발"
      left={<img src={fakePhotoUrl({ zones: [...PHOTO.zones] })} alt="현장(가짜)" className="block w-full" />}
      right={<img src={fakeSoleUrl({ kind: "shoe", zones: [...PHOTO.zones] })} alt="밑창(가짜)" className="block w-full" />}
      partId="S06-31"
    />
  ),
  "S06-32": () => (
    <CompareView
      mode="slide"
      leftLabel="현장 족적"
      rightLabel="등록 신발"
      left={<img src={fakePhotoUrl({ zones: [...PHOTO.zones] })} alt="현장(가짜)" className="block w-full" />}
      right={<img src={fakeSoleUrl({ kind: "shoe", zones: [...PHOTO.zones] })} alt="밑창(가짜)" className="block w-full" />}
      partId="S06-32"
    />
  ),
  "S06-33": () => (
    <PointPairs
      side="crime"
      activeIndex={1}
      width={200}
      height={300}
      partId="S06-33"
      boxes={[
        { cx: 60, cy: 70, size: 48 },
        { cx: 130, cy: 150, size: 48 },
        { cx: 80, cy: 240, size: 48 },
      ]}
    />
  ),
};
