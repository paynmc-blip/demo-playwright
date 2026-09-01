import type { Page } from '@playwright/test';

/** Shared behaviour for every page object: holds the Page and knows how to reach itself. */
export abstract class BasePage {
  protected constructor(protected readonly page: Page) {}

  /** Path this page lives at, relative to `baseURL`. */
  protected abstract readonly path: string;

  async open(): Promise<void> {
    await this.page.goto(this.path);
  }

  /** Full browser reload, to prove what the app keeps across page loads. */
  async reload(): Promise<void> {
    await this.page.reload();
  }
}
