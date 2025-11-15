import type { Locator, Page } from "@playwright/test";

export class DeleteConfirmationDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByTestId("delete-confirmation-dialog");
    this.confirmButton = page.getByTestId("confirm-delete-button");
    this.cancelButton = page.getByTestId("cancel-button");
  }

  async confirm() {
    await this.confirmButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }
}
