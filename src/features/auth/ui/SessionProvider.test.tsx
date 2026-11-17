import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { FEATURES, fetchMe, type SessionUser } from "@/entities/session";
import { useCrimeStore } from "@/entities/crime";
import { emitForbidden, setSessionEndedHandler } from "@/shared/api";
import { setBrowserNavigation } from "../model/browser-navigation";
import { useSessionStore } from "../model/session-store";
import { RequireAuth } from "./RequireAuth";
import { RequireFeature } from "./RequireFeature";
import { SessionProvider } from "./SessionProvider";

vi.mock("@/entities/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/session")>()),
  fetchMe: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const fetchMeMock = vi.mocked(fetchMe);

const user = (features: SessionUser["features"], extra: Partial<SessionUser> = {}): SessionUser => ({
  userId: "kim01",
  userNm: "김수사",
  userSe: "USER",
  features,
  passwordChangeRequired: false,
  ...extra,
});

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
}

function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider>
        <Routes>
          <Route path="/login" element={<p>로그인 화면</p>} />
          <Route
            path="/password"
            element={
              <RequireAuth>
                <p>비밀번호 변경 화면</p>
                <Link to="/search">옛 화면 가기</Link>
              </RequireAuth>
            }
          />
          <Route
            path="/crimeRegister"
            element={
              <RequireAuth>
                <RequireFeature code={FEATURES.CRIME_REGISTER}>
                  <p>사건 등록 화면</p>
                </RequireFeature>
              </RequireAuth>
            }
          />
          <Route
            path="/search/*"
            element={
              <RequireAuth>
                <RequireFeature code={FEATURES.CRIME_SEARCH}>
                  <p>사건 조회 화면</p>
                  <Link to="/crimeRegister">등록으로</Link>
                </RequireFeature>
              </RequireAuth>
            }
          />
          {/* 허용된 첫 화면 = 사건관리 /cases(B 단계 0단계 — feature-routes) */}
          <Route
            path="/cases"
            element={
              <RequireAuth>
                <RequireFeature code={FEATURES.CRIME_SEARCH}>
                  <p>사건 조회 화면</p>
                  <Link to="/search">옛 화면으로</Link>
                </RequireFeature>
              </RequireAuth>
            }
          />
        </Routes>
      </SessionProvider>
      <LocationProbe />
    </MemoryRouter>
  );
}

const location = () => screen.getByTestId("location").textContent;

const reload = vi.fn();
const assign = vi.fn();
const sessionEnded = vi.fn<(loginUrl: string) => void>();
const refetch = vi.fn(async () => {});
const reset = vi.fn();
const originalCrimeState = useCrimeStore.getState();

beforeEach(() => {
  fetchMeMock.mockReset();
  reload.mockReset();
  assign.mockReset();
  sessionEnded.mockReset();
  refetch.mockClear();
  reset.mockClear();
  setBrowserNavigation({ reload, assign });
  setSessionEndedHandler(sessionEnded);
  useSessionStore.setState({ user: null, status: "loading" });
  useCrimeStore.setState({ refetch, reset });
});

afterEach(() => {
  setBrowserNavigation(null);
  setSessionEndedHandler(null);
  useCrimeStore.setState(originalCrimeState, true);
});

describe("SessionProvider — 세션 복원", () => {
  it("시작 시 /auth/me로 세션을 복원한다", async () => {
    fetchMeMock.mockResolvedValue(user([FEATURES.CRIME_SEARCH]));
    renderApp("/search");
    expect(await screen.findByText("사건 조회 화면")).toBeInTheDocument();
    expect(useSessionStore.getState().status).toBe("authenticated");
  });

  it("세션이 없으면 원래 주소를 기억해 로그인 화면으로(전체 새로고침 아님)", async () => {
    fetchMeMock.mockResolvedValue(null);
    renderApp("/search/abc");
    expect(await screen.findByText("로그인 화면")).toBeInTheDocument();
    expect(location()).toBe(`/login?from=${encodeURIComponent("/search/abc")}`);
    expect(sessionEnded).not.toHaveBeenCalled();
  });

  it("이미 로그인된 상태로 /login에 오면 첫 화면으로 보낸다(같은 문서에서 다시 로그인 금지)", async () => {
    fetchMeMock.mockResolvedValue(user([FEATURES.CRIME_SEARCH]));
    renderApp("/login");
    expect(await screen.findByText("사건 조회 화면")).toBeInTheDocument();
    expect(location()).toBe("/cases");
  });
});

