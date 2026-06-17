import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VencimientosModalComponent } from './vencimientos-modal.component';
import { ClientService } from '../../../core/services/client.service';
import { OperationService } from '../../../core/services/operation.service';
import { describe, it, expect, beforeEach } from 'vitest';
import { signal } from '@angular/core';

describe('VencimientosModalComponent', () => {
    let component: VencimientosModalComponent;
    let fixture: ComponentFixture<VencimientosModalComponent>;
    let mockClientService: any;
    let mockOperationService: any;

    beforeEach(async () => {
        mockClientService = {
            userClients: signal([
                { id: 'c1', nombre: 'Juan Perez' }
            ])
        };

        mockOperationService = {
            userOperations: signal([
                { id: 'op1', clienteId: 'c1', total: 1000 }
            ]),
            userInstalments: signal([
                { id: 'cuota1', operacionId: 'op1', vencimiento: '2026-06-17T00:00:00Z', estado: 'PENDIENTE' }
            ])
        };

        await TestBed.configureTestingModule({
            imports: [VencimientosModalComponent],
            providers: [
                { provide: ClientService, useValue: mockClientService },
                { provide: OperationService, useValue: mockOperationService }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(VencimientosModalComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('isOpen', true);
        fixture.componentRef.setInput('selectedDate', '2026-06-17');
        fixture.componentRef.setInput('cuotas', [
            { id: 'cuota1', operacionId: 'op1', vencimiento: '2026-06-17T00:00:00Z', estado: 'PENDIENTE', monto: 500, numero: 1, usuarioId: 'u1' }
        ]);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('debe dar el nombre de cliente correcto en getClientName', () => {
        expect(component.getClientName('c1')).toBe('Juan Perez');
        expect(component.getClientName('c2')).toBe('Cliente Desconocido');
    });

    it('debe formatear la fecha seleccionada en formattedSelectedDate', () => {
        expect(component.formattedSelectedDate).toBe('17/06/2026');
    });

    it('debe obtener la operacion correcta en getOperation', () => {
        expect(component.getOperation('op1')).toEqual({ id: 'op1', clienteId: 'c1', total: 1000 });
        expect(component.getOperation('op2')).toBeUndefined();
    });

    it('debe calcular el numero de cuota en getCuotaNumero', () => {
        const cuota = { id: 'cuota1', operacionId: 'op1' } as any;
        expect(component.getCuotaNumero(cuota)).toBe('1/1');
    });

    it('debe retornar el color de estado correcto', () => {
        expect(component.getStatusColor('PAGADA')).toBe('success');
        expect(component.getStatusColor('PENDIENTE')).toBe('warning');
        expect(component.getStatusColor('VENCIDA')).toBe('danger');
        expect(component.getStatusColor('OTRO')).toBe('medium');
    });
});
