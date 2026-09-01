# Añadir productos al carrito — SauceDemo

## Application Overview

Plan de pruebas E2E para la funcionalidad de "añadir productos al carrito" en https://www.saucedemo.com, partiendo siempre de `/inventory.html` con el `standard_user` ya autenticado (seed `tests/seed.spec.ts`), salvo en los grupos 9 y 10 donde se usan otros usuarios.

## Cobertura ya existente (no duplicar)
- `tests/add-to-cart.spec.ts`: añadir un único producto (Sauce Labs Bolt T-Shirt) desde su tarjeta en el inventario, verificar el cambio de botón a "Remove", el badge del carrito y que el carrito (`Your Cart`) refleje nombre, cantidad y precio. El Grupo 1 de este plan referencia esa cobertura y no genera un test nuevo.
- `tests/login.spec.ts`: login exitoso y casos de error de login. No relacionado con el carrito, no se toca.

## Escenarios nuevos (grupos 2 a 10)
Cubren: múltiples productos y contador de badge, quitar productos (inventario y carrito), alta/baja desde la página de detalle de producto, persistencia del carrito al navegar (Continue Shopping, detalle, reload, logout/login), interacción con el ordenamiento del inventario, carrito vacío y "añadir todo el catálogo", el efecto de "Reset App State", y el comportamiento con `problem_user` y `performance_glitch_user`.

## Gaps detectados en Page Objects y datos (resolver antes de generar los tests)
1. **`src/pages/inventory.page.ts`**: falta un locator/método para el enlace del nombre o la imagen de un producto que navega al detalle (`openDetails(product)` o similar hacia `/inventory-item.html?id=…`); falta el locator del combobox de ordenamiento y un método `sortBy(option)`; faltan los enlaces del menú lateral `Reset App State` y `Logout` (hoy solo existe `menuButton` para abrirlo).
2. **Falta un `InventoryItemPage`** (`src/pages/inventory-item.page.ts`) para `/inventory-item.html?id=…`, con: título, precio, botón "Add to cart"/"Remove", botón "Back to products", y acceso al badge del carrito.
3. **`src/pages/cart.page.ts`**: falta `removeButtonOf(product)` para el botón "Remove" de cada fila, y un método `continueShopping()` para el botón "Continue Shopping" (el botón "Checkout" no es necesario para este plan pero también falta si se quisiera cubrir).
4. **`src/data/credentials.ts`**: faltan las constantes `PROBLEM_USER` y `PERFORMANCE_GLITCH_USER` (mismo password que `STANDARD_USER`) para los grupos 9 y 10.
5. **`src/data/products.ts`**: hoy solo define `BOLT_T_SHIRT`. Faltan `BACKPACK` ($29.99), `BIKE_LIGHT` ($9.99), `FLEECE_JACKET` ($49.99), `ONESIE` ($7.99) y `RED_T_SHIRT` (Test.allTheThings() T-Shirt (Red), $15.99); conviene añadir también un `ALL_PRODUCTS` que liste los 6 para el escenario de "añadir todo el catálogo".

## Notas de comportamiento real de la app detectadas durante la exploración (documentar como resultado esperado, no como bug de automatización)
- El carrito persiste en `localStorage`: sobrevive a "Continue Shopping", a recargar la página (F5) y a cerrar sesión (Logout) y volver a iniciar sesión — solo se vacía quitando los productos manualmente o usando "Reset App State".
- "Reset App State" vacía el badge y el carrito de inmediato, pero **no** revierte de inmediato a "Add to cart" los botones que ya estaban en "Remove" en la página actualmente renderizada; ese botón queda "huérfano" (visualmente en "Remove" aunque el producto ya no está en el carrito) hasta que la página se recarga.
- Con `problem_user`, el enlace del nombre/imagen de un producto en el inventario no navega siempre al detalle del producto correcto: durante la exploración, hacer clic en "Sauce Labs Bike Light" llevó al detalle de "Sauce Labs Fleece Jacket".

## Test Scenarios

### 1. Añadir un producto individual desde la tarjeta de inventario (cobertura existente)

**Seed:** `tests/seed.spec.ts`

### 2. Añadir varios productos: contador del badge y coherencia con el carrito

