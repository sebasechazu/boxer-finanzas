import { test, expect } from '@playwright/test';

test.describe('Core Flow: Cliente -> Artículo -> Préstamo -> Operaciones', () => {
  const uniqueId = Date.now();
  const testEmail = `test_${uniqueId}@example.com`;
  const testPass = '123456';

  test('Debería poder registrar un usuario, crear entidades y generar operaciones', async ({ page }) => {
    // 1. Registro e inicio de sesión
    await page.goto('/');
    
    // Ir a registro
    await page.getByText('¿No tienes cuenta? Regístrate').click();
    
    // Llenar formulario de registro
    await page.locator('app-register ion-input[name="email"] input').fill(testEmail);
    await page.locator('app-register ion-input[name="password"] input').fill(testPass);
    await page.locator('app-register').getByRole('button', { name: 'Registrarse' }).click();

    // El sistema fuerza un cierre de sesión tras registrarse para validar el correo, así que iniciaremos sesión
    await expect(page).toHaveURL(/.*\/login/);

    await page.locator('app-login ion-input[name="email"] input').fill(testEmail);
    // Debug logs
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    await page.locator('app-login ion-input[name="email"] input').fill(testEmail);
    await page.locator('app-login ion-input[name="password"] input').fill(testPass);
    
    // Forzamos blur para que ngModel se actualice
    await page.locator('app-login ion-input[name="email"] input').blur();
    await page.locator('app-login ion-input[name="password"] input').blur();

    await page.locator('app-login').getByRole('button', { name: 'Iniciar sesión' }).click();

    // Comprobar si hay un toast de error visible
    const errorToast = page.locator('ion-toast');
    try {
      await expect(errorToast).not.toBeVisible({ timeout: 2000 });
    } catch (e) {
      console.log('HAY UN TOAST DE ERROR:', await errorToast.textContent());
    }

    // Esperar a estar en el dashboard
    await expect(page).toHaveURL(/.*\/tabs\/dashboard/, { timeout: 15000 });

    // 2. Crear Cliente
    await page.getByRole('tab', { name: 'Clientes' }).click();
    await page.getByRole('button', { name: 'Nuevo Cliente' }).click();
    
    await page.getByLabel('Nombre Completo').fill('Juan Pérez E2E');
    await page.getByLabel('Teléfono / Celular').fill('1122334455');
    await page.getByRole('button', { name: 'Guardar' }).click();
    
    // Verificar que aparece
    await expect(page.getByText('Juan Pérez E2E')).toBeVisible();

    // 3. Ir a Historial y crear Artículo
    await page.getByRole('tab', { name: 'Historial' }).click();
    
    // Asumimos que la pestaña de Artículos es visible o es el primer segmento
    await page.getByRole('button', { name: 'Artículos' }).click();
    await page.getByRole('button', { name: 'Nuevo Artículo' }).click();
    
    await page.getByLabel('Nombre del Artículo').fill('Notebook E2E');
    await page.getByLabel('Precio de Compra').fill('50000');
    await page.getByLabel('Precio de Venta (Contado)').fill('75000');
    await page.getByRole('button', { name: 'Guardar' }).click();
    
    await expect(page.getByText('Notebook E2E')).toBeVisible();

    // 4. Crear Plan de Préstamo
    await page.getByRole('button', { name: 'Planes de Préstamo' }).click();
    await page.getByRole('button', { name: 'Nuevo Plan' }).click();
    
    await page.getByLabel('Nombre del Plan').fill('Préstamo 100k E2E');
    await page.getByLabel('Monto Base').fill('100000');
    await page.getByLabel('% de Recargo / Interés').fill('30');
    await page.getByLabel('Cantidad de Cuotas').fill('5');
    await page.getByRole('button', { name: 'Guardar' }).click();

    await expect(page.getByText('Préstamo 100k E2E')).toBeVisible();

    // 5. Crear Operación (Venta)
    await page.getByRole('button', { name: 'Operaciones' }).click();
    await page.getByRole('button', { name: 'Nueva Operación' }).click();

    // Seleccionar Cliente
    await page.locator('ion-select[formControlName="clienteId"]').click();
    await page.getByRole('radio', { name: /Juan Pérez E2E/i }).click();
    await page.getByRole('button', { name: 'OK' }).click();

    // Seleccionar Artículo
    await page.locator('ion-select[formControlName="articuloId"]').click();
    await page.getByRole('radio', { name: /Notebook E2E/i }).click();
    await page.getByRole('button', { name: 'OK' }).click();

    // Guardar Operación Venta
    await page.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('Venta').first()).toBeVisible();

    // 6. Crear Operación (Préstamo) con autocompletado
    await page.getByRole('button', { name: 'Nueva Operación' }).click();
    
    await page.locator('ion-select[formControlName="clienteId"]').click();
    await page.getByRole('radio', { name: /Juan Pérez E2E/i }).click();
    await page.getByRole('button', { name: 'OK' }).click();

    await page.locator('ion-select[formControlName="tipo"]').click();
    await page.getByRole('radio', { name: 'Préstamo' }).click();
    await page.getByRole('button', { name: 'OK' }).click();

    await page.locator('ion-select[formControlName="prestamoId"]').click();
    await page.getByRole('radio', { name: /Préstamo 100k E2E/i }).click();
    await page.getByRole('button', { name: 'OK' }).click();

    await page.getByRole('button', { name: 'Guardar' }).click();

    // Verificar que haya dos operaciones
    await expect(page.locator('ion-item-divider').filter({ hasText: 'Operaciones' }).locator('..').locator('ion-item')).toHaveCount(2);
  });
});
