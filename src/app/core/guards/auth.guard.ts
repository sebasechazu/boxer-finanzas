import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { environment } from '../environments/environment';

export const authGuard = async () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const user = await authService.waitForAuth();

    // VULN-01 fix: verificar que el usuario exista Y tenga el correo verificado,
    // o que use un proveedor externo (Google, etc.) que verifica por defecto.
    // Excepción: omitimos esto en modo emulador.
    const isDevMode = environment.useEmulators;
    const esVerificado = user?.emailVerified || user?.providerData?.[0]?.providerId !== 'password' || isDevMode;
    if (user && esVerificado) {
        return true;
    }
    return router.parseUrl('/login');
};