import type { Credentials } from '../src/data/credentials';
import { LOCKED_OUT_USER, STANDARD_USER, withWrongPassword } from '../src/data/credentials';
import type { LoginError } from '../src/data/login-errors';
import { LOGIN_ERRORS } from '../src/data/login-errors';
import { expect, test } from '../src/fixtures/pages.fixture';

interface RejectedLogin {
  readonly title: string;
  readonly credentials: Credentials;
  readonly expectedError: LoginError;
}

const REJECTED_LOGINS: readonly RejectedLogin[] = [
  {
    title: 'a wrong password is rejected',
    credentials: withWrongPassword(STANDARD_USER),
    expectedError: LOGIN_ERRORS.credentialsDoNotMatch,
  },
  {
    title: 'a locked out user is rejected',
    credentials: LOCKED_OUT_USER,
    expectedError: LOGIN_ERRORS.userLockedOut,
  },
];

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
  });

  test('a standard user reaches the inventory', async ({ page, loginPage, inventoryPage }) => {
    await loginPage.login(STANDARD_USER);

    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(inventoryPage.title).toHaveText('Products');
    await expect(inventoryPage.menuButton).toBeVisible();
    await expect(loginPage.errorMessage).toBeHidden();
  });

  for (const { title, credentials, expectedError } of REJECTED_LOGINS) {
    test(title, async ({ page, loginPage }) => {
      await loginPage.login(credentials);

      await expect(loginPage.errorMessage).toHaveText(expectedError);
      await expect(page).toHaveURL(/\/$/);
      await expect(loginPage.loginButton).toBeVisible();
    });
  }
});
