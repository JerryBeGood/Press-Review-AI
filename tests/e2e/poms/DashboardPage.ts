import type { Page, Locator } from "@playwright/test";
import { PressReviewFormDialog } from "./PressReviewFormDialog";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { PressReviewListItem } from "./PressReviewListItem";

/**
 * Page Object Model for the Dashboard page.
 * Provides access to all dashboard elements and actions.
 */
export class DashboardPage {
  readonly page: Page;
  readonly dashboardView: Locator;
  readonly createTopicInput: Locator;
  readonly createPressReviewButton: Locator;
  readonly pressReviewList: Locator;
  readonly emptyState: Locator;
  readonly loadingList: Locator;
  readonly limitWarning: Locator;

  readonly formDialog: PressReviewFormDialog;
  readonly deleteDialog: DeleteConfirmationDialog;

  constructor(page: Page) {
    this.page = page;
    this.dashboardView = page.getByTestId("dashboard-view");
    this.createTopicInput = page.getByTestId("creation-topic-input");
    this.createPressReviewButton = page.getByTestId("creation-submit-button");
    this.pressReviewList = page.getByTestId("press-review-list");
    this.emptyState = page.getByTestId("empty-state");
    this.loadingList = page.getByTestId("loading-list");
    this.limitWarning = page.getByTestId("limit-warning");

    this.formDialog = new PressReviewFormDialog(page);
    this.deleteDialog = new DeleteConfirmationDialog(page);
  }

  /**
   * Navigate to the dashboard page
   */
  async goto(): Promise<void> {
    await this.page.goto("/dashboard");
  }

  /**
   * Click the "Add Review" button to open creation form
   * Note: First need to focus on topic input to reveal schedule fields
   */
  async clickCreateNewReview(): Promise<void> {
    await this.createTopicInput.click();
  }

  /**
   * Create a new press review using the inline creation form
   */
  async createPressReview(options: {
    topic: string;
    schedule?: "daily" | "weekly" | "monthly";
    dayOfWeek?: string;
    dayOfMonth?: number;
    time?: number;
  }): Promise<void> {
    await this.createTopicInput.click();
    await this.createTopicInput.fill(options.topic);

    // Wait for schedule fields to appear
    await this.page.waitForTimeout(300);

    if (options.schedule && options.schedule !== "daily") {
      await this.page.getByTestId("schedule-select-trigger").click();
      await this.page.getByRole("option", { name: new RegExp(options.schedule, "i") }).click();
    }

    if (options.schedule === "weekly" && options.dayOfWeek) {
      await this.page.getByTestId("day-of-week-select-trigger").click();
      await this.page.getByRole("option", { name: options.dayOfWeek }).click();
    }

    if (options.schedule === "monthly" && options.dayOfMonth) {
      await this.page.getByTestId("day-of-month-select-trigger").click();
      await this.page.getByRole("option", { name: String(options.dayOfMonth), exact: true }).click();
    }

    if (options.time !== undefined) {
      const formattedTime = `${String(options.time).padStart(2, "0")}:00`;
      await this.page.getByTestId("time-select-trigger").click();
      await this.page.getByRole("option", { name: formattedTime }).click();
    }

    await this.createPressReviewButton.click();
  }

  /**
   * Get a PressReviewListItem by topic name
   */
  getListItem(topic: string): PressReviewListItem {
    return new PressReviewListItem(this.page, topic);
  }

  /**
   * Get all press review list items
   */
  async getAllListItems(): Promise<Locator> {
    return this.page.locator('[data-testid^="press-review-list-item-"]');
  }

  /**
   * Get the count of press reviews in the list
   */
  async getListItemCount(): Promise<number> {
    const items = await this.getAllListItems();
    return items.count();
  }

  /**
   * Check if the dashboard is in empty state
   */
  async isEmptyState(): Promise<boolean> {
    return this.emptyState.isVisible();
  }

  /**
   * Check if the dashboard is loading
   */
  async isLoading(): Promise<boolean> {
    return this.loadingList.isVisible();
  }

  /**
   * Check if the limit warning is visible
   */
  async hasReachedLimit(): Promise<boolean> {
    return this.limitWarning.isVisible();
  }

  /**
   * Wait for the dashboard to finish loading
   */
  async waitForLoad(): Promise<void> {
    await this.dashboardView.waitFor({ state: "visible" });
    await this.loadingList.waitFor({ state: "hidden", timeout: 10000 }).catch(() => {
      // Loading might not appear if data loads quickly
    });
  }
}
