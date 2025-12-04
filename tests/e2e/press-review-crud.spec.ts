import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/db/database.types";
import { DashboardPage } from "./poms/DashboardPage";
import path from "path";

test.describe("Press Review Management (CRUD)", () => {
  let dashboardPage: DashboardPage;

  // Generate unique topic for each test run to avoid conflicts
  const generateUniqueTopic = (prefix: string) => `${prefix} - ${Date.now()}`;

  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  const supabase = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

  test.beforeEach(async ({ page }) => {
    await supabase.from("press_reviews").delete().eq("user_id", process.env.E2E_USER_ID!).select();

    await page.goto("/dashboard", { waitUntil: "networkidle" });

    await page.screenshot({
      path: path.join(process.cwd(), "tests/e2e/test-results/dashboard-page-after-cleanup.png"),
      fullPage: true,
    });

    dashboardPage = new DashboardPage(page);
    await dashboardPage.waitForLoad();
  });

  test.afterAll(async () => {
    await supabase.auth.signOut();
  });

  test.beforeAll(async () => {
    await supabase.auth.signInWithPassword({
      email: process.env.E2E_USERNAME!,
      password: process.env.E2E_PASSWORD!,
    });
  });

  test.describe("CREATE", () => {
    test("should create a new press review with daily schedule", async () => {
      const topic = generateUniqueTopic("Daily AI News");

      // Act
      await dashboardPage.createPressReview({
        topic,
        schedule: "daily",
        time: 9,
      });

      // Assert
      const listItem = dashboardPage.getListItem(topic);
      await expect(listItem.listItem).toBeVisible();
      await expect(await listItem.getSchedule()).toContain("Daily at 9:00 AM");
    });

    test("should create a new press review with weekly schedule", async () => {
      const topic = generateUniqueTopic("Weekly Tech Digest");

      // Act
      await dashboardPage.createPressReview({
        topic,
        schedule: "weekly",
        dayOfWeek: "Monday",
        time: 10,
      });

      // Assert
      const listItem = dashboardPage.getListItem(topic);
      await expect(listItem.listItem).toBeVisible();
      await expect(await listItem.getSchedule()).toContain("Every Monday at 10:00 AM");
    });

    test("should create a new press review with monthly schedule", async () => {
      const topic = generateUniqueTopic("Monthly Report");

      // Act
      await dashboardPage.createPressReview({
        topic,
        schedule: "monthly",
        dayOfMonth: 1,
        time: 8,
      });

      // Assert
      const listItem = dashboardPage.getListItem(topic);
      await expect(listItem.listItem).toBeVisible();
      await expect(await listItem.getSchedule()).toContain("Monthly on the 1st at 8:00 AM");
    });
  });

  test.describe("READ", () => {
    test("should display empty state when no press reviews exist", async ({ page }) => {
      // After cleanup, the database should be empty
      await expect(dashboardPage.emptyState).toBeVisible();
      await expect(page.getByText("No scheduled press reviews")).toBeVisible();
    });

    test("should display press review list after creating items", async () => {
      const topic = generateUniqueTopic("Readable Topic");

      // Arrange - create a press review
      await dashboardPage.createPressReview({ topic, schedule: "daily", time: 12 });

      // Assert - list is visible
      await expect(dashboardPage.pressReviewList).toBeVisible();
      const listItem = dashboardPage.getListItem(topic);
      await expect(listItem.listItem).toBeVisible();
    });
  });

  test.describe("UPDATE", () => {
    test("should update press review topic", async () => {
      const originalTopic = generateUniqueTopic("Original Topic");
      const updatedTopic = generateUniqueTopic("Updated Topic");

      // Arrange - create a press review
      await dashboardPage.createPressReview({ topic: originalTopic, schedule: "daily", time: 14 });
      const listItem = dashboardPage.getListItem(originalTopic);
      await expect(listItem.listItem).toBeVisible();

      // Act - open edit dialog and update topic
      await listItem.clickEdit();
      await expect(dashboardPage.formDialog.dialog).toBeVisible();
      await dashboardPage.formDialog.fillTopic(updatedTopic);
      await dashboardPage.formDialog.submit();

      // Assert - old topic gone, new topic visible
      await expect(dashboardPage.formDialog.dialog).not.toBeVisible();
      await expect(listItem.listItem).not.toBeVisible();
      const updatedItem = dashboardPage.getListItem(updatedTopic);
      await expect(updatedItem.listItem).toBeVisible();
    });

    test("should update press review schedule from daily to weekly", async () => {
      const topic = generateUniqueTopic("Schedule Update Test");

      // Arrange - create a daily press review
      await dashboardPage.createPressReview({ topic, schedule: "daily", time: 9 });
      const listItem = dashboardPage.getListItem(topic);
      await expect(await listItem.getSchedule()).toContain("Daily");

      // Act - update to weekly
      await listItem.clickEdit();
      await dashboardPage.formDialog.selectSchedule("weekly");
      await dashboardPage.formDialog.selectDayOfWeek("Friday");
      await dashboardPage.formDialog.selectTime(16);
      await dashboardPage.formDialog.submit();

      // Assert
      await expect(dashboardPage.formDialog.dialog).not.toBeVisible();
      await expect(await listItem.getSchedule()).toContain("Every Friday at 4:00 PM");
    });

    test("should cancel edit without saving changes", async () => {
      const topic = generateUniqueTopic("Cancel Edit Test");

      // Arrange
      await dashboardPage.createPressReview({ topic, schedule: "daily", time: 11 });
      const listItem = dashboardPage.getListItem(topic);

      // Act - open dialog, modify, then cancel
      await listItem.clickEdit();
      await dashboardPage.formDialog.fillTopic("This should not be saved");
      await dashboardPage.formDialog.cancel();

      // Assert - original topic still visible
      await expect(dashboardPage.formDialog.dialog).not.toBeVisible();
      await expect(listItem.listItem).toBeVisible();
    });
  });

  test.describe("DELETE", () => {
    test("should delete a press review after confirmation", async () => {
      const topic = generateUniqueTopic("To Be Deleted");

      // Arrange
      await dashboardPage.createPressReview({ topic, schedule: "daily", time: 15 });
      const listItem = dashboardPage.getListItem(topic);
      await expect(listItem.listItem).toBeVisible();

      // Act
      await listItem.clickDelete();
      await expect(dashboardPage.deleteDialog.dialog).toBeVisible();
      await dashboardPage.deleteDialog.confirm();

      // Assert
      await expect(dashboardPage.deleteDialog.dialog).not.toBeVisible();
      await expect(listItem.listItem).not.toBeVisible();
    });

    test("should cancel deletion and keep the press review", async () => {
      const topic = generateUniqueTopic("Should Not Be Deleted");

      // Arrange
      await dashboardPage.createPressReview({ topic, schedule: "daily", time: 17 });
      const listItem = dashboardPage.getListItem(topic);

      // Act - open delete dialog and cancel
      await listItem.clickDelete();
      await expect(dashboardPage.deleteDialog.dialog).toBeVisible();
      await dashboardPage.deleteDialog.cancel();

      // Assert - item still exists
      await expect(dashboardPage.deleteDialog.dialog).not.toBeVisible();
      await expect(listItem.listItem).toBeVisible();
    });
  });

  test.describe("Full CRUD Flow", () => {
    test("should complete full lifecycle: create → read → update → delete", async () => {
      const initialTopic = generateUniqueTopic("Full CRUD Test");
      const updatedTopic = generateUniqueTopic("Full CRUD Updated");

      // CREATE
      await dashboardPage.createPressReview({
        topic: initialTopic,
        schedule: "weekly",
        dayOfWeek: "Tuesday",
        time: 10,
      });

      const listItem = dashboardPage.getListItem(initialTopic);
      await expect(listItem.listItem).toBeVisible();
      await expect(await listItem.getSchedule()).toContain("Every Tuesday at 10:00 AM");

      // READ - verify list contains the item
      await expect(dashboardPage.pressReviewList).toBeVisible();

      // UPDATE
      await listItem.clickEdit();
      await dashboardPage.formDialog.fillTopic(updatedTopic);
      await dashboardPage.formDialog.selectSchedule("monthly");
      await dashboardPage.formDialog.selectDayOfMonth(15);
      await dashboardPage.formDialog.selectTime(14);
      await dashboardPage.formDialog.submit();

      await expect(dashboardPage.formDialog.dialog).not.toBeVisible();
      const updatedItem = dashboardPage.getListItem(updatedTopic);
      await expect(updatedItem.listItem).toBeVisible();
      await expect(await updatedItem.getSchedule()).toContain("Monthly on the 15th at 2:00 PM");

      // DELETE
      await updatedItem.clickDelete();
      await dashboardPage.deleteDialog.confirm();

      await expect(dashboardPage.deleteDialog.dialog).not.toBeVisible();
      await expect(updatedItem.listItem).not.toBeVisible();
    });
  });
});
