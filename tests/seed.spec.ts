import { STANDARD_USER } from '../src/data/credentials';
import { expect, test } from '../src/fixtures/pages.fixture';

/**
 * Seed test — starting point the Playwright agents copy when generating a new spec.
 *
 * It shows the shape every generated test must have:
 *  - `test` and `expect` come from the fixtures, never from `@playwright/test`
 *  - page objects arrive already built via destructuring
 *  - no selector ever appears here; locators live in `src/pages/*.page.ts`
 *
 * Leaving the standard user signed in means a generated scenario can begin
 * straight from the inventory page instead of repeating the login steps.
 */
test.describe('Seed', () => {
  test('a signed in standard user lands on the inventory', async ({
    page,
    loginPage,
    inventoryPage,
  }) => {
    // 1. Open the login page
    await loginPage.open();

    // 2. Sign in with the standard user
    await loginPage.login(STANDARD_USER);

    // 3. The inventory is shown
    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(inventoryPage.title).toHaveText('Products');
  });
});
