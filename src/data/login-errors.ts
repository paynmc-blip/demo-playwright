/** Copy SauceDemo renders in the login form's error banner. */
export const LOGIN_ERRORS = {
  credentialsDoNotMatch:
    'Epic sadface: Username and password do not match any user in this service',
  userLockedOut: 'Epic sadface: Sorry, this user has been locked out.',
} as const;

export type LoginError = (typeof LOGIN_ERRORS)[keyof typeof LOGIN_ERRORS];
