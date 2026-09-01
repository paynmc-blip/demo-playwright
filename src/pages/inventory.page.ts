import type { Locator, Page } from '@playwright/test';
import type { Product } from '../data/products';
import type { SortOption } from '../data/sort-options';
import { ShopPage } from './shop.page';

export class InventoryPage extends ShopPage {
  protected readonly path = '/inventory.html';

  readonly sortDropdown: Locator;

  constructor(page: Page) {
    super(page);
    this.sortDropdown = page.getByTestId('product-sort-container');
  }

  /** The card of a single product, scoped by its visible name. */
  itemCard(product: Product): Locator {
    return this.page.getByTestId('inventory-item').filter({
      has: this.page.getByTestId('inventory-item-name').getByText(product.name, { exact: true }),
    });
  }

  /** The card's action button flips from "Add to cart" to "Remove" once added. */
  addButtonOf(product: Product): Locator {
    return this.addButtonIn(this.itemCard(product));
  }

  removeButtonOf(product: Product): Locator {
    return this.removeButtonIn(this.itemCard(product));
  }

  /** The product name doubles as the link to its detail page. */
  nameLinkOf(product: Product): Locator {
    return this.itemCard(product).getByTestId('inventory-item-name');
  }

  /** Product names in the order the grid currently lists them. */
  async listedNames(): Promise<string[]> {
    return this.page.getByTestId('inventory-item-name').allTextContents();
  }

  async addToCart(product: Product): Promise<void> {
    await this.addButtonOf(product).click();
  }

  async removeFromCart(product: Product): Promise<void> {
    await this.removeButtonOf(product).click();
  }

  async openDetails(product: Product): Promise<void> {
    await this.nameLinkOf(product).click();
  }

  /** Reorders the grid by the dropdown's visible label. */
  async sortBy(option: SortOption): Promise<void> {
    await this.sortDropdown.selectOption({ label: option });
  }
}
