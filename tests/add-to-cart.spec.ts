import { STANDARD_USER } from '../src/data/credentials';
import { BOLT_T_SHIRT } from '../src/data/products';
import { expect, test } from '../src/fixtures/pages.fixture';

test.describe('Cart', () => {
  test.beforeEach(async ({ page, loginPage, inventoryPage }) => {
    await loginPage.open();
    await loginPage.login(STANDARD_USER);

    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(inventoryPage.title).toHaveText('Products');
  });

  test('a standard user can add a t-shirt to the cart', async ({
    page,
    inventoryPage,
    cartPage,
  }) => {
    await test.step(`add "${BOLT_T_SHIRT.name}" to the cart`, async () => {
      await expect(inventoryPage.cartBadge).toBeHidden();

      await inventoryPage.addToCart(BOLT_T_SHIRT);

      await expect(inventoryPage.cartBadge).toHaveText('1');
      await expect(inventoryPage.removeButtonOf(BOLT_T_SHIRT)).toBeVisible();
    });

    await test.step('the cart holds exactly that t-shirt', async () => {
      await inventoryPage.openCart();

      await expect(page).toHaveURL(/\/cart\.html$/);
      await expect(cartPage.title).toHaveText('Your Cart');
      await expect(cartPage.items).toHaveCount(1);
      await expect(cartPage.quantityOf(BOLT_T_SHIRT)).toHaveText('1');
      await expect(cartPage.priceOf(BOLT_T_SHIRT)).toHaveText(BOLT_T_SHIRT.price);
    });
  });
});
