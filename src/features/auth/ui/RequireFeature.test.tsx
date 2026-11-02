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

  it("no-feature user sees notice", () => {
    useSessionStore.getState().setUser(user([]));
    renderAt("/search");

    expect(screen.getByText("권한이 없습니다. 관리자에게 문의하세요")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "로그아웃" })).toBeInTheDocument();
    expect(screen.queryByText("사건 조회 화면")).not.toBeInTheDocument();
  });
});
