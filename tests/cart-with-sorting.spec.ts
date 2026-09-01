// spec: specs/add-to-cart.md
// seed: tests/seed.spec.ts

import { STANDARD_USER } from '../src/data/credentials';
import { ALL_PRODUCTS, BACKPACK, BIKE_LIGHT, BOLT_T_SHIRT } from '../src/data/products';
import type { Product } from '../src/data/products';
import { ALL_SORT_OPTIONS, SORT_OPTIONS } from '../src/data/sort-options';
import { expect, test } from '../src/fixtures/pages.fixture';
import type { InventoryPage } from '../src/pages/inventory.page';

/** The three products added to the cart before any sorting happens. */
const IN_CART: readonly Product[] = [BACKPACK, BOLT_T_SHIRT, BIKE_LIGHT];

/** Every other catalogue product, derived instead of hand-listed so the set never drifts from ALL_PRODUCTS. */
const NOT_IN_CART: readonly Product[] = ALL_PRODUCTS.filter(
  (product) => !IN_CART.some((inCartProduct) => inCartProduct.name === product.name),
);

/** Sorting must never touch the cart: the badge and every card's button stay put. */
async function expectCartStateIntact(inventoryPage: InventoryPage): Promise<void> {
  await expect(inventoryPage.cartBadge).toHaveText('3');

  for (const product of IN_CART) {
    await expect(inventoryPage.removeButtonOf(product)).toBeVisible();
  }

  for (const product of NOT_IN_CART) {
    await expect(inventoryPage.addButtonOf(product)).toBeVisible();
  }
}

test.describe('Cart', () => {
  test.beforeEach(async ({ page, loginPage, inventoryPage }) => {
    await loginPage.open();
    await loginPage.login(STANDARD_USER);

    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(inventoryPage.title).toHaveText('Products');
  });

  test('TC 6.1 - the cart state survives every sort option', async ({ inventoryPage }) => {
    // 1. Con el orden por defecto "Name (A to Z)", añadir al carrito Sauce Labs Backpack, Sauce Labs Bolt T-Shirt y Sauce Labs Bike Light (en ese orden).
    await test.step('add Sauce Labs Backpack, Sauce Labs Bolt T-Shirt and Sauce Labs Bike Light to the cart in the default order', async () => {
      for (const product of IN_CART) {
        await inventoryPage.addToCart(product);
      }

      await expect(inventoryPage.cartBadge).toHaveText('3000000000');
    });

    // 2/3/4. Cambiar el ordenamiento del dropdown y verificar el estado de todas las tarjetas para cada opción restante.
    const remainingSortOptions = ALL_SORT_OPTIONS.filter(
      (option) => option !== SORT_OPTIONS.nameAscending,
    );

    for (const sortOption of remainingSortOptions) {
      await test.step(`sort by "${sortOption}" and verify the cart state is intact`, async () => {
        await inventoryPage.sortBy(sortOption);

        await expectCartStateIntact(inventoryPage);
      });
    }
  });
});
