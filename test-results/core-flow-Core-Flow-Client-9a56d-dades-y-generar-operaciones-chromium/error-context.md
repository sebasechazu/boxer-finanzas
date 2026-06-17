# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: core-flow.spec.ts >> Core Flow: Cliente -> Artículo -> Préstamo -> Operaciones >> Debería poder registrar un usuario, crear entidades y generar operaciones
- Location: e2e\core-flow.spec.ts:8:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*\/tabs\/dashboard/
Received string:  "http://localhost:4200/login"
Timeout: 15000ms

Call log:
  - Expect "toHaveURL" with timeout 15000ms
    33 × unexpected value "http://localhost:4200/login"

```

```yaml
- main:
  - img "Boxer Logo"
  - paragraph: Reconectando...
  - progressbar:
    - img
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Core Flow: Cliente -> Artículo -> Préstamo -> Operaciones', () => {
  4   |   const uniqueId = Date.now();
  5   |   const testEmail = `test_${uniqueId}@example.com`;
  6   |   const testPass = '123456';
  7   | 
  8   |   test('Debería poder registrar un usuario, crear entidades y generar operaciones', async ({ page }) => {
  9   |     // 1. Registro e inicio de sesión
  10  |     await page.goto('/');
  11  |     
  12  |     // Ir a registro
  13  |     await page.getByText('¿No tienes cuenta? Regístrate').click();
  14  |     
  15  |     // Llenar formulario de registro
  16  |     await page.locator('app-register ion-input[name="email"] input').fill(testEmail);
  17  |     await page.locator('app-register ion-input[name="password"] input').fill(testPass);
  18  |     await page.locator('app-register').getByRole('button', { name: 'Registrarse' }).click();
  19  | 
  20  |     // El sistema fuerza un cierre de sesión tras registrarse para validar el correo, así que iniciaremos sesión
  21  |     await expect(page).toHaveURL(/.*\/login/);
  22  | 
  23  |     await page.locator('app-login ion-input[name="email"] input').fill(testEmail);
  24  |     // Debug logs
  25  |     page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  26  | 
  27  |     await page.locator('app-login ion-input[name="email"] input').fill(testEmail);
  28  |     await page.locator('app-login ion-input[name="password"] input').fill(testPass);
  29  |     
  30  |     // Forzamos blur para que ngModel se actualice
  31  |     await page.locator('app-login ion-input[name="email"] input').blur();
  32  |     await page.locator('app-login ion-input[name="password"] input').blur();
  33  | 
  34  |     await page.locator('app-login').getByRole('button', { name: 'Iniciar sesión' }).click();
  35  | 
  36  |     // Comprobar si hay un toast de error visible
  37  |     const errorToast = page.locator('ion-toast');
  38  |     try {
  39  |       await expect(errorToast).not.toBeVisible({ timeout: 2000 });
  40  |     } catch (e) {
  41  |       console.log('HAY UN TOAST DE ERROR:', await errorToast.textContent());
  42  |     }
  43  | 
  44  |     // Esperar a estar en el dashboard
> 45  |     await expect(page).toHaveURL(/.*\/tabs\/dashboard/, { timeout: 15000 });
      |                        ^ Error: expect(page).toHaveURL(expected) failed
  46  | 
  47  |     // 2. Crear Cliente
  48  |     await page.getByRole('tab', { name: 'Clientes' }).click();
  49  |     await page.getByRole('button', { name: 'Nuevo Cliente' }).click();
  50  |     
  51  |     await page.getByLabel('Nombre Completo').fill('Juan Pérez E2E');
  52  |     await page.getByLabel('Teléfono / Celular').fill('1122334455');
  53  |     await page.getByRole('button', { name: 'Guardar' }).click();
  54  |     
  55  |     // Verificar que aparece
  56  |     await expect(page.getByText('Juan Pérez E2E')).toBeVisible();
  57  | 
  58  |     // 3. Ir a Historial y crear Artículo
  59  |     await page.getByRole('tab', { name: 'Historial' }).click();
  60  |     
  61  |     // Asumimos que la pestaña de Artículos es visible o es el primer segmento
  62  |     await page.getByRole('button', { name: 'Artículos' }).click();
  63  |     await page.getByRole('button', { name: 'Nuevo Artículo' }).click();
  64  |     
  65  |     await page.getByLabel('Nombre del Artículo').fill('Notebook E2E');
  66  |     await page.getByLabel('Precio de Compra').fill('50000');
  67  |     await page.getByLabel('Precio de Venta (Contado)').fill('75000');
  68  |     await page.getByRole('button', { name: 'Guardar' }).click();
  69  |     
  70  |     await expect(page.getByText('Notebook E2E')).toBeVisible();
  71  | 
  72  |     // 4. Crear Plan de Préstamo
  73  |     await page.getByRole('button', { name: 'Planes de Préstamo' }).click();
  74  |     await page.getByRole('button', { name: 'Nuevo Plan' }).click();
  75  |     
  76  |     await page.getByLabel('Nombre del Plan').fill('Préstamo 100k E2E');
  77  |     await page.getByLabel('Monto Base').fill('100000');
  78  |     await page.getByLabel('% de Recargo / Interés').fill('30');
  79  |     await page.getByLabel('Cantidad de Cuotas').fill('5');
  80  |     await page.getByRole('button', { name: 'Guardar' }).click();
  81  | 
  82  |     await expect(page.getByText('Préstamo 100k E2E')).toBeVisible();
  83  | 
  84  |     // 5. Crear Operación (Venta)
  85  |     await page.getByRole('button', { name: 'Operaciones' }).click();
  86  |     await page.getByRole('button', { name: 'Nueva Operación' }).click();
  87  | 
  88  |     // Seleccionar Cliente
  89  |     await page.locator('ion-select[formControlName="clienteId"]').click();
  90  |     await page.getByRole('radio', { name: /Juan Pérez E2E/i }).click();
  91  |     await page.getByRole('button', { name: 'OK' }).click();
  92  | 
  93  |     // Seleccionar Artículo
  94  |     await page.locator('ion-select[formControlName="articuloId"]').click();
  95  |     await page.getByRole('radio', { name: /Notebook E2E/i }).click();
  96  |     await page.getByRole('button', { name: 'OK' }).click();
  97  | 
  98  |     // Guardar Operación Venta
  99  |     await page.getByRole('button', { name: 'Guardar' }).click();
  100 |     await expect(page.getByText('Venta').first()).toBeVisible();
  101 | 
  102 |     // 6. Crear Operación (Préstamo) con autocompletado
  103 |     await page.getByRole('button', { name: 'Nueva Operación' }).click();
  104 |     
  105 |     await page.locator('ion-select[formControlName="clienteId"]').click();
  106 |     await page.getByRole('radio', { name: /Juan Pérez E2E/i }).click();
  107 |     await page.getByRole('button', { name: 'OK' }).click();
  108 | 
  109 |     await page.locator('ion-select[formControlName="tipo"]').click();
  110 |     await page.getByRole('radio', { name: 'Préstamo' }).click();
  111 |     await page.getByRole('button', { name: 'OK' }).click();
  112 | 
  113 |     await page.locator('ion-select[formControlName="prestamoId"]').click();
  114 |     await page.getByRole('radio', { name: /Préstamo 100k E2E/i }).click();
  115 |     await page.getByRole('button', { name: 'OK' }).click();
  116 | 
  117 |     await page.getByRole('button', { name: 'Guardar' }).click();
  118 | 
  119 |     // Verificar que haya dos operaciones
  120 |     await expect(page.locator('ion-item-divider').filter({ hasText: 'Operaciones' }).locator('..').locator('ion-item')).toHaveCount(2);
  121 |   });
  122 | });
  123 | 
```