import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('authGuard', () => {
    let mockAuthService: any;
    let mockRouter: any;
    const mockUrlTree = {} as UrlTree;

    beforeEach(() => {
        mockAuthService = {
            waitForAuth: vi.fn()
        };

        mockRouter = {
            parseUrl: vi.fn().mockReturnValue(mockUrlTree)
        };

        TestBed.configureTestingModule({
            providers: [
                { provide: AuthService, useValue: mockAuthService },
                { provide: Router, useValue: mockRouter }
            ]
        });
    });

    it('should return true if user is authenticated', async () => {
        mockAuthService.waitForAuth.mockResolvedValue({ uid: 'user123' });

        const result = await TestBed.runInInjectionContext(() => authGuard());

        expect(result).toBe(true);
        expect(mockAuthService.waitForAuth).toHaveBeenCalled();
    });

    it('should redirect to /login if user is not authenticated', async () => {
        mockAuthService.waitForAuth.mockResolvedValue(null);

        const result = await TestBed.runInInjectionContext(() => authGuard());

        expect(result).toBe(mockUrlTree);
        expect(mockRouter.parseUrl).toHaveBeenCalledWith('/login');
    });
});