describe("SessionProvider — 세션 재확인", () => {
  it("refreshes session on focus", async () => {
    fetchMeMock.mockResolvedValue(user([FEATURES.CRIME_REGISTER, FEATURES.CRIME_SEARCH]));
    renderApp("/search");
    await screen.findByText("사건 조회 화면");
    expect(fetchMeMock).toHaveBeenCalledTimes(1);

    // 관리자가 사건 조회 권한을 회수함 → 다른 창을 보다 돌아오는 순간 반영
    fetchMeMock.mockResolvedValue(user([FEATURES.CRIME_REGISTER]));
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });
    expect(fetchMeMock).toHaveBeenCalledTimes(2);

    expect(await screen.findByText("사건 등록 화면")).toBeInTheDocument();
    expect(location()).toBe("/crimeRegister");
    expect(screen.queryByText("사건 조회 화면")).not.toBeInTheDocument();
  });

  it("보호된 화면으로 이동할 때도 재확인한다", async () => {
    fetchMeMock.mockResolvedValue(user([FEATURES.CRIME_REGISTER, FEATURES.CRIME_SEARCH]));
    renderApp("/search");
    await screen.findByText("사건 조회 화면");
    fetchMeMock.mockClear();

    fireEvent.click(screen.getByRole("link", { name: "등록으로" }));

    expect(await screen.findByText("사건 등록 화면")).toBeInTheDocument();
    await waitFor(() => expect(fetchMeMock).toHaveBeenCalledTimes(1));
  });

  it("refreshes once on forbidden", async () => {
    fetchMeMock.mockResolvedValue(user([FEATURES.CRIME_SEARCH]));
    renderApp("/search");
    await screen.findByText("사건 조회 화면");
    fetchMeMock.mockClear();

    act(() => {
      emitForbidden({ status: 403, detail: "권한이 없습니다" });
      emitForbidden({ status: 403, detail: "권한이 없습니다" });
    });

    expect(fetchMeMock).toHaveBeenCalledTimes(1);
    await act(async () => {});
    expect(fetchMeMock).toHaveBeenCalledTimes(1);
  });

  it("403 '비밀번호를 변경해야 합니다'면 /password로", async () => {
    fetchMeMock.mockResolvedValue(user([FEATURES.CRIME_SEARCH]));
    renderApp("/search");
    await screen.findByText("사건 조회 화면");

    fetchMeMock.mockResolvedValue(user([FEATURES.CRIME_SEARCH], { passwordChangeRequired: true }));
    act(() => {
      emitForbidden({ status: 403, detail: "비밀번호를 변경해야 합니다" });
    });

    expect(await screen.findByText("비밀번호 변경 화면")).toBeInTheDocument();
    expect(location()).toBe("/password");
  });

  it("focus-detected expiration reloads", async () => {
    fetchMeMock.mockResolvedValue(user([FEATURES.CRIME_SEARCH]));
    renderApp("/search");
    await screen.findByText("사건 조회 화면");

    fetchMeMock.mockResolvedValue(null);
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });

    await waitFor(() => expect(sessionEnded).toHaveBeenCalledTimes(1));
  });

  it("cross-tab account switch reloads", async () => {
    fetchMeMock.mockResolvedValue(user([FEATURES.CRIME_SEARCH]));
    renderApp("/search");
    await screen.findByText("사건 조회 화면");

    // 다른 탭에서 다른 계정(lee02)으로 로그인 → 같은 쿠키라 /auth/me가 lee02를 돌려줌
    fetchMeMock.mockResolvedValue(user([FEATURES.CRIME_SEARCH, FEATURES.SHOE_VIEW], { userId: "lee02" }));
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });

    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(useSessionStore.getState().user?.userId).toBe("kim01");
    expect(sessionEnded).not.toHaveBeenCalled();
  });
});

