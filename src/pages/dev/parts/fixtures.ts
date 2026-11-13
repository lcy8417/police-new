import type { ReactNode } from "react";

// 진열 화면(/dev/parts)에 올릴 부품 예시 목록. 시안과 같은 고정 예시(문구 · 부모 폭 · 역할 · 시드)로 그린다(설계서 §9).
// 자동 대조(tests/ui/parts-compare.spec.ts)가 `id` 마다 시안 요소와 이 예시를 비교한다.

/** 진열할 부품 예시 하나. */
export interface PartFixture {
  /** 시안 `data-part-id` 와 같은 값(형식 `S01-03`). 부품 루트에도 같은 값이 붙어야 한다. */
  id: string;
  /** 부품 이름(PascalCase, 시안 `data-part`) */
  part: string;
  /** 변형 이름(시안 `data-part-variant`) */
  variant?: string;
  /** 상태 이름(시안 `data-part-state`) */
  state?: string;
  /** 부품을 담는 상자 폭(px) — 시안에서 그 부품의 부모 폭 */
  parentWidth: number;
  /** 부품을 그린다(루트에 `data-part-id={id}`) */
  render: () => ReactNode;
}

// 부품이 구현되면 여기에 한 줄씩 늘린다(Task 5~). JSX 를 쓰게 되면 파일을 fixtures.tsx 로 바꾼다(가져오는 쪽은 확장자 없이 `./fixtures`).
export const PART_FIXTURES: PartFixture[] = [];
