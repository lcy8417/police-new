import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { logout } from "@/entities/session";
import { setBrowserNavigation } from "../model/browser-navigation";
import { NoPermissionNotice } from "./NoPermissionNotice";

vi.mock("@/entities/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/session")>()),
  logout: vi.fn(),
}));

afterEach(() => {
  setBrowserNavigation(null);
  vi.mocked(logout).mockReset();
});

describe("NoPermissionNotice — 허용된 화면이 하나도 없을 때", () => {
  it("안내 문구와 로그아웃 — 로그아웃이 실패해도 /login으로 전체 새로고침", async () => {
    const assign = vi.fn();
    setBrowserNavigation({ assign, reload: vi.fn() });
    vi.mocked(logout).mockRejectedValue(new Error("network"));

    render(<NoPermissionNotice />);
    expect(screen.getByText("권한이 없습니다. 관리자에게 문의하세요")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "로그아웃" }));

    await waitFor(() => expect(assign).toHaveBeenCalledWith("/login"));
    expect(assign).toHaveBeenCalledTimes(1);
    expect(logout).toHaveBeenCalledTimes(1);
  });
});
