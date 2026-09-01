// spec: specs/add-to-cart.md
// seed: tests/seed.spec.ts

import { STANDARD_USER } from '../src/data/credentials';
import { BIKE_LIGHT } from '../src/data/products';
import { expect, test } from '../src/fixtures/pages.fixture';

test.describe('Cart', () => {
  test.beforeEach(async ({ page, loginPage, inventoryPage }) => {
    await loginPage.open();
    await loginPage.login(STANDARD_USER);

    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(inventoryPage.title).toHaveText('Products');
  });

  test('TC 5.1 - the cart survives Continue Shopping, a reload and a logout', async ({
    page,
    loginPage,
    inventoryPage,
    cartPage,
  }) => {
    // The three checkpoints below all assert the same thing: the cart still
    // holds exactly the Bike Light. Sharing it keeps each step focused on
    // the action under test instead of repeating the same two assertions.
    const expectCartStillHoldsBikeLight = async () => {
      await expect(inventoryPage.cartBadge).toHaveText('1');
      await expect(inventoryPage.removeButtonOf(BIKE_LIGHT)).toBeVisible();
    };

    // 1. Añadir Sauce Labs Bike Light al carrito desde el inventario.
    await test.step('add Sauce Labs Bike Light to the cart from the inventory', async () => {
      await inventoryPage.addToCart(BIKE_LIGHT);

      await expect(inventoryPage.cartBadge).toHaveText('1');
    });

    // 2. Abrir el carrito y hacer clic en "Continue Shopping".
    await test.step('open the cart and click "Continue Shopping"', async () => {
      await inventoryPage.openCart();
      await cartPage.continueShopping();

      await expect(page).toHaveURL(/\/inventory\.html$/);
      await expectCartStillHoldsBikeLight();
    });

    // 3. Recargar la página completa del navegador.
    await test.step('reload the full browser page', async () => {
      await inventoryPage.reload();

      await expectCartStillHoldsBikeLight();
    });

    // 4. Cerrar sesión (Logout) desde el menú lateral y volver a iniciar sesión con el mismo standard_user.
    await test.step('logout from the side menu and log back in with the same standard_user', async () => {
      await inventoryPage.logout();

      await expect(page).toHaveURL(/\/$/);
      await expect(loginPage.loginButton).toBeVisible();

      await loginPage.login(STANDARD_USER);

      // SauceDemo does NOT clear the cart on logout — it lives in localStorage,
      // which survives the sign-out/sign-in cycle. Only "Reset App State" or
      // manually removing the product empties it. This is expected, documented
      // behaviour, not a bug.
      await expectCartStillHoldsBikeLight();
    });
  });
});
