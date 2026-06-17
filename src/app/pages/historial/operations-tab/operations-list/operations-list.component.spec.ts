import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OperationsListComponent } from './operations-list.component';
import { ClientService } from '../../../../core/services/client.service';
import { OperationService } from '../../../../core/services/operation.service';
import { describe, it, expect, beforeEach } from 'vitest';
import { signal } from '@angular/core';

describe('OperationsListComponent', () => {
    let component: OperationsListComponent;
    let fixture: ComponentFixture<OperationsListComponent>;
    let mockClientService: any;
    let mockOperationService: any;

    beforeEach(async () => {
        mockClientService = {
            userClients: signal([{ id: 'c1', nombre: 'Juan Perez' }])
        };

        mockOperationService = {
            userSales: signal([{ id: 'v1', porcentajeRecargo: 10, totalFinal: 110 }]),
            userLoans: signal([{ id: 'p1', porcentajeRecargo: 20, totalFinal: 120 }]),
            userInstalments: signal([
                { id: 'cuota1', operacionId: 'op1', vencimiento: '2026-06-17T00:00:00Z', estado: 'PENDIENTE' }
            ])
        };

        await TestBed.configureTestingModule({
            imports: [OperationsListComponent],
            providers: [
                { provide: ClientService, useValue: mockClientService },
                { provide: OperationService, useValue: mockOperationService }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(OperationsListComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('operations', [
            { id: 'op1', tipo: 'VENTA', ventaId: 'v1', clienteId: 'c1', cuotasCount: 1, periodicidad: 'SEMANAL', diaSemana: 1 }
        ]);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('debe resolver el nombre del cliente en getClientName', () => {
        expect(component.getClientName('c1')).toBe('Juan Perez');
        expect(component.getClientName('unknown')).toBe('Cliente Desconocido');
    });

    it('debe obtener el porcentaje de recargo correcto', () => {
        const opVenta = { tipo: 'VENTA', ventaId: 'v1' } as any;
        const opPrestamo = { tipo: 'PRESTAMO', prestamoId: 'p1' } as any;
        expect(component.getPorcentajeRecargo(opVenta)).toBe(10);
        expect(component.getPorcentajeRecargo(opPrestamo)).toBe(20);
    });

    it('debe obtener el total final correcto', () => {
        const opVenta = { tipo: 'VENTA', ventaId: 'v1' } as any;
        const opPrestamo = { tipo: 'PRESTAMO', prestamoId: 'p1' } as any;
        expect(component.getTotalFinal(opVenta)).toBe(110);
        expect(component.getTotalFinal(opPrestamo)).toBe(120);
    });

    it('debe filtrar y ordenar las cuotas por operacionId en getInstalments', () => {
        const instalments = component.getInstalments('op1');
        expect(instalments.length).toBe(1);
        expect(instalments[0].id).toBe('cuota1');
    });
});
