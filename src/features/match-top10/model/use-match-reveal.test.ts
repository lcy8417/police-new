import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

import { useMatchReveal } from "./use-match-reveal";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("useMatchReveal — 순수 표현 계층(REQ-MATCH-015, HARD 계약)", () => {
  it("enabled=false면 즉시 done 단계로 시작하고 전체 개수가 드러난다(비활성 상태 비차단)", () => {
    const { result } = renderHook(() =>
      useMatchReveal({ matchCount: 5, enabled: false, prefersReducedMotion: false })
    );
    expect(result.current.phase).toBe("done");
    expect(result.current.revealedCount).toBe(5);
    expect(result.current.isAnimating).toBe(false);
  });

  it("prefersReducedMotion=true면 연출 없이 즉시 done + 전체 개수(REQ-MATCH-015c)", () => {
    const { result } = renderHook(() =>
      useMatchReveal({ matchCount: 7, enabled: true, prefersReducedMotion: true })
    );
    expect(result.current.phase).toBe("done");
    expect(result.current.revealedCount).toBe(7);
  });

  it("enabled + 모션 허용 상태에서는 overlap → separating → sweeping → revealing → done 순으로 전이한다", () => {
    const { result } = renderHook(() =>
      useMatchReveal({ matchCount: 3, enabled: true, prefersReducedMotion: false })
    );
    expect(result.current.phase).toBe("overlap");
    expect(result.current.revealedCount).toBe(0);

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.phase).toBe("separating");

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.phase).toBe("sweeping");

    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(result.current.phase).toBe("revealing");

    act(() => {
      vi.advanceTimersByTime(120 * 3);
    });
    expect(result.current.revealedCount).toBe(3);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.phase).toBe("done");
    expect(result.current.isAnimating).toBe(false);
  });

  it("skip()은 즉시 done + 전체 결과 도달을 보장한다(REQ-MATCH-015b 비차단)", () => {
    const { result } = renderHook(() =>
      useMatchReveal({ matchCount: 10, enabled: true, prefersReducedMotion: false })
    );
    expect(result.current.phase).toBe("overlap");

    act(() => result.current.skip());

    expect(result.current.phase).toBe("done");
    expect(result.current.revealedCount).toBe(10);

    // skip 이후 남은 타이머가 진행되어도 상태가 더 바뀌지 않는다(정리됨).
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.phase).toBe("done");
    expect(result.current.revealedCount).toBe(10);
  });

  it("matchCount=0이어도 안전하게 done에 도달한다(빈 결과 엣지 케이스)", () => {
    const { result } = renderHook(() =>
      useMatchReveal({ matchCount: 0, enabled: true, prefersReducedMotion: false })
    );
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.phase).toBe("done");
    expect(result.current.revealedCount).toBe(0);
  });
});
