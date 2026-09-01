// spec: specs/add-to-cart.md
// seed: tests/seed.spec.ts

import { STANDARD_USER } from '../src/data/credentials';
import { BACKPACK } from '../src/data/products';
import { expect, test } from '../src/fixtures/pages.fixture';

test.describe('Cart', () => {
  test.beforeEach(async ({ page, loginPage, inventoryPage }) => {
    await loginPage.open();
    await loginPage.login(STANDARD_USER);

    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(inventoryPage.title).toHaveText('Products');
  });

  test('TC 4.1 - adding and removing from the product detail page stays in sync with the inventory', async ({
    page,
    inventoryPage,
    inventoryItemPage,
  }) => {
    // Shared cycle: open the Backpack detail page from the inventory and confirm the navigation landed there.
    const openBackpackDetail = async (): Promise<void> => {
      await inventoryPage.openDetails(BACKPACK);
      await expect(page).toHaveURL(/\/inventory-item\.html\?id=\d+$/);
    };

    // Shared cycle: return to the inventory from the detail page and confirm the navigation landed there.
    const returnToInventory = async (): Promise<void> => {
      await inventoryItemPage.backToProducts();
      await expect(page).toHaveURL(/\/inventory\.html$/);
    };

    // 1. Desde el inventario, hacer clic en el nombre de Sauce Labs Backpack.
    await test.step('Desde el inventario, hacer clic en el nombre de Sauce Labs Backpack.', async () => {
      await openBackpackDetail();

      await expect(inventoryItemPage.name).toHaveText(BACKPACK.name);
      await expect(inventoryItemPage.description).toBeVisible();
      await expect(inventoryItemPage.price).toHaveText(BACKPACK.price);
      await expect(inventoryItemPage.addButton).toBeVisible();
    });

    // 2. Hacer clic en "Add to cart" en la página de detalle.
    await test.step('Hacer clic en "Add to cart" en la página de detalle.', async () => {
      await inventoryItemPage.addToCart();

      await expect(inventoryItemPage.removeButton).toBeVisible();
      await expect(inventoryItemPage.cartBadge).toHaveText('1');
    });

    // 3. Volver al inventario con el botón "Back to products".
    await test.step('Volver al inventario con el botón "Back to products".', async () => {
      await returnToInventory();

      await expect(inventoryPage.removeButtonOf(BACKPACK)).toBeVisible();
      await expect(inventoryPage.cartBadge).toHaveText('1');
    });

    // 4. Entrar de nuevo al detalle de Sauce Labs Backpack y hacer clic en "Remove".
    await test.step('Entrar de nuevo al detalle de Sauce Labs Backpack y hacer clic en "Remove".', async () => {
      await openBackpackDetail();
      await inventoryItemPage.removeFromCart();

      await expect(inventoryItemPage.addButton).toBeVisible();
      await expect(inventoryItemPage.cartBadge).toBeHidden();
    });

    // 5. Volver al inventario con "Back to products".
    await test.step('Volver al inventario con "Back to products".', async () => {
      await returnToInventory();

      await expect(inventoryPage.addButtonOf(BACKPACK)).toBeVisible();
    });
  });
});
