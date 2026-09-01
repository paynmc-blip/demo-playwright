import { test as base } from '@playwright/test';
import { CartPage } from '../pages/cart.page';
import { InventoryItemPage } from '../pages/inventory-item.page';
import { InventoryPage } from '../pages/inventory.page';
import { LoginPage } from '../pages/login.page';

interface PageObjects {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  inventoryItemPage: InventoryItemPage;
  cartPage: CartPage;
}

/** Injects ready-to-use page objects so specs never instantiate them by hand. */
export const test = base.extend<PageObjects>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
  inventoryItemPage: async ({ page }, use) => {
    await use(new InventoryItemPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
});

export { expect } from '@playwright/test';
