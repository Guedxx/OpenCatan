import { expect, test, type APIRequestContext, type Browser, type Page } from "@playwright/test";

const BACKEND_HEALTH_URL = "http://localhost:8000/health";

test("main menu loads", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#screen-main")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Open Catan" })).toBeVisible();
  await expect(page.locator("#btn-menu-multiplayer")).toBeVisible();
  await expect(page.locator("#btn-menu-singleplayer")).toBeVisible();
});

test("multiplayer lobby can create, join, ready and start a game", async ({
  browser,
  page: hostPage,
  request,
}) => {
  await expectBackendRunning(request);

  await hostPage.goto("/");
  await createRoom(hostPage, "Host E2E");
  const roomCode = await hostPage.locator("#mp-lobby-host-code").innerText();
  expect(roomCode).toMatch(/^[A-Z0-9]{6,}$/);

  const guestPage = await newPage(browser);
  await guestPage.goto("/");
  await joinRoom(guestPage, roomCode, "Guest E2E");
  await expect(guestPage.locator("#screen-mp-lobby-guest")).toBeVisible();
  await expect(guestPage.locator("#mp-lobby-guest-code")).toHaveText(roomCode);

  await guestPage.locator("#btn-lobby-guest-ready").click();
  await expect(guestPage.locator("#btn-lobby-guest-ready")).toHaveText("Unready");

  const startButton = hostPage.locator("#btn-lobby-host-start");
  await expect(startButton).toBeEnabled();
  await startButton.click();

  await expect(hostPage.locator("#menu-root")).toHaveClass(/hidden/);
  await expect(hostPage.locator("#canvas-container canvas")).toBeVisible();

  await guestPage.close();
});

test("joining an unknown room shows the backend rejection", async ({ page, request }) => {
  await expectBackendRunning(request);

  await page.goto("/");
  await page.locator("#btn-menu-multiplayer").click();
  await page.locator("#btn-mp-join").click();
  await page.locator("#mp-join-code").fill("NOPE42");
  await page.locator("#mp-join-name").fill("Guest E2E");
  await page.locator("#btn-mp-join-go").click();

  await expect(page.locator("#toast-container")).toContainText("Room not found");
});

async function expectBackendRunning(request: APIRequestContext): Promise<void> {
  const response = await request.get(BACKEND_HEALTH_URL, {
    failOnStatusCode: false,
  });
  expect(
    response.ok(),
    `Backend must be running at ${BACKEND_HEALTH_URL} before E2E tests. ` +
      "Start it from back/ with: uvicorn catan.api.main:app --reload --host 0.0.0.0 --port 8000",
  ).toBe(true);
}

async function createRoom(page: Page, name: string): Promise<void> {
  await page.locator("#btn-menu-multiplayer").click();
  await page.locator("#btn-mp-create").click();
  await page.locator("#mp-create-name").fill(name);
  await page.locator("#mp-create-color").selectOption("red");
  await page.locator("#btn-mp-create-go").click();
  await expect(page.locator("#screen-mp-lobby-host")).toBeVisible();
  await expect(page.locator("#mp-lobby-host-code")).not.toHaveText("------");
}

async function joinRoom(page: Page, roomCode: string, name: string): Promise<void> {
  await page.locator("#btn-menu-multiplayer").click();
  await page.locator("#btn-mp-join").click();
  await page.locator("#mp-join-code").fill(roomCode);
  await page.locator("#mp-join-name").fill(name);
  await page.locator("#mp-join-color").selectOption("blue");
  await page.locator("#btn-mp-join-go").click();
}

async function newPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext();
  return context.newPage();
}
