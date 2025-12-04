import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for the Press Review Form Dialog.
 * Used for both creating and editing press reviews.
 */
export class PressReviewFormDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly topicInput: Locator;
  readonly scheduleSelect: Locator;
  readonly dayOfWeekSelect: Locator;
  readonly dayOfMonthSelect: Locator;
  readonly timeSelect: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByTestId("press-review-form-dialog");
    this.topicInput = this.dialog.getByTestId("topic-input");
    this.scheduleSelect = this.dialog.getByTestId("schedule-select-trigger");
    this.dayOfWeekSelect = this.dialog.getByTestId("day-of-week-select-trigger");
    this.dayOfMonthSelect = this.dialog.getByTestId("day-of-month-select-trigger");
    this.timeSelect = this.dialog.getByTestId("time-select-trigger");
    this.submitButton = this.dialog.getByTestId("submit-button");
    this.cancelButton = this.dialog.getByTestId("cancel-button");
  }

  /**
   * Check if the dialog is visible
   */
  async isVisible(): Promise<boolean> {
    return this.dialog.isVisible();
  }

  /**
   * Fill the topic input field
   */
  async fillTopic(topic: string): Promise<void> {
    await this.topicInput.clear();
    await this.topicInput.fill(topic);
  }

  /**
   * Select a schedule type (daily, weekly, monthly)
   */
  async selectSchedule(schedule: "daily" | "weekly" | "monthly"): Promise<void> {
    await this.scheduleSelect.click();
    await this.page.getByRole("option", { name: new RegExp(`^${schedule}$`, "i") }).click();
  }

  /**
   * Select a day of week (for weekly schedule)
   */
  async selectDayOfWeek(day: string): Promise<void> {
    await this.dayOfWeekSelect.click();
    await this.page.getByRole("option", { name: day }).click();
  }

  /**
   * Select a day of month (for monthly schedule)
   */
  async selectDayOfMonth(day: number): Promise<void> {
    await this.dayOfMonthSelect.click();
    await this.page.getByRole("option", { name: String(day), exact: true }).click();
  }

  /**
   * Select time (hour in 24h format)
   */
  async selectTime(hour: number): Promise<void> {
    const formattedTime = `${String(hour).padStart(2, "0")}:00`;
    await this.timeSelect.click();
    await this.page.getByRole("option", { name: formattedTime }).click();
  }

  /**
   * Submit the form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Cancel and close the dialog
   */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * Create a new press review with all options
   */
  async createPressReview(options: {
    topic: string;
    schedule?: "daily" | "weekly" | "monthly";
    dayOfWeek?: string;
    dayOfMonth?: number;
    time?: number;
  }): Promise<void> {
    await this.fillTopic(options.topic);

    if (options.schedule) {
      await this.selectSchedule(options.schedule);
    }

    if (options.schedule === "weekly" && options.dayOfWeek) {
      await this.selectDayOfWeek(options.dayOfWeek);
    }

    if (options.schedule === "monthly" && options.dayOfMonth) {
      await this.selectDayOfMonth(options.dayOfMonth);
    }

    if (options.time !== undefined) {
      await this.selectTime(options.time);
    }

    await this.submit();
  }

  /**
   * Wait for the dialog to be visible
   */
  async waitForVisible(): Promise<void> {
    await this.dialog.waitFor({ state: "visible" });
  }

  /**
   * Wait for the dialog to be hidden
   */
  async waitForHidden(): Promise<void> {
    await this.dialog.waitFor({ state: "hidden" });
  }
}
