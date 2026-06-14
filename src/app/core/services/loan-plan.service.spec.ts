import { TestBed } from '@angular/core/testing';
import { LoanPlanService } from './loan-plan.service';
import { AccountService } from './account.service';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

vi.mock('../../firebase.config', () => ({
    db: {}
}));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    onSnapshot: vi.fn(),
    addDoc: vi.fn().mockResolvedValue({ id: 'new-plan-id' }),
    doc: vi.fn().mockReturnValue('mockDocRef'),
    deleteDoc: vi.fn().mockResolvedValue(undefined),
    updateDoc: vi.fn().mockResolvedValue(undefined)
}));

describe('LoanPlanService', () => {
    let service: LoanPlanService;
    let mockAccountService: any;

    beforeEach(() => {
        mockAccountService = {
            effectiveAccountUid: vi.fn().mockReturnValue('user123')
        };

        TestBed.configureTestingModule({
            providers: [
                LoanPlanService,
                { provide: AccountService, useValue: mockAccountService }
            ]
        });

        service = TestBed.inject(LoanPlanService);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('debe llamar a addDoc en addLoanPlan', async () => {
        const { addDoc } = await import('firebase/firestore');

        const res = await service.addLoanPlan({
            nombre: 'Plan 1',
            montoBase: 1000,
            porcentajeRecargo: 10,
            cuotasCount: 5,
            periodicidad: 'SEMANAL'
        });

        expect(addDoc).toHaveBeenCalled();
        expect(res.id).toBe('new-plan-id');
    });

    it('debe llamar a updateDoc en updateLoanPlan', async () => {
        const { updateDoc } = await import('firebase/firestore');

        await service.updateLoanPlan('plan-1', { nombre: 'Plan Editado' });

        expect(updateDoc).toHaveBeenCalled();
    });

    it('debe llamar a deleteDoc en deleteLoanPlan', async () => {
        const { deleteDoc } = await import('firebase/firestore');

        await service.deleteLoanPlan('plan-1');

        expect(deleteDoc).toHaveBeenCalled();
    });
});
