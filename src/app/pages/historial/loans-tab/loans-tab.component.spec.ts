import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoansTabComponent } from './loans-tab.component';
import { LoanPlanService } from '../../../core/services/loan-plan.service';
import { UiService } from '../../../core/services/ui.service';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createLoanPlanServiceMock, createUiServiceMock } from '../../../testing/mocks';

describe('LoansTabComponent', () => {
    let component: LoansTabComponent;
    let fixture: ComponentFixture<LoansTabComponent>;
    let mockLoanPlanService: any;
    let mockUiService: any;

    beforeEach(async () => {
        mockLoanPlanService = createLoanPlanServiceMock();
        mockUiService = createUiServiceMock();

        await TestBed.configureTestingModule({
            imports: [LoansTabComponent],
            providers: [
                { provide: LoanPlanService, useValue: mockLoanPlanService },
                { provide: UiService, useValue: mockUiService }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(LoansTabComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('debe abrir modal en modo creacion', () => {
        component.openAddModal();
        expect(component.isModalOpen).toBe(true);
        expect(component.editingLoanId).toBeNull();
        expect(component.initialLoanData).toBeNull();
    });

    it('debe abrir modal en modo edicion con datos', () => {
        const loan = { id: 'l1', nombrePlan: 'Plan A', montoBase: 100, porcentajeRecargo: 10, cuotasCount: 5, periodicidad: 'SEMANAL', diaSemana: 1, usuarioId: 'u1' };
        component.editLoan(loan);
        expect(component.isModalOpen).toBe(true);
        expect(component.editingLoanId).toBe('l1');
        expect(component.initialLoanData).toEqual(loan);
    });

    it('debe cerrar modal', () => {
        component.isModalOpen = true;
        component.closeModal();
        expect(component.isModalOpen).toBe(false);
    });

    it('debe llamar a uiService.showConfirmAlert en deleteLoan', async () => {
        await component.deleteLoan('l1');
        expect(mockUiService.showConfirmAlert).toHaveBeenCalled();
    });

    it('debe llamar a loanPlanService.addLoanPlan en onSaveLoan', async () => {
        await component.onSaveLoan({ nombrePlan: 'Plan A', montoBase: '100', porcentajeRecargo: '10', cuotasCount: '5', periodicidad: 'MENSUAL', diaVencimiento: '5' });
        expect(mockLoanPlanService.addLoanPlan).toHaveBeenCalledWith({ nombrePlan: 'Plan A', montoBase: 100, porcentajeRecargo: 10, cuotasCount: 5, periodicidad: 'MENSUAL', diaVencimiento: 5 });
    });
});
