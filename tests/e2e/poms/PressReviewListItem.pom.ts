import type { Locator, Page } from "@playwright/test";

export class PressReviewListItem {
  readonly page: Page;
  readonly listItem: Locator;
  readonly editButton: Locator;
  readonly deleteButton: Locator;
  readonly generateButton: Locator;

  constructor(page: Page, listItemLocator: Locator) {
    this.page = page;
    this.listItem = listItemLocator;
    this.editButton = this.listItem.getByTestId("edit-press-review-button");
    this.deleteButton = this.listItem.getByTestId("delete-press-review-button");
    this.generateButton = this.listItem.getByTestId("generate-press-review-button");
  }

  async clickEdit() {
    await this.editButton.click();
  }

  async clickDelete() {
    await this.deleteButton.click();
  }

  async clickGenerate() {
    await this.generateButton.click();
  }

  async getTopic(): Promise<string> {
    return this.listItem.locator("h3").innerText();
  }

  async getSchedule(): Promise<string> {
    return this.listItem.locator("span").innerText();
  }
}
