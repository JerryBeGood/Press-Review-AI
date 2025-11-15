import type { Locator, Page } from "@playwright/test";
import { PressReviewFormDialog } from "./PressReviewFormDialog.pom";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog.pom";
import { PressReviewListItem } from "./PressReviewListItem.pom";

export class DashboardPage {
  readonly page: Page;
  readonly createNewReviewButton: Locator;
  readonly pressReviewList: Locator;
  readonly formDialog: PressReviewFormDialog;
  readonly deleteDialog: DeleteConfirmationDialog;

  constructor(page: Page) {
    this.page = page;

    // Locators
    this.createNewReviewButton = page.getByRole("button", { name: "Create new press review" });
    this.pressReviewList = page.getByTestId("press-review-list");

    // Page Objects
    this.formDialog = new PressReviewFormDialog(page);
    this.deleteDialog = new DeleteConfirmationDialog(page);
  }

  async goto() {
    await this.page.goto("/dashboard");
  }

  async clickCreateNewReview() {
    await this.createNewReviewButton.click();
  }

  getListItem(topic: string): PressReviewListItem {
    const listItemLocator = this.pressReviewList.locator("div").filter({ hasText: topic }).first();
    return new PressReviewListItem(this.page, listItemLocator);
  }

  getListItemById(id: string): PressReviewListItem {
    const listItemLocator = this.page.getByTestId(`press-review-list-item-${id}`);
    return new PressReviewListItem(this.page, listItemLocator);
  }
}