**Seed:** `tests/seed.spec.ts`

#### 2.1 El badge crece con cada producto añadido y el carrito refleja nombre, cantidad y precio de cada uno

**File:** `tests/cart-multiple-items.spec.ts`

**Steps:**
  1. Desde el inventario, añadir al carrito Sauce Labs Backpack, verificando el estado antes y después.
    - expect: Antes de añadir, el badge del carrito no es visible
    - expect: Tras añadir, el badge muestra "1" y el botón de la tarjeta cambia a "Remove"
  2. Añadir también al carrito Sauce Labs Bike Light.
    - expect: El badge muestra "2"
    - expect: El botón de Sauce Labs Bike Light cambia a "Remove"
  3. Añadir también al carrito Sauce Labs Bolt T-Shirt.
    - expect: El badge muestra "3"
    - expect: El botón de Sauce Labs Bolt T-Shirt cambia a "Remove"
  4. Abrir el carrito desde el enlace del carrito (shopping cart link).
    - expect: La URL es /cart.html
    - expect: El título de la página es "Your Cart"
    - expect: El carrito contiene exactamente 3 filas de producto
  5. Verificar cada fila del carrito.
    - expect: La fila de Sauce Labs Backpack muestra cantidad "1" y precio "$29.99"
    - expect: La fila de Sauce Labs Bike Light muestra cantidad "1" y precio "$9.99"
    - expect: La fila de Sauce Labs Bolt T-Shirt muestra cantidad "1" y precio "$15.99"

### 3. Quitar un producto del carrito

**Seed:** `tests/seed.spec.ts`

#### 3.1 Quitar un producto agrupado por origen de la acción (tabla de datos: Inventario | Carrito)

**File:** `tests/remove-from-cart.spec.ts`

**Steps:**
  1. Añadir Sauce Labs Bolt T-Shirt al carrito desde su tarjeta en el inventario.
    - expect: El badge muestra "1"
    - expect: El botón de la tarjeta cambia a "Remove"
  2. Caso A (origen = Inventario): hacer clic en el botón "Remove" de la propia tarjeta de Sauce Labs Bolt T-Shirt en el inventario.
    - expect: El botón de la tarjeta vuelve a mostrar "Add to cart"
    - expect: El badge del carrito deja de ser visible
  3. Añadir de nuevo Sauce Labs Bolt T-Shirt al carrito y abrir "Your Cart".
    - expect: El carrito muestra exactamente 1 fila, la de Sauce Labs Bolt T-Shirt, con cantidad "1"
  4. Caso B (origen = Carrito): dentro de "Your Cart", hacer clic en el botón "Remove" de la fila de Sauce Labs Bolt T-Shirt.
    - expect: La fila del producto desaparece y el carrito queda vacío (sin filas)
    - expect: El badge del carrito deja de ser visible
    - expect: Los botones "Continue Shopping" y "Checkout" siguen visibles

### 4. Añadir y quitar productos desde la página de detalle del producto

**Seed:** `tests/seed.spec.ts`

#### 4.1 Añadir/quitar desde /inventory-item.html mantiene sincronía con el inventario

**File:** `tests/product-detail-cart.spec.ts`

**Steps:**
  1. Desde el inventario, hacer clic en el nombre (o la imagen) de Sauce Labs Backpack.
    - expect: Se navega a la página de detalle del producto (/inventory-item.html)
    - expect: Se muestra el nombre "Sauce Labs Backpack", su descripción y el precio "$29.99"
    - expect: El botón de acción muestra "Add to cart"
  2. Hacer clic en "Add to cart" en la página de detalle.
    - expect: El botón cambia a "Remove"
    - expect: El badge del carrito muestra "1"
  3. Volver al inventario con el botón "Back to products".
    - expect: Se navega de regreso a /inventory.html
    - expect: La tarjeta de Sauce Labs Backpack muestra el botón "Remove"
    - expect: El badge del carrito sigue mostrando "1"
  4. Entrar de nuevo al detalle de Sauce Labs Backpack y hacer clic en "Remove".
    - expect: El botón cambia a "Add to cart"
    - expect: El badge del carrito deja de ser visible
  5. Volver al inventario con "Back to products".
    - expect: La tarjeta de Sauce Labs Backpack vuelve a mostrar "Add to cart"

