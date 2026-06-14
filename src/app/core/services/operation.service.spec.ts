import { TestBed } from '@angular/core/testing';
import { OperationService } from './operation.service';
import { AccountService } from './account.service';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Operacion, Cuota, Venta, Prestamo } from '../models';

vi.mock('../../firebase.config', () => ({
    db: {}
}));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    onSnapshot: vi.fn(),
    addDoc: vi.fn().mockResolvedValue({ id: 'new-doc-id' }),
    doc: vi.fn().mockReturnValue('mockDocRef'),
    deleteDoc: vi.fn().mockResolvedValue(undefined),
    updateDoc: vi.fn().mockResolvedValue(undefined),
    getDocs: vi.fn().mockResolvedValue({ docs: [] })
}));

describe('OperationService', () => {
    let service: OperationService;
    let mockAccountService: any;

    beforeEach(() => {
        mockAccountService = {
            effectiveAccountUid: vi.fn().mockReturnValue('user123')
        };

        TestBed.configureTestingModule({
            providers: [
                OperationService,
                { provide: AccountService, useValue: mockAccountService }
            ]
        });

        service = TestBed.inject(OperationService);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('debe calcular el total con recargo correctamente', () => {
        expect(service.calculateTotal(100, 10)).toBe(110);
        expect(service.calculateTotal(250, 15)).toBe(287.5);
    });

    it('debe calcular los computed financieros de cuotas correctamente', () => {
        const mockOps: Operacion[] = [
            { id: 'op1', usuarioId: 'user123', clienteId: 'c1', tipo: 'VENTA', cuotasCount: 2, periodicidad: 'MENSUAL' }
        ];
        const mockCuotas: Cuota[] = [
            { id: 'cuota1', operacionId: 'op1', usuarioId: 'user123', monto: 150, estado: 'PAGADA', fechaPago: new Date().toISOString() },
            { id: 'cuota2', operacionId: 'op1', usuarioId: 'user123', monto: 150, estado: 'PENDIENTE', vencimiento: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
        ];

        (service as any)._operacionesSignal.set(mockOps);
        (service as any)._cuotasSignal.set(mockCuotas);

        expect(service.totalPaid()).toBe(150);
        expect(service.moneyOnTheStreet()).toBe(150);
        expect(service.collectedToday()).toBe(150);
        expect(service.pendingCollectionsToday()).toBe(150);
    });

    it('debe crear una venta y sus cuotas en addOperation para una VENTA', async () => {
        const { addDoc } = await import('firebase/firestore');

        await service.addOperation({
            clienteId: 'c1',
            tipo: 'VENTA',
            cuotasCount: 3,
            periodicidad: 'SEMANAL',
            tieneVencimiento: true,
            montoBase: 300,
            porcentajeRecargo: 10,
            articuloId: 'art1'
        });

        // 1 para la venta, 1 para la operación, 3 para las cuotas = 5 addDoc
        expect(addDoc).toHaveBeenCalledTimes(5);
    });

    it('debe pagar una cuota correctamente', async () => {
        const { updateDoc } = await import('firebase/firestore');

        await service.payInstallment('cuota123');

        expect(updateDoc).toHaveBeenCalled();
        const calledWith = vi.mocked(updateDoc).mock.calls[0][1];
        expect(calledWith).toMatchObject({
            estado: 'PAGADA'
        });
    });

    it('debe eliminar la operación y sus cuotas', async () => {
        const { deleteDoc, getDocs } = await import('firebase/firestore');
        vi.mocked(getDocs).mockResolvedValueOnce({
            docs: [{ id: 'cuota1' }, { id: 'cuota2' }]
        } as any);

        // Simulamos que la operación existe en local para borrar la venta asociada
        (service as any)._operacionesSignal.set([
            { id: 'op1', usuarioId: 'user123', clienteId: 'c1', tipo: 'VENTA', ventaId: 'v123', cuotasCount: 2, periodicidad: 'MENSUAL' }
        ]);

        await service.deleteOperation('op1');

        // 1 para borrar la venta, 1 para la operación, 2 para las cuotas = 4 deleteDoc
        expect(deleteDoc).toHaveBeenCalledTimes(4);
    });
});
