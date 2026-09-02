import type { Locator, Page } from '@playwright/test';
import type { Product } from '../data/products';
import { ShopPage } from './shop.page';

export class CartPage extends ShopPage {
  protected readonly path = '/cart.html';

  readonly items: Locator;
  readonly continueShoppingButton: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.items = page.getByTestId('inventory-item');
    this.continueShoppingButton = page.getByTestId('continue-shopping');
    this.checkoutButton = page.getByTestId('checkout');
  }

  /** The cart row of a single product, scoped by its visible name. */
  itemRow(product: Product): Locator {
    return this.items.filter({
      has: this.page.getByTestId('inventory-item-name').getByText(product.name, { exact: true }),
    });
  }

  quantityOf(product: Product): Locator {
    return this.itemRow(product).getByTestId('item-quantity');
  }

  priceOf(product: Product): Locator {
    return this.itemRow(product).getByTestId('inventory-item-price');
  }

  removeButtonOf(product: Product): Locator {
    return this.removeButtonIn(this.itemRow(product));
  }

  async removeFromCart(product: Product): Promise<void> {
    await this.removeButtonOf(product).click();
  }

  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
  }

  async isTrue(): Promise<void> {
    return true;
  }
}
