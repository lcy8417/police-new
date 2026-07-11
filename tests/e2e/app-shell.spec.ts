import { test, expect } from "@playwright/test";

// The test env has no backend (VITE_API_URL unset), so the app's crime-data
// fetch fails on mount. Treat those network/fetch errors as expected noise;
// only unexpected console errors should fail the test.
const isExpectedNoise = (text: string) =>
  /Failed to fetch|Error fetching crime data|net::ERR|ERR_CONNECTION|VITE_API_URL|Failed to load resource|the server responded with a status/i.test(
    text
  );

test("app-shell persists across route navigation", async ({ page }) => {
  const unexpectedErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" && !isExpectedNoise(msg.text())) {
      unexpectedErrors.push(msg.text());
    }
  });

  await page.goto("/crimeRegister");

  // Shell chrome renders
  const shell = page.getByTestId("app-shell");
  await expect(shell).toBeVisible();
  await expect(page.getByText("경찰청 과학수사")).toBeVisible();
  await expect(page.getByRole("link", { name: "사건 등록" })).toBeVisible();

  // Grab the shell DOM node before a client-side navigation.
  const shellHandle = await shell.elementHandle();
  expect(shellHandle).not.toBeNull();

  // Screenshot for manual visual review against the reference design.
  await page.screenshot({ path: "test-results/app-shell-crimeRegister.png" });

  // Client-side navigate via the sidebar. 신발 등록/조회는 단일 "신발" 탭으로 통합됐다.
  await page.getByRole("link", { name: "신발", exact: true }).click();
  await expect(page).toHaveURL(/shoesRepository/);

  // The very same shell node must still be mounted → shell did not remount.
  const stillConnected = await shellHandle!.evaluate((el) => el.isConnected);
  expect(stillConnected).toBe(true);

  // TopNav brand still present after navigation.
  await expect(page.getByText("경찰청 과학수사")).toBeVisible();

  expect(
    unexpectedErrors,
    `unexpected console errors:\n${unexpectedErrors.join("\n")}`
  ).toEqual([]);
});