### 5. Persistencia del carrito al navegar

**Seed:** `tests/seed.spec.ts`

#### 5.1 El carrito sobrevive a Continue Shopping, a recargar la página y a cerrar/volver a iniciar sesión

**File:** `tests/cart-persistence.spec.ts`

**Steps:**
  1. Añadir Sauce Labs Bike Light al carrito desde el inventario.
    - expect: El badge muestra "1"
  2. Abrir el carrito y hacer clic en "Continue Shopping".
    - expect: Se regresa a /inventory.html
    - expect: La tarjeta de Sauce Labs Bike Light sigue mostrando "Remove"
    - expect: El badge sigue mostrando "1"
  3. Recargar la página completa del navegador.
    - expect: Tras la recarga, el badge del carrito sigue mostrando "1"
    - expect: La tarjeta de Sauce Labs Bike Light sigue mostrando "Remove"
  4. Cerrar sesión (Logout) desde el menú lateral y volver a iniciar sesión con el mismo standard_user.
    - expect: El carrito conserva el producto añadido: el badge sigue mostrando "1" y la tarjeta de Sauce Labs Bike Light muestra "Remove"
    - expect: Documentar que SauceDemo no vacía el carrito al cerrar sesión; solo "Reset App State" o quitar el producto manualmente lo hacen

### 6. Interacción entre el ordenamiento del inventario y el estado del carrito

**Seed:** `tests/seed.spec.ts`

#### 6.1 El estado del carrito sobrevive a cada opción de ordenamiento (tabla de datos: Name A-Z | Name Z-A | Price low-high | Price high-low)

**File:** `tests/cart-with-sorting.spec.ts`

**Steps:**
  1. Con el orden por defecto "Name (A to Z)", añadir al carrito Sauce Labs Backpack, Sauce Labs Bolt T-Shirt y Sauce Labs Bike Light (en ese orden).
    - expect: El badge del carrito muestra "3"
  2. Cambiar el ordenamiento del dropdown a "Name (Z to A)" y verificar el estado de todas las tarjetas.
    - expect: El badge sigue mostrando "3"
    - expect: Sauce Labs Backpack, Sauce Labs Bolt T-Shirt y Sauce Labs Bike Light siguen mostrando "Remove" (sin importar su nueva posición en la grilla)
    - expect: Sauce Labs Fleece Jacket, Sauce Labs Onesie y Test.allTheThings() T-Shirt (Red) siguen mostrando "Add to cart"
  3. Cambiar el ordenamiento a "Price (low to high)" y repetir la misma verificación.
    - expect: El badge sigue mostrando "3"
    - expect: Los mismos tres productos añadidos siguen mostrando "Remove" y los otros tres siguen mostrando "Add to cart"
  4. Cambiar el ordenamiento a "Price (high to low)" y repetir la misma verificación.
    - expect: El badge sigue mostrando "3"
    - expect: Los mismos tres productos añadidos siguen mostrando "Remove" y los otros tres siguen mostrando "Add to cart"

### 7. Carrito vacío y añadir todos los productos

**Seed:** `tests/seed.spec.ts`

#### 7.1 El inventario arranca sin badge y el carrito arranca vacío

**File:** `tests/cart-empty-and-full.spec.ts`

**Steps:**
  1. Observar el encabezado del inventario recién cargado, sin haber añadido ningún producto.
    - expect: El badge del carrito no es visible
    - expect: Las 6 tarjetas de producto muestran el botón "Add to cart"
  2. Abrir el carrito sin haber añadido productos.
    - expect: La página /cart.html muestra el título "Your Cart" sin ninguna fila de producto
    - expect: Los botones "Continue Shopping" y "Checkout" son visibles

#### 7.2 Añadir los 6 productos disponibles del catálogo

**File:** `tests/cart-empty-and-full.spec.ts`

