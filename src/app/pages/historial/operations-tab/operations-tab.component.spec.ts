import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OperationsTabComponent } from './operations-tab.component';
import { OperationService } from '../../../core/services/operation.service';
import { UiService } from '../../../core/services/ui.service';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createOperationServiceMock, createUiServiceMock } from '../../../testing/mocks';

describe('OperationsTabComponent', () => {
    let component: OperationsTabComponent;
    let fixture: ComponentFixture<OperationsTabComponent>;
    let mockOperationService: any;
    let mockUiService: any;

    beforeEach(async () => {
        mockOperationService = createOperationServiceMock();
        mockUiService = createUiServiceMock();

        await TestBed.configureTestingModule({
            imports: [OperationsTabComponent],
            providers: [
                { provide: OperationService, useValue: mockOperationService },
                { provide: UiService, useValue: mockUiService }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(OperationsTabComponent);
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
        expect(component.operationIdToEdit).toBeNull();
        expect(component.initialOperationData).toBeNull();
    });

    it('debe cargar datos al abrir en modo edicion para VENTA', () => {
        const op = { id: 'op1', tipo: 'VENTA', ventaId: 'v1', clienteId: 'c1', cuotasCount: 3, periodicidad: 'SEMANAL', diaSemana: 2, fechaPrimerVencimiento: '2026-06-17T00:00:00Z' };
        mockOperationService.userOperations.set([op]);
        mockOperationService.userSales.set([{ id: 'v1', montoBase: 100, porcentajeRecargo: 10, articuloId: 'art1' }]);

        component.openEditModal('op1');

        expect(component.isModalOpen).toBe(true);
        expect(component.operationIdToEdit).toBe('op1');
        expect(component.initialOperationData).toEqual({
            tipo: 'VENTA',
            montoBase: 100,
            porcentajeRecargo: 10,
            clienteId: 'c1',
            articuloId: 'art1',
            prestamoId: '',
            cuotasCount: 3,
            tieneVencimiento: true,
            periodicidad: 'SEMANAL',
            diaSemana: 2,
            diaVencimiento: 5,
            fechaPrimerVencimiento: '2026-06-17T00:00:00Z'
        });
    });

    it('debe cerrar modal', () => {
        component.isModalOpen = true;
        component.closeModal();
        expect(component.isModalOpen).toBe(false);
    });

    it('debe llamar a uiService.showConfirmAlert al confirmar eliminacion', async () => {
        await component.deleteOperation('op1');
        expect(mockUiService.showConfirmAlert).toHaveBeenCalled();
    });

    it('debe llamar a payInstallment en el servicio', async () => {
        await component.payInstallment('c1');
        expect(mockOperationService.payInstallment).toHaveBeenCalledWith('c1');
    });
});
