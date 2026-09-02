// spec: specs/add-to-cart.md
// seed: tests/seed.spec.ts

import { STANDARD_USER } from '../src/data/credentials';
import { BOLT_T_SHIRT } from '../src/data/products';
import { expect, test } from '../src/fixtures/pages.fixture';
import type { CartPage } from '../src/pages/cart.page';
import type { InventoryPage } from '../src/pages/inventory.page';

interface Pages {
  readonly inventoryPage: InventoryPage;
  readonly cartPage: CartPage;
}

/** The same product can be dropped from two places; each one is a test of its own. */
interface RemovalOrigin {
  readonly title: string;
  /** Reaches the "Remove" button in this origin and clicks it. */
  readonly remove: (pages: Pages) => Promise<void>;
  /** What that origin shows once the product is gone. */
  readonly expectGone: (pages: Pages) => Promise<void>;
}

const REMOVAL_ORIGINS: readonly RemovalOrigin[] = [
  {
    title: 'its inventory card',
    remove: ({ inventoryPage }) => inventoryPage.removeFromCart(BOLT_T_SHIRT),
    expectGone: async ({ inventoryPage }) => {
      await expect(inventoryPage.addButtonOf(BOLT_T_SHIRT)).toBeVisible();
      await expect(inventoryPage.cartBadge).toHaveText('1000');
    },
  },
  {
    title: 'its cart row',
    remove: async ({ inventoryPage, cartPage }) => {
      await inventoryPage.openCart();

      await expect(cartPage.items).toHaveCount(1);
      await expect(cartPage.quantityOf(BOLT_T_SHIRT)).toHaveText('1');

      await cartPage.removeFromCart(BOLT_T_SHIRT);
    },
    expectGone: async ({ cartPage }) => {
      await expect(cartPage.items).toHaveCount(0);
      await expect(cartPage.cartBadge).toBeHidden();
      await expect(cartPage.continueShoppingButton).toBeVisible();
      await expect(cartPage.checkoutButton).toBeVisible();
    },
  },
];

test.describe('Cart', () => {
  test.beforeEach(async ({ page, loginPage, inventoryPage }) => {
    await loginPage.open();
    await loginPage.login(STANDARD_USER);

    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(inventoryPage.title).toHaveText('Products');
  });

  for (const { title, remove, expectGone } of REMOVAL_ORIGINS) {
    test(`TC 3.1 - a product can be removed from ${title}`, async ({ inventoryPage, cartPage }) => {
      const pages: Pages = { inventoryPage, cartPage };

      // 1. Añadir Sauce Labs Bolt T-Shirt al carrito desde su tarjeta en el inventario.
      await test.step(`add "${BOLT_T_SHIRT.name}" to the cart from its inventory card`, async () => {
        await inventoryPage.addToCart(BOLT_T_SHIRT);

        await expect(inventoryPage.cartBadge).toHaveText('1');
        await expect(inventoryPage.removeButtonOf(BOLT_T_SHIRT)).toBeVisible();
      });

      // 2/4. Quitar el producto desde el origen bajo prueba y comprobar que desaparece del carrito.
      await test.step(`remove it from ${title}`, async () => {
        await remove(pages);
        await expectGone(pages);
      });
    });
  }
});
