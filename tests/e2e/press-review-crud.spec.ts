import { test, expect } from "@playwright/test";
import { DashboardPage } from "./poms/DashboardPage";

// --- Test Data ---
const initialTopic = `E2E Test: The Future of AI - ${Date.now()}`;
const updatedTopic = `E2E Test: The Updated Future of AI - ${Date.now()}`;

const initialSchedule = {
  schedule: "weekly" as const,
  dayOfWeek: "Wednesday",
  time: 14, // 14:00
};

const updatedSchedule = {
  schedule: "monthly" as const,
  dayOfMonth: 15,
  time: 8, // 08:00
};

// --- Test Suite ---
test.describe("Press Review Management (CRUD)", () => {
  let dashboardPage: DashboardPage;

  // Authenticate once before all tests in this suite
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page
    await page.goto("/login");

    // Fill in credentials from .env.test
    const emailInput = page.getByPlaceholder("you@example.com");
    const passwordInput = page.getByPlaceholder("••••••••");

    await emailInput.click();
    await emailInput.clear();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await emailInput.type(process.env.E2E_USERNAME!);

    await passwordInput.click();
    await passwordInput.clear();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await passwordInput.type(process.env.E2E_PASSWORD!);

    // Click the login button
    await page.getByRole("button", { name: "Sign in" }).click();

    // Initialize the Dashboard POM after navigation
    dashboardPage = new DashboardPage(page);

    // Wait for a unique element on the dashboard to confirm successful login
    await expect(dashboardPage.createPressReviewButton).toBeVisible();
  });

  test("should allow a user to create, read, update, and delete a press review", async ({ page }) => {
    // At this point, we are already logged in and on the dashboard.
    // In an empty state, we should see the "No scheduled press reviews" heading.
    await expect(page.getByRole("heading", { name: "No scheduled press reviews" })).toBeVisible();

    // --- CREATE ---
    await dashboardPage.clickCreateNewReview();

    await dashboardPage.page.screenshot({ path: "tests/e2e/test-results/3-dashboard-page-screenshot.png" });
    await expect(dashboardPage.formDialog.dialog).toBeVisible();

    await dashboardPage.formDialog.createPressReview({
      topic: initialTopic,
      schedule: initialSchedule.schedule,
      dayOfWeek: initialSchedule.dayOfWeek,
      time: initialSchedule.time,
    });

    // --- VERIFY CREATION ---
    await expect(dashboardPage.formDialog.dialog).not.toBeVisible();
    const newItem = dashboardPage.getListItem(initialTopic);
    await expect(newItem.listItem).toBeVisible();
    await expect(await newItem.getSchedule()).toContain("Every Wednesday at 2:00 PM");

    // --- UPDATE ---
    await newItem.clickEdit();
    await expect(dashboardPage.formDialog.dialog).toBeVisible();

    // Update the topic and schedule
    await dashboardPage.formDialog.fillTopic(updatedTopic);
    await dashboardPage.formDialog.selectSchedule(updatedSchedule.schedule);
    await dashboardPage.formDialog.selectDayOfMonth(updatedSchedule.dayOfMonth);
    await dashboardPage.formDialog.selectTime(updatedSchedule.time);
    await dashboardPage.formDialog.submit();

    // --- VERIFY UPDATE ---
    await expect(dashboardPage.formDialog.dialog).not.toBeVisible();
    const updatedItem = dashboardPage.getListItem(updatedTopic);
    await expect(updatedItem.listItem).toBeVisible();
    await expect(await updatedItem.getSchedule()).toContain("Monthly on the 15th at 8:00 AM");
    // Verify old item is gone
    await expect(dashboardPage.getListItem(initialTopic).listItem).not.toBeVisible();

    // --- DELETE ---
    await updatedItem.clickDelete();
    await expect(dashboardPage.deleteDialog.dialog).toBeVisible();
    await dashboardPage.deleteDialog.confirm();

    // --- VERIFY DELETION ---
    await expect(dashboardPage.deleteDialog.dialog).not.toBeVisible();
    await expect(updatedItem.listItem).not.toBeVisible();
  });
});
