# demo-playwright

Suite E2E en Playwright + TypeScript para [saucedemo.com](https://www.saucedemo.com/).

Cubre un único caso de uso: **un usuario estándar inicia sesión y añade una camiseta al carrito.**

## Requisitos

- Node.js 18+

## Instalación

```bash
npm install
npx playwright install chromium
```

## Ejecución

```bash
npm test              # headless
npm run test:headed   # con navegador visible
npm run test:ui       # modo UI interactivo
npm run test:debug    # inspector paso a paso
npm run report        # abre el último informe HTML
npm run typecheck     # comprobación de tipos
```

## Estructura

```
.
├── playwright.config.ts        # configuración: baseURL, testIdAttribute, reporters, trazas
├── tsconfig.json
├── src
│   ├── data                    # datos de prueba (sin valores dispersos por los specs)
│   │   ├── credentials.ts
│   │   └── products.ts
│   ├── fixtures
│   │   └── pages.fixture.ts    # inyecta los page objects vía fixtures de Playwright
│   └── pages                   # Page Object Model
│       ├── base.page.ts
│       ├── login.page.ts
│       ├── inventory.page.ts
│       └── cart.page.ts
└── tests
    └── add-to-cart.spec.ts
```

## Decisiones

- **Page Object Model** con una `BasePage` que centraliza la navegación (`path` + `open()`).
- **Fixtures** en lugar de `new LoginPage(page)` en cada spec: los tests reciben las páginas ya construidas.
- **`testIdAttribute: 'data-test'`**: SauceDemo expone atributos `data-test` estables, así que
  `getByTestId()` apunta a ellos y evita selectores CSS frágiles.
- **Sin esperas manuales**: se usan las aserciones auto-reintentables de `expect()`.
- **Datos externalizados**; las credenciales se pueden sobreescribir con `SAUCE_USERNAME` /
  `SAUCE_PASSWORD`, y la URL base con `BASE_URL`.
- **`test.step()`** para que el informe HTML muestre el flujo funcional legible.

## Añadir más navegadores

En `playwright.config.ts`, dentro de `projects`, añade Firefox o WebKit y ejecuta
`npx playwright install firefox webkit`.
