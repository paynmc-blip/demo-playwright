export interface Credentials {
  readonly username: string;
  readonly password: string;
}

/** Every SauceDemo account shares one password; overridable so CI can inject it. */
const PASSWORD = process.env.SAUCE_PASSWORD ?? 'secret_sauce';

export const STANDARD_USER: Credentials = {
  username: process.env.SAUCE_USERNAME ?? 'standard_user',
  password: PASSWORD,
};

/** A real account the backend refuses to sign in because it is disabled. */
export const LOCKED_OUT_USER: Credentials = {
  username: 'locked_out_user',
  password: PASSWORD,
};

/** Same user, password no account owns — exercises the rejection path. */
export function withWrongPassword(user: Credentials): Credentials {
  return { ...user, password: 'wrong_password' };
}
