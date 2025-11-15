import type { Locator, Page } from "@playwright/test";

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
    this.topicInput = page.getByTestId("topic-input");
    this.scheduleSelect = page.getByTestId("schedule-select-trigger");
    this.dayOfWeekSelect = page.getByTestId("day-of-week-select-trigger");
    this.dayOfMonthSelect = page.getByTestId("day-of-month-select-trigger");
    this.timeSelect = page.getByTestId("time-select-trigger");
    this.submitButton = page.getByTestId("submit-button");
    this.cancelButton = page.getByTestId("cancel-button");
  }

  async fillTopic(topic: string) {
    await this.topicInput.fill(topic);
    // Wait for validation to complete
    await this.page.waitForResponse("/api/validate-topic");
  }

  async selectSchedule(schedule: "daily" | "weekly" | "monthly") {
    await this.scheduleSelect.click();
    await this.page.getByTestId(`schedule-select-option-${schedule}`).click();
  }

  async selectDayOfWeek(day: string) {
    await this.dayOfWeekSelect.click();
    await this.page.getByRole("option", { name: day, exact: true }).click();
  }

  async selectDayOfMonth(day: number) {
    await this.dayOfMonthSelect.click();
    await this.page.getByRole("option", { name: day.toString(), exact: true }).click();
  }

  async selectTime(hour: number) {
    await this.timeSelect.click();
    const hourString = String(hour).padStart(2, "0") + ":00";
    await this.page.getByRole("option", { name: hourString, exact: true }).click();
  }

  async submit() {
    await this.submitButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }

  async createPressReview(data: {
    topic: string;
    schedule: "daily" | "weekly" | "monthly";
    dayOfWeek?: string;
    dayOfMonth?: number;
    time: number;
  }) {
    await this.fillTopic(data.topic);
    await this.selectSchedule(data.schedule);
    if (data.schedule === "weekly" && data.dayOfWeek) {
      await this.selectDayOfWeek(data.dayOfWeek);
    }
    if (data.schedule === "monthly" && data.dayOfMonth) {
      await this.selectDayOfMonth(data.dayOfMonth);
    }
    await this.selectTime(data.time);
    await this.submit();
  }
}
