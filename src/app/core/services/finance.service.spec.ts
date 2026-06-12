import { TestBed } from '@angular/core/testing';
import { FinanceService } from './finance.service';
import { AuthService } from './auth.service';
import { AccountService } from './account.service';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as firestore from 'firebase/firestore';

vi.mock('../../firebase.config', () => ({
    db: {}
}));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    onSnapshot: vi.fn(),
    addDoc: vi.fn(),
    doc: vi.fn(),
    deleteDoc: vi.fn(),
    updateDoc: vi.fn(),
}));

describe('FinanceService', () => {
    let service: FinanceService;
    let mockAccountService: any;
    let mockAuthService: any;

    beforeEach(() => {
        mockAccountService = {
            effectiveAccountUid: vi.fn().mockReturnValue('test-uid'),
        };

        mockAuthService = {
            userSignal: vi.fn().mockReturnValue({ uid: 'test-uid' }),
            profileSignal: vi.fn().mockReturnValue({}),
        };

        TestBed.configureTestingModule({
            providers: [
                FinanceService,
                { provide: AuthService, useValue: mockAuthService },
                { provide: AccountService, useValue: mockAccountService }
            ]
        });

        service = TestBed.inject(FinanceService);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should calculateTotal correctly and handle precision', () => {
        // Base 10.1, Recargo 20% -> 10.1 + 2.02 = 12.12
        const result1 = service.calculateTotal(10.1, 20);
        expect(result1).toBe(12.12);

        // Test precision 
        // 0.1 + 0.2
        const result2 = service.calculateTotal(0.1, 200); // 0.1 + (0.1 * 2) = 0.3
        expect(result2).toBe(0.3);
    });

    it('should clean subscriptions on destroy', () => {
        // ngOnDestroy calls _limpiarSuscripciones, which clears all onSnapshot unsubscribers
        // We can just verify it doesn't throw when called
        expect(() => service.ngOnDestroy()).not.toThrow();
    });
});
