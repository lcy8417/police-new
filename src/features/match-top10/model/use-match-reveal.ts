/**
 * SPEC-MATCH-TOP10-001 v0.6.0 CHANGE 4(REQ-MATCH-015 계열): 매칭 결과가 도착한 뒤
 * 재생하는 시각화 애니메이션의 상태 기계.
 *
 * [HARD] 순수 표현 계층 — 이 훅은 `matches` 배열을 절대 읽거나 변형하지 않으며,
 * 백엔드를 호출하지 않는다(추가 호출 0, REQ-MATCH-015a). 오직 CSS 트랜지션/
 * `requestAnimationFrame`으로 소비될 **연출 단계(phase)** 와 **몇 개까지 드러났는지
 * (revealedCount)** 만 관리한다. 실제 결과 데이터는 항상 호출자가 이미 들고 있다.
 *
 * [HARD] 비차단(REQ-MATCH-015b) — `skip()`은 즉시 done 단계로 전환해 전체 결과에
 * 도달시킨다. `prefers-reduced-motion: reduce`가 감지되면 애니메이션을 재생하지
 * 않고 마운트 즉시 done으로 시작한다(REQ-MATCH-015c).
 */
import { useEffect, useMemo, useRef, useState } from "react";

/** 연출 단계 — 겹침 → 분리 → 스윕 → 순차 출현 → 완료(REQ-MATCH-015 ①~④). */
export type RevealPhase = "overlap" | "separating" | "sweeping" | "revealing" | "done";

/** 단계별 지속 시간(ms) — 튜닝 가능한 연출 값(계약값 아님). */
const PHASE_DURATIONS: Record<Exclude<RevealPhase, "revealing" | "done">, number> = {
  overlap: 500,
  separating: 500,
  sweeping: 700,
};
/** "revealing" 단계에서 카드 1건이 드러나는 간격(ms). */
const REVEAL_STEP_MS = 120;

export interface UseMatchRevealParams {
  /** 표출할 매칭 결과 개수(top-10, 최대 10) — 이 값 자체가 매칭 데이터를 바꾸지 않는다. */
  matchCount: number;
  /** 애니메이션을 재생할지 여부(예: 결과가 아직 없거나 게이트 오류 상태면 false). */
  enabled: boolean;
  /** 테스트 주입용 — 생략 시 `prefers-reduced-motion: reduce` 미디어 쿼리로 자동 판정. */
  prefersReducedMotion?: boolean;
}

export interface UseMatchReveal {
  phase: RevealPhase;
  /** 지금까지 드러난 카드 수(0..matchCount) — "revealing" 단계에서 순차 증가한다. */
  revealedCount: number;
  /** 애니메이션이 아직 진행 중인지(phase !== "done"). */
  isAnimating: boolean;
  /** 즉시 done으로 전환해 전체 결과에 도달한다(스킵, 비차단 REQ-MATCH-015b). */
  skip: () => void;
}

function detectPrefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function useMatchReveal({
  matchCount,
  enabled,
  prefersReducedMotion,
}: UseMatchRevealParams): UseMatchReveal {
  const reducedMotion = useMemo(
    () => prefersReducedMotion ?? detectPrefersReducedMotion(),
    [prefersReducedMotion]
  );

  const [phase, setPhase] = useState<RevealPhase>(() =>
    !enabled || reducedMotion ? "done" : "overlap"
  );
  const [revealedCount, setRevealedCount] = useState<number>(() =>
    !enabled || reducedMotion ? matchCount : 0
  );
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];
  };

  const skip = () => {
    clearTimers();
    setPhase("done");
    setRevealedCount(matchCount);
  };

  useEffect(() => {
    clearTimers();

    if (!enabled) {
      setPhase("done");
      setRevealedCount(matchCount);
      return clearTimers;
    }

    if (reducedMotion) {
      // REQ-MATCH-015c: 모션 감소 선호 시 연출을 생략하고 결과를 즉시 표시한다.
      setPhase("done");
      setRevealedCount(matchCount);
      return clearTimers;
    }

    setPhase("overlap");
    setRevealedCount(0);

    let elapsed = 0;
    const schedule = (fn: () => void, delay: number) => {
      elapsed += delay;
      timersRef.current.push(setTimeout(fn, elapsed));
    };

    schedule(() => setPhase("separating"), PHASE_DURATIONS.overlap);
    schedule(() => setPhase("sweeping"), PHASE_DURATIONS.separating);
    schedule(() => setPhase("revealing"), PHASE_DURATIONS.sweeping);

    for (let i = 1; i <= matchCount; i += 1) {
      schedule(() => setRevealedCount(i), i === 1 ? REVEAL_STEP_MS : REVEAL_STEP_MS);
    }
    schedule(() => setPhase("done"), matchCount > 0 ? 0 : REVEAL_STEP_MS);

    return clearTimers;
  }, [enabled, reducedMotion, matchCount]);

  useEffect(() => clearTimers, []);

  return {
    phase,
    revealedCount,
    isAnimating: phase !== "done",
    skip,
  };
}
