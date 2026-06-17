import { test, expect } from '@playwright/test';

test.describe('Core Flow: Cliente -> Artículo -> Préstamo -> Operaciones', () => {
  const uniqueId = Date.now();
  const testEmail = `test_${uniqueId}@example.com`;
  const testPass = '123456';

  test('Debería poder registrar un usuario, crear entidades y generar operaciones', async ({ page }) => {
    // 1. Inicio de sesión con usuario pre-sembrado (seed)
    await page.goto('/login');
    
    // Debug logs
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // El seed script crea este usuario por defecto: usuario1@local.test / 123456
    await page.locator('app-login ion-input[name="email"] input').fill('usuario1@local.test');
    await page.locator('app-login ion-input[name="password"] input').fill('123456');
    
    // Forzamos blur para que ngModel se actualice
    await page.locator('app-login ion-input[name="email"] input').blur();
    await page.locator('app-login ion-input[name="password"] input').blur();

    await page.locator('app-login').getByRole('button', { name: 'Iniciar sesión' }).click();

    // Esperar a estar en el dashboard
    await expect(page).toHaveURL(/.*\/tabs\/dashboard/, { timeout: 15000 });

    const uniquePhone = Date.now().toString();
    const uniqueSuffix = Date.now().toString().slice(-6); // last 6 digits for uniqueness
    
    // Generar apellido único usando letras aleatorias para pasar la validación (letras y 2 palabras)
    const randomLetters = String.fromCharCode(
        97 + Math.floor(Math.random() * 26),
        97 + Math.floor(Math.random() * 26),
        97 + Math.floor(Math.random() * 26),
        97 + Math.floor(Math.random() * 26)
    );
    const clientName = 'Juan ' + randomLetters;
    const articleName = 'Notebook ' + uniqueSuffix;
    const loanName = 'Prestamo ' + uniqueSuffix;

    // 2. Crear Cliente
    await page.locator('ion-tab-button[tab="clients"]').click();
    await page.locator('app-clients ion-fab-button').click();
    
    await page.locator('ion-input[formControlName="nombre"] input').fill(clientName);
    await page.locator('ion-input[formControlName="telefono"] input').fill(uniquePhone);
    
    // Forzamos blur
    await page.locator('ion-input[formControlName="nombre"] input').blur();
    await page.locator('ion-input[formControlName="telefono"] input').blur();

    await page.getByRole('button', { name: 'Guardar Cliente' }).click();
    await expect(page.locator('ion-modal.show-modal')).toHaveCount(0);
    
    // Verificar que aparece
    await expect(page.getByText(clientName)).toBeVisible();

    // 3. Ir a Historial y crear Artículo
    await page.locator('ion-tab-button[tab="historial"]').click();
    
    await page.locator('ion-segment-button[value="articulos"]').click();
    await page.locator('app-articles-tab ion-fab-button').click();
    
    await page.locator('ion-input[formControlName="nombre"] input').fill(articleName);
    await page.locator('ion-input[formControlName="precioCompra"] input').fill('50000');
    await page.locator('ion-input[formControlName="precioVentaContado"] input').fill('75000');
    
    await page.locator('ion-input[formControlName="nombre"] input').blur();
    await page.locator('ion-input[formControlName="precioCompra"] input').blur();
    await page.locator('ion-input[formControlName="precioVentaContado"] input').blur();

    await page.getByRole('button', { name: 'Guardar Artículo' }).click();
    await expect(page.locator('ion-modal.show-modal')).toHaveCount(0);
    
    await expect(page.getByText(articleName)).toBeVisible();

    // 4. Crear Plan de Préstamo
    await page.locator('ion-segment-button[value="prestamos"]').click();
    await page.locator('app-loans-tab ion-fab-button').click();
    
    await page.locator('ion-input[formControlName="nombre"] input').fill(loanName);
    await page.locator('ion-input[formControlName="montoBase"] input').fill('100000');
    await page.locator('ion-input[formControlName="porcentajeRecargo"] input').fill('30');
    await page.locator('ion-input[formControlName="cuotasCount"] input').fill('5');

    await page.locator('ion-input[formControlName="nombre"] input').blur();
    await page.locator('ion-input[formControlName="montoBase"] input').blur();
    await page.locator('ion-input[formControlName="porcentajeRecargo"] input').blur();
    await page.locator('ion-input[formControlName="cuotasCount"] input').blur();

    await page.getByRole('button', { name: 'Guardar Plan' }).click();
    await expect(page.locator('ion-modal.show-modal')).toHaveCount(0);

    await expect(page.getByText(loanName)).toBeVisible();

    // 5. Crear Operación (Venta)
    await page.locator('ion-segment-button[value="operaciones"]').click();
    await page.locator('app-operations-tab ion-fab-button').click();

    // Seleccionar Cliente
    await page.locator('ion-modal ion-select[formControlName="clienteId"]').click();
    await page.getByRole('radio', { name: new RegExp(clientName, 'i') }).first().click();
    await page.getByRole('button', { name: 'OK' }).click();

    // Seleccionar Artículo
    await page.locator('ion-modal ion-select[formControlName="articuloId"]').click();
    await page.getByRole('radio', { name: new RegExp(articleName, 'i') }).click();
    await page.getByRole('button', { name: 'OK' }).click();

    // Guardar Operación Venta
    await page.getByRole('button', { name: 'Confirmar Operación' }).click();
    await expect(page.locator('ion-modal.show-modal')).toHaveCount(0);
    
    await expect(page.getByText('Venta').first()).toBeVisible();

    // 6. Crear Operación (Préstamo) con autocompletado
    await page.locator('app-operations-tab ion-fab-button').click();

    await page.locator('ion-modal ion-select[formControlName="clienteId"]').click();
    await page.getByRole('radio', { name: new RegExp(clientName, 'i') }).first().click();
    await page.getByRole('button', { name: 'OK' }).click();

    await page.locator('ion-select[formControlName="tipo"]').click();
    await page.getByRole('radio', { name: 'Préstamo' }).click();
    await page.getByRole('button', { name: 'OK' }).click();

    await page.locator('ion-select[formControlName="prestamoId"]').click();
    await page.getByRole('radio', { name: new RegExp(loanName, 'i') }).click();
    await page.getByRole('button', { name: 'OK' }).click();

    await page.getByRole('button', { name: 'Confirmar Operación' }).click();
    await expect(page.locator('ion-modal.show-modal')).toHaveCount(0);

    // Verificar que haya dos operaciones
    await expect(page.locator('ion-item-divider').filter({ hasText: 'Operaciones' }).locator('..').locator('ion-item')).toHaveCount(2);
  });
});
