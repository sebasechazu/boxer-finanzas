import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoanModalComponent } from './loan-modal.component';
import { OperationService } from '../../../../core/services/operation.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SimpleChange } from '@angular/core';

describe('LoanModalComponent', () => {
    let component: LoanModalComponent;
    let fixture: ComponentFixture<LoanModalComponent>;
    let mockOperationService: any;

    beforeEach(async () => {
        mockOperationService = {
            calculateTotal: vi.fn().mockImplementation((m, p) => m + m * (p / 100))
        };

        await TestBed.configureTestingModule({
            imports: [LoanModalComponent],
            providers: [
                { provide: OperationService, useValue: mockOperationService }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(LoanModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('debe resetear el formulario si isOpen cambia a true y no se esta editando', () => {
        component.loanForm.setValue({ nombre: 'Plan', montoBase: 50, porcentajeRecargo: 10, cuotasCount: 5, periodicidad: 'SEMANAL', diaSemana: 2, diaVencimiento: 10 });
        fixture.componentRef.setInput('editingLoanId', null);
        fixture.componentRef.setInput('isOpen', true);
        fixture.detectChanges();
        expect(component.loanForm.value).toEqual({ nombre: '', montoBase: 0, porcentajeRecargo: 0, cuotasCount: 1, periodicidad: 'MENSUAL', diaSemana: 1, diaVencimiento: 5 });
    });

    it('debe cargar los datos en el formulario si initialData cambia', () => {
        component.loanForm.reset();
        const initialData = { nombre: 'Plan Viejo', montoBase: 100, porcentajeRecargo: 10, cuotasCount: 5, periodicidad: 'SEMANAL', diaSemana: 3, diaVencimiento: 15 };
        fixture.componentRef.setInput('initialData', initialData);
        fixture.detectChanges();
        expect(component.loanForm.value).toEqual({ nombre: 'Plan Viejo', montoBase: 100, porcentajeRecargo: 10, cuotasCount: 5, periodicidad: 'SEMANAL', diaSemana: 3, diaVencimiento: 15 });
    });

    it('debe calcular vista previa del total usando operationService', () => {
        component.loanForm.setValue({ nombre: 'Plan', montoBase: 100, porcentajeRecargo: 10, cuotasCount: 5, periodicidad: 'SEMANAL', diaSemana: 2, diaVencimiento: 10 });
        const preview = component.calculateTotalPreview();
        expect(mockOperationService.calculateTotal).toHaveBeenCalledWith(100, 10);
        expect(preview).toBe(110);
    });

    it('debe emitir save si el formulario es valido en onSubmit', () => {
        const spySave = vi.spyOn(component.save, 'emit');
        component.loanForm.setValue({ nombre: 'Plan Valido', montoBase: 100, porcentajeRecargo: 10, cuotasCount: 5, periodicidad: 'SEMANAL', diaSemana: 2, diaVencimiento: 10 });
        fixture.componentRef.setInput('isSaving', false);
        fixture.detectChanges();
        component.onSubmit();
        expect(spySave).toHaveBeenCalledWith({ nombre: 'Plan Valido', montoBase: 100, porcentajeRecargo: 10, cuotasCount: 5, periodicidad: 'SEMANAL', diaSemana: 2, diaVencimiento: 10 });
    });
});
