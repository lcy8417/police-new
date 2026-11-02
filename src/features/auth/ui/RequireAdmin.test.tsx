import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { FEATURES, type SessionUser } from "@/entities/session";
import { useSessionStore } from "../model/session-store";
import { RequireAdmin } from "./RequireAdmin";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

const user = (extra: Partial<SessionUser>): SessionUser => ({
  userId: "kim01",
  userNm: "김수사",
  userSe: "USER",
  features: [FEATURES.CRIME_SEARCH],
  passwordChangeRequired: false,
  ...extra,
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/search" element={<p>사건 조회 화면</p>} />
        <Route
          path="/manage/*"
          element={
            <RequireAdmin>
              <p>사용자 관리 화면</p>
            </RequireAdmin>
          }
        />
      </Routes>
      <LocationProbe />
    </MemoryRouter>
  );
}

afterEach(() => useSessionStore.setState({ user: null, status: "loading" }));

describe("RequireAdmin — 관리자 전용 가드", () => {
  it("admin passes RequireAdmin", () => {
    useSessionStore.getState().setUser(user({ userSe: "ADMIN", features: [] }));
    renderAt("/manage/users");
    expect(screen.getByText("사용자 관리 화면")).toBeInTheDocument();
  });

  it("user blocked from /manage/users", async () => {
    useSessionStore.getState().setUser(user({}));
    renderAt("/manage/users");

    expect(await screen.findByText("사건 조회 화면")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/search");
    expect(screen.queryByText("사용자 관리 화면")).not.toBeInTheDocument();
  });
});
