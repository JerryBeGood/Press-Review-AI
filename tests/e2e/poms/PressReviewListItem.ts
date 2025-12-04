import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for a single Press Review List Item.
 * Represents one item in the press review list.
 */
export class PressReviewListItem {
  readonly page: Page;
  readonly topic: string;
  readonly listItem: Locator;
  readonly editButton: Locator;
  readonly deleteButton: Locator;
  readonly generateButton: Locator;

  constructor(page: Page, topic: string) {
    this.page = page;
    this.topic = topic;

    // Find the list item by topic text content
    this.listItem = page.locator('[data-testid^="press-review-list-item-"]').filter({
      hasText: topic,
    });

    this.editButton = this.listItem.getByTestId("edit-press-review-button");
    this.deleteButton = this.listItem.getByTestId("delete-press-review-button");
    this.generateButton = this.listItem.getByTestId("generate-press-review-button");
  }

  /**
   * Check if the list item is visible
   */
  async isVisible(): Promise<boolean> {
    return this.listItem.isVisible();
  }

  /**
   * Get the topic text from the list item
   */
  async getTopic(): Promise<string> {
    const heading = this.listItem.locator("h3");
    return (await heading.textContent()) ?? "";
  }

  /**
   * Get the schedule text from the list item
   */
  async getSchedule(): Promise<string> {
    const scheduleSpan = this.listItem.locator("span").last();
    return (await scheduleSpan.textContent()) ?? "";
  }

  /**
   * Click the Edit button
   */
  async clickEdit(): Promise<void> {
    await this.editButton.click();
  }

  /**
   * Click the Delete button
   */
  async clickDelete(): Promise<void> {
    await this.deleteButton.click();
  }

  /**
   * Click the Generate button
   */
  async clickGenerate(): Promise<void> {
    await this.generateButton.click();
  }

  /**
   * Check if the item is in deleting state
   */
  async isDeleting(): Promise<boolean> {
    const buttonText = await this.deleteButton.textContent();
    return buttonText?.includes("DELETING") ?? false;
  }

  /**
   * Check if the item is in generating state
   */
  async isGenerating(): Promise<boolean> {
    const buttonText = await this.generateButton.textContent();
    return buttonText?.includes("GENERATING") ?? false;
  }

  /**
   * Wait for the list item to be visible
   */
  async waitForVisible(): Promise<void> {
    await this.listItem.waitFor({ state: "visible" });
  }

  /**
   * Wait for the list item to be hidden
   */
  async waitForHidden(): Promise<void> {
    await this.listItem.waitFor({ state: "hidden" });
  }
}
