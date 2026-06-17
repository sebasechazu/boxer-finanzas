import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OperationModalComponent } from './operation-modal.component';
import { ClientService } from '../../../../core/services/client.service';
import { ArticleService } from '../../../../core/services/article.service';
import { LoanPlanService } from '../../../../core/services/loan-plan.service';
import { OperationService } from '../../../../core/services/operation.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal, SimpleChange } from '@angular/core';

describe('OperationModalComponent', () => {
    let component: OperationModalComponent;
    let fixture: ComponentFixture<OperationModalComponent>;
    let mockClientService: any;
    let mockArticleService: any;
    let mockLoanPlanService: any;
    let mockOperationService: any;

    beforeEach(async () => {
        mockClientService = {
            userClients: signal([])
        };

        mockArticleService = {
            userArticles: signal([
                { id: 'art1', nombre: 'Art 1', precioVentaContado: 150 }
            ])
        };

        mockLoanPlanService = {
            userLoanPlans: signal([
                { id: 'plan1', nombrePlan: 'Plan 1', montoBase: 200, porcentajeRecargo: 10, cuotasCount: 5, periodicidad: 'SEMANAL' }
            ])
        };

        mockOperationService = {
            calculateTotal: vi.fn().mockImplementation((m, p) => m + m * (p / 100))
        };

        await TestBed.configureTestingModule({
            imports: [OperationModalComponent],
            providers: [
                { provide: ClientService, useValue: mockClientService },
                { provide: ArticleService, useValue: mockArticleService },
                { provide: LoanPlanService, useValue: mockLoanPlanService },
                { provide: OperationService, useValue: mockOperationService }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(OperationModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('debe resetear el formulario si isOpen cambia a true y no se esta editando', () => {
        component.opForm.setValue({
            tipo: 'PRESTAMO', montoBase: 100, porcentajeRecargo: 10, clienteId: 'c1', articuloId: '', prestamoId: '',
            cuotasCount: 5, tieneVencimiento: true, periodicidad: 'SEMANAL', diaSemana: 2, diaVencimiento: 10, fechaPrimerVencimiento: '2026-06-17'
        });
        fixture.componentRef.setInput('operationIdToEdit', null);
        fixture.componentRef.setInput('isOpen', true);
        fixture.detectChanges();
        expect(component.opForm.value.tipo).toBe('VENTA');
        expect(component.opForm.value.montoBase).toBe(0);
    });

    it('debe cargar los datos en el formulario si initialData cambia', () => {
        const data = {
            tipo: 'PRESTAMO', montoBase: 200, porcentajeRecargo: 15, clienteId: 'c2', articuloId: '', prestamoId: 'plan1',
            cuotasCount: 4, tieneVencimiento: true, periodicidad: 'MENSUAL', diaSemana: 1, diaVencimiento: 5, fechaPrimerVencimiento: '2026-06-17'
        };
        fixture.componentRef.setInput('initialData', data);
        fixture.detectChanges();
        expect(component.opForm.value).toEqual(data);
    });

    it('debe actualizar el montoBase si cambia el articulo en onArticleChange', () => {
        component.onArticleChange({ detail: { value: 'art1' } });
        expect(component.opForm.value.montoBase).toBe(150);
    });

    it('debe actualizar los campos del formulario si cambia el prestamo en onLoanChange', () => {
        component.onLoanChange({ detail: { value: 'plan1' } });
        expect(component.opForm.value.montoBase).toBe(200);
        expect(component.opForm.value.porcentajeRecargo).toBe(10);
        expect(component.opForm.value.cuotasCount).toBe(5);
        expect(component.opForm.value.periodicidad).toBe('SEMANAL');
    });

    it('debe emitir save si el formulario es valido en onSubmit', () => {
        const spySave = vi.spyOn(component.save, 'emit');
        component.opForm.setValue({
            tipo: 'VENTA', montoBase: 100, porcentajeRecargo: 10, clienteId: 'c1', articuloId: 'art1', prestamoId: '',
            cuotasCount: 1, tieneVencimiento: false, periodicidad: 'MENSUAL', diaSemana: 1, diaVencimiento: 5, fechaPrimerVencimiento: '2026-06-17'
        });
        fixture.componentRef.setInput('isSaving', false);
        fixture.detectChanges();
        component.onSubmit();
        expect(spySave).toHaveBeenCalled();
    });
});
