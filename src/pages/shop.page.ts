import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

/** Anything that can scope a locator query: the whole page or a single card/row. */
type Scope = Pick<Page, 'getByRole'> | Pick<Locator, 'getByRole'>;

/**
 * Shared behaviour of every page behind the login: the header with the page title,
 * the burger menu and the cart link, plus the "Add to cart" / "Remove" button pair
 * that both the inventory card and the product detail page render.
 */
export abstract class ShopPage extends BasePage {
  readonly title: Locator;
  readonly menuButton: Locator;
  readonly closeMenuButton: Locator;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;

  /** Side menu entries, only clickable once the burger menu is open. */
  readonly allItemsLink: Locator;
  readonly logoutLink: Locator;
  readonly resetAppStateLink: Locator;

  protected constructor(page: Page) {
    super(page);
    this.title = page.getByTestId('title');
    this.menuButton = page.getByRole('button', { name: 'Open Menu' });
    this.closeMenuButton = page.getByRole('button', { name: 'Close Menu' });
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.allItemsLink = page.getByTestId('inventory-sidebar-link');
    this.logoutLink = page.getByTestId('logout-sidebar-link');
    this.resetAppStateLink = page.getByTestId('reset-sidebar-link');
  }

  /** The button shown while the product is out of the cart. */
  protected addButtonIn(scope: Scope): Locator {
    return scope.getByRole('button', { name: 'Add to cart' });
  }

  /** The same button once the product is in the cart. */
  protected removeButtonIn(scope: Scope): Locator {
    return scope.getByRole('button', { name: 'Remove' });
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  /** The side menu slides in; its links only take clicks once it is open. */
  async openMenu(): Promise<void> {
    await this.menuButton.click();
    await this.logoutLink.waitFor({ state: 'visible' });
  }

  async closeMenu(): Promise<void> {
    await this.closeMenuButton.click();
  }

  async logout(): Promise<void> {
    await this.openMenu();
    await this.logoutLink.click();
  }

  async resetAppState(): Promise<void> {
    await this.openMenu();
    await this.resetAppStateLink.click();
  }
}
