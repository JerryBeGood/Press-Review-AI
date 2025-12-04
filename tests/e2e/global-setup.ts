/* eslint-disable no-console */
import { chromium, type FullConfig } from "@playwright/test";
import path from "path";

const AUTH_FILE = path.join(process.cwd(), "tests/e2e/.auth/user.json");

/**
 * Global setup function that runs once before all tests.
 * Authenticates and saves the session state for reuse across tests.
 */
async function globalSetup(config: FullConfig) {
  console.log("🔐 Running global setup: authenticating test user...");

  // Verify environment variables are loaded
  const username = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;

  const { baseURL } = config.projects[0].use;

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login page and wait for it to be fully loaded
    await page.goto(`${baseURL}/login`, { waitUntil: "networkidle" });

    await page.screenshot({ path: path.join(process.cwd(), "tests/e2e/test-results/login-page.png"), fullPage: true });

    // Wait for the form to be interactive (React hydration)
    const emailInput = page.getByTestId("login-email-input");
    const passwordInput = page.getByTestId("login-password-input");

    await emailInput.waitFor({ state: "visible", timeout: 10000 });

    // Fill in credentials using click + fill pattern for better reliability
    await emailInput.click();
    // @ts-expect-error it is acceptable for e2e tests
    await emailInput.fill(username);

    await passwordInput.click();
    // @ts-expect-error it is acceptable for e2e tests
    await passwordInput.fill(password);

    await page.screenshot({
      path: path.join(process.cwd(), "tests/e2e/test-results/login-page-filled.png"),
      fullPage: true,
    });

    // Click sign in
    await page.getByRole("button", { name: "SIGN IN" }).click();

    // Wait for navigation to dashboard (confirms successful login)
    await page.waitForURL("**/dashboard**", { waitUntil: "networkidle" });

    await page.screenshot({
      path: path.join(process.cwd(), "tests/e2e/test-results/dashboard-page.png"),
      fullPage: true,
    });

    console.log("✅ Successfully authenticated, saving session state...");

    // Save the authentication state
    await context.storageState({ path: AUTH_FILE });

    console.log(`✅ Session state saved to ${AUTH_FILE}`);
  } catch (error) {
    console.error("❌ Authentication failed:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
