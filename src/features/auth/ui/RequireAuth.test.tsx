import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { FEATURES, type SessionUser } from "@/entities/session";
import { useSessionStore } from "../model/session-store";
import { RequireAuth } from "./RequireAuth";

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
}

const USER: SessionUser = {
  userId: "kim01",
  userNm: "김수사",
  userSe: "USER",
  features: [FEATURES.CRIME_SEARCH],
  passwordChangeRequired: false,
};

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<p>로그인 화면</p>} />
        <Route
          path="/password"
          element={
            <RequireAuth>
              <p>비밀번호 변경 화면</p>
            </RequireAuth>
          }
        />
        <Route
          path="/search/*"
          element={
            <RequireAuth>
              <p>사건 조회 화면</p>
            </RequireAuth>
          }
        />
      </Routes>
      <LocationProbe />
    </MemoryRouter>
  );
}

afterEach(() => useSessionStore.setState({ user: null, status: "loading" }));

describe("RequireAuth — 로그인 가드", () => {
  it("세션 확인 중이면 전체 화면 로딩", () => {
    renderAt("/search");
    expect(screen.getByRole("status")).toHaveTextContent("세션 확인 중");
    expect(screen.queryByText("사건 조회 화면")).not.toBeInTheDocument();
  });

  it("로그인 전이면 원래 주소를 from에 담아 로그인 화면으로", () => {
    useSessionStore.getState().clear();
    renderAt("/search/abc?mode=search");
    expect(screen.getByText("로그인 화면")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(
      `/login?from=${encodeURIComponent("/search/abc?mode=search")}`
    );
  });

  it("비밀번호 변경이 필요하면 /password로(그 화면 자체는 열림)", () => {
    useSessionStore.getState().setUser({ ...USER, passwordChangeRequired: true });
    renderAt("/search");
    expect(screen.getByText("비밀번호 변경 화면")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/password$/);
  });

  it("로그인 상태면 보호 화면 루트로 감싸 보여 준다", () => {
    useSessionStore.getState().setUser(USER);
    renderAt("/search");
    const content = screen.getByText("사건 조회 화면");
    expect(content.closest("[data-protected-root]")).not.toBeNull();
  });
});
