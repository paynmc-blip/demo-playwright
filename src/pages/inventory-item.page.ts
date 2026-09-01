import type { Locator, Page } from '@playwright/test';
import { ShopPage } from './shop.page';

/** Detail page of a single product, reached from the inventory: /inventory-item.html?id=N */
export class InventoryItemPage extends ShopPage {
  protected readonly path = '/inventory-item.html';

  readonly name: Locator;
  readonly description: Locator;
  readonly price: Locator;
  readonly addButton: Locator;
  readonly removeButton: Locator;
  readonly backToProductsButton: Locator;

  constructor(page: Page) {
    super(page);
    this.name = page.getByTestId('inventory-item-name');
    this.description = page.getByTestId('inventory-item-desc');
    this.price = page.getByTestId('inventory-item-price');
    this.addButton = this.addButtonIn(page);
    this.removeButton = this.removeButtonIn(page);
    this.backToProductsButton = page.getByTestId('back-to-products');
  }

  async addToCart(): Promise<void> {
    await this.addButton.click();
  }

  async removeFromCart(): Promise<void> {
    await this.removeButton.click();
  }

  async backToProducts(): Promise<void> {
    await this.backToProductsButton.click();
  }
}
