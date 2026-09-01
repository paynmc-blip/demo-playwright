// spec: specs/add-to-cart.md
// seed: tests/seed.spec.ts

import { STANDARD_USER } from '../src/data/credentials';
import { BACKPACK, BIKE_LIGHT, BOLT_T_SHIRT } from '../src/data/products';
import { expect, test } from '../src/fixtures/pages.fixture';

test.describe('Cart', () => {
  test.beforeEach(async ({ page, loginPage, inventoryPage }) => {
    await loginPage.open();
    await loginPage.login(STANDARD_USER);

    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(inventoryPage.title).toHaveText('Products');
  });

  test('TC 2.1 - the badge counts every added product and the cart mirrors them', async ({
    page,
    inventoryPage,
    cartPage,
  }) => {
    const products = [BACKPACK, BIKE_LIGHT, BOLT_T_SHIRT] as const;

    // 1. Desde el inventario, añadir al carrito Sauce Labs Backpack, verificando el estado antes y después.
    await test.step('before adding any product, the cart badge is not visible', async () => {
      await expect(inventoryPage.cartBadge).toBeHidden();
    });

    // 1-3. Añadir cada producto (Sauce Labs Backpack, Sauce Labs Bike Light, Sauce Labs Bolt T-Shirt) al
    // carrito, verificando tras cada uno que el badge crece y el botón de la tarjeta cambia a "Remove".
    for (const [index, product] of products.entries()) {
      await test.step(`add "${product.name}" to the cart`, async () => {
        await inventoryPage.addToCart(product);

        await expect(inventoryPage.cartBadge).toHaveText(String(index + 1));
        await expect(inventoryPage.removeButtonOf(product)).toBeVisible();
      });
    }

    // 4. Abrir el carrito desde el enlace del carrito.
    await test.step('open the cart from the shopping cart link', async () => {
      await inventoryPage.openCart();

      await expect(page).toHaveURL(/\/cart\.html$/);
      await expect(cartPage.title).toHaveText('Your Cart');
      await expect(cartPage.items).toHaveCount(products.length);
    });

    // 5. Verificar cada fila del carrito.
    await test.step('each cart row shows quantity "1" and its matching price', async () => {
      for (const product of products) {
        await expect(cartPage.quantityOf(product)).toHaveText('1');
        await expect(cartPage.priceOf(product)).toHaveText(product.price);
      }
    });
  });
});