**Steps:**
  1. Desde el inventario, hacer clic en "Add to cart" de los 6 productos: Sauce Labs Backpack, Sauce Labs Bike Light, Sauce Labs Bolt T-Shirt, Sauce Labs Fleece Jacket, Sauce Labs Onesie y Test.allTheThings() T-Shirt (Red).
    - expect: El badge del carrito muestra "6"
    - expect: Las 6 tarjetas muestran el botón "Remove"
  2. Abrir el carrito.
    - expect: El carrito contiene exactamente 6 filas de producto, una por cada producto añadido
    - expect: Cada fila muestra cantidad "1" y el mismo precio que se mostraba en su tarjeta de inventario

### 8. Menú lateral "Reset App State" y su efecto sobre el carrito

**Seed:** `tests/seed.spec.ts`

#### 8.1 Reset App State vacía el carrito de inmediato pero no revierte de inmediato los botones ya renderizados

**File:** `tests/reset-app-state.spec.ts`

**Steps:**
  1. Añadir Sauce Labs Backpack y Sauce Labs Bolt T-Shirt al carrito desde el inventario.
    - expect: El badge muestra "2"
  2. Abrir el menú lateral (Open Menu) y hacer clic en "Reset App State".
    - expect: El badge del carrito deja de ser visible de inmediato
    - expect: Las tarjetas de Sauce Labs Backpack y Sauce Labs Bolt T-Shirt pueden seguir mostrando "Remove" en la interfaz aunque el carrito ya está vacío (comportamiento real de la app, no un fallo de la automatización)
  3. Recargar la página completa del inventario.
    - expect: Tras la recarga, las tarjetas de Sauce Labs Backpack y Sauce Labs Bolt T-Shirt muestran "Add to cart"
    - expect: El badge del carrito permanece oculto
    - expect: Abrir el carrito confirma que no contiene ninguna fila de producto
  4. Antes de recargar (repetir el reset), hacer clic en el botón "Remove" que quedó visible tras el reset en una tarjeta cuyo producto ya no está en el carrito.
    - expect: El botón cambia a "Add to cart" únicamente en la interfaz
    - expect: El badge del carrito no cambia (permanece oculto/en 0)

### 9. Comportamiento con problem_user

**Seed:** `tests/seed.spec.ts`

#### 9.1 Añadir un producto al carrito funciona igual que con standard_user (seed adaptado: iniciar sesión con problem_user en vez de standard_user)

**File:** `tests/problem-user.spec.ts`

**Steps:**
  1. Iniciar sesión como problem_user y llegar al inventario.
    - expect: El inventario se muestra con el título "Products"
  2. Añadir Sauce Labs Backpack al carrito desde su tarjeta.
    - expect: El badge del carrito muestra "1"
    - expect: El botón de la tarjeta cambia a "Remove"

#### 9.2 Bug conocido: el enlace del nombre/imagen del producto no siempre navega al detalle correcto (seed adaptado: iniciar sesión con problem_user)

**File:** `tests/problem-user.spec.ts`

**Steps:**
  1. Iniciar sesión como problem_user y, desde el inventario, hacer clic en el nombre de Sauce Labs Bike Light.
    - expect: La navegación no lleva al detalle de Sauce Labs Bike Light sino al de otro producto del catálogo (durante la exploración se observó que siempre lleva a Sauce Labs Fleece Jacket, sin importar en qué producto se hizo clic)
    - expect: Documentar este resultado como comportamiento esperado y conocido de problem_user, no como un fallo de la suite

### 10. Comportamiento con performance_glitch_user

**Seed:** `tests/seed.spec.ts`

#### 10.1 Añadir un producto al carrito funciona igual que con standard_user, con mayor latencia (seed adaptado: iniciar sesión con performance_glitch_user)

**File:** `tests/performance-glitch-user.spec.ts`

**Steps:**
  1. Iniciar sesión como performance_glitch_user, esperando que la carga inicial del inventario pueda tardar notablemente más que con standard_user.
    - expect: El inventario finalmente se muestra con el título "Products"
  2. Añadir Sauce Labs Backpack al carrito y abrir "Your Cart".
    - expect: El badge del carrito muestra "1"
    - expect: El carrito muestra 1 fila con Sauce Labs Backpack, cantidad "1" y precio "$29.99"
    - expect: El resultado funcional es idéntico al de standard_user; solo cambian los tiempos de respuesta
