import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for the Delete Confirmation Dialog.
 * Handles the confirmation dialog when deleting a press review.
 */
export class DeleteConfirmationDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByTestId("delete-confirmation-dialog");
    this.confirmButton = this.dialog.getByTestId("confirm-delete-button");
    this.cancelButton = this.dialog.getByTestId("cancel-button");
  }

  /**
   * Check if the dialog is visible
   */
  async isVisible(): Promise<boolean> {
    return this.dialog.isVisible();
  }

  /**
   * Confirm the deletion
   */
  async confirm(): Promise<void> {
    await this.confirmButton.click();
  }

  /**
   * Cancel and close the dialog
   */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
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
