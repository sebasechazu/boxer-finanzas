import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = async () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const user = await authService.waitForAuth();

    if (user) {
        return true;
    }
    return router.parseUrl('/login');
};