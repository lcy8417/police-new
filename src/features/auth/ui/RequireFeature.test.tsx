import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { FEATURES, type SessionUser } from "@/entities/session";
import { useSessionStore } from "../model/session-store";
import { RequireFeature } from "./RequireFeature";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
}

const user = (features: SessionUser["features"]): SessionUser => ({
  userId: "kim01",
  userNm: "김수사",
  userSe: "USER",
  features,
  passwordChangeRequired: false,
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/crimeRegister"
          element={
            <RequireFeature code={FEATURES.CRIME_REGISTER}>
              <p>사건 등록 화면</p>
            </RequireFeature>
          }
        />
        <Route
          path="/search/*"
          element={
            <RequireFeature code={FEATURES.CRIME_SEARCH}>
              <p>사건 조회 화면</p>
            </RequireFeature>
          }
        />
        <Route
          path="/cases"
          element={
            <RequireFeature anyOf={[FEATURES.CASE_STATUS_VIEW, FEATURES.CRIME_SEARCH, FEATURES.EXAM_VIEW, FEATURES.SHOE_VIEW]}>
              <p>사건관리 화면</p>
            </RequireFeature>
          }
        />
      </Routes>
      <LocationProbe />
    </MemoryRouter>
  );
}

beforeEach(() => vi.mocked(toast.error).mockClear());
afterEach(() => useSessionStore.setState({ user: null, status: "loading" }));

describe("RequireFeature — 기능 권한 가드", () => {
  it("권한이 있으면 화면을 보여 준다", () => {
    useSessionStore.getState().setUser(user([FEATURES.CRIME_SEARCH]));
    renderAt("/search/abc");
    expect(screen.getByText("사건 조회 화면")).toBeInTheDocument();
  });

  it("RequireFeature redirects", async () => {
    useSessionStore.getState().setUser(user([FEATURES.CRIME_REGISTER]));
    renderAt("/search");

    expect(await screen.findByText("사건 등록 화면")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/crimeRegister$/);
    expect(screen.queryByText("사건 조회 화면")).not.toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith("접근 권한이 없습니다", expect.anything());
  });

  it("anyOf — 여러 권한 중 하나만 있어도 들어간다(신발 분업 담당 · 보기 전용 검증자)", () => {
    useSessionStore.getState().setUser(user([FEATURES.SHOE_VIEW, FEATURES.SHOE_PATTERN]));
    renderAt("/cases?shoe=1");
    expect(screen.getByText("사건관리 화면")).toBeInTheDocument();
  });

  it("anyOf — 하나도 없으면 허용된 첫 화면으로", async () => {
    useSessionStore.getState().setUser(user([FEATURES.CRIME_REGISTER]));
    renderAt("/cases");
    expect(await screen.findByText("사건 등록 화면")).toBeInTheDocument();
    expect(screen.queryByText("사건관리 화면")).not.toBeInTheDocument();
  });

  it("no-feature user sees notice", () => {
    useSessionStore.getState().setUser(user([]));
    renderAt("/search");

    expect(screen.getByText("권한이 없습니다. 관리자에게 문의하세요")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "로그아웃" })).toBeInTheDocument();
    expect(screen.queryByText("사건 조회 화면")).not.toBeInTheDocument();
  });
});