describe("SessionProvider — 뒤로 가기 캐시(bfcache)", () => {
  it("bfcache restore reloads", async () => {
    fetchMeMock.mockResolvedValue(user([FEATURES.CRIME_SEARCH]));
    renderApp("/search");
    const content = await screen.findByText("사건 조회 화면");
    const protectedRoot = content.closest("[data-protected-root]");
    expect(protectedRoot).not.toBeNull();

    act(() => {
      window.dispatchEvent(new Event("pagehide"));
    });
    expect(protectedRoot).toHaveClass("invisible");

    const normalShow = new Event("pageshow");
    Object.defineProperty(normalShow, "persisted", { value: false });
    act(() => {
      window.dispatchEvent(normalShow);
    });
    expect(reload).not.toHaveBeenCalled();

    const restored = new Event("pageshow");
    Object.defineProperty(restored, "persisted", { value: true });
    act(() => {
      window.dispatchEvent(restored);
    });
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

describe("SessionProvider — 사건 목록 로딩 자격", () => {
  it("crime list loads only when eligible", async () => {
    const pending = user([FEATURES.CRIME_SEARCH], { passwordChangeRequired: true });
    fetchMeMock.mockResolvedValue(pending);
    renderApp("/password");
    await screen.findByText("비밀번호 변경 화면");
    expect(refetch).not.toHaveBeenCalled();

    // 비밀번호를 바꿔 자격이 생겨도 비밀번호 화면(옛 화면 아님)에서는 부르지 않는다
    act(() => {
      useSessionStore.getState().setUser({ ...pending, passwordChangeRequired: false });
    });
    expect(refetch).not.toHaveBeenCalled();

    // 옛 화면에 들어가면 1회 로딩(이동 때 세션 재확인이 바뀐 사용자를 돌려주게)
    fetchMeMock.mockResolvedValue({ ...pending, passwordChangeRequired: false });
    fireEvent.click(await screen.findByRole("link", { name: "옛 화면 가기" }));
    await waitFor(() => expect(location()).toBe("/search"));
    expect(refetch).toHaveBeenCalledTimes(1);

    // 같은 사용자 정보 재설정(재확인)으로는 다시 부르지 않음
    act(() => {
      useSessionStore.getState().setUser({ ...pending, passwordChangeRequired: false, userNm: "김수사2" });
    });
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(reset).not.toHaveBeenCalled();

    // 사건 조회 권한 회수 → store 비움
    act(() => {
      useSessionStore.getState().setUser({ ...pending, passwordChangeRequired: false, features: [] });
    });
    expect(reset).toHaveBeenCalledTimes(1);
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("로그인 화면에서 로그인해 /cases 로 가면 전체 사건 목록을 부르지 않는다(스모크 4단계 결함)", async () => {
    fetchMeMock.mockResolvedValue(null);
    renderApp("/login");
    await screen.findByText("로그인 화면");
    act(() => {
      useSessionStore.getState().setUser(user([FEATURES.CRIME_SEARCH]));
    });
    await waitFor(() => expect(location()).toBe("/cases"));
    expect(refetch).not.toHaveBeenCalled();
  });

  it("새 사건관리(/cases)에서는 전체 사건 목록을 부르지 않고, 옛 화면에 처음 들어갈 때 1회 부른다(이식 계획 R1)", async () => {
    fetchMeMock.mockResolvedValue(user([FEATURES.CRIME_SEARCH]));
    renderApp("/cases");
    await screen.findByText("사건 조회 화면");
    expect(refetch).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("link", { name: "옛 화면으로" }));
    await waitFor(() => expect(location()).toBe("/search"));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("권한이 없는 사용자는 사건 목록을 부르지 않는다", async () => {
    fetchMeMock.mockResolvedValue(user([FEATURES.CRIME_REGISTER]));
    renderApp("/crimeRegister");
    await screen.findByText("사건 등록 화면");
    expect(refetch).not.toHaveBeenCalled();
  });
});
