import { TestBed } from '@angular/core/testing';
import { ClientService } from './client.service';
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
    addDoc: vi.fn().mockResolvedValue({ id: 'new-client-id' }),
    doc: vi.fn().mockReturnValue('mockDocRef'),
    deleteDoc: vi.fn().mockResolvedValue(undefined),
    updateDoc: vi.fn().mockResolvedValue(undefined),
    getDocs: vi.fn().mockResolvedValue({ empty: true })
}));

describe('ClientService', () => {
    let service: ClientService;
    let mockAccountService: any;

    beforeEach(() => {
        mockAccountService = {
            effectiveAccountUid: vi.fn().mockReturnValue('user123')
        };

        TestBed.configureTestingModule({
            providers: [
                ClientService,
                { provide: AccountService, useValue: mockAccountService }
            ]
        });

        service = TestBed.inject(ClientService);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('debe lanzar error en addClient si no hay cuenta activa', async () => {
        mockAccountService.effectiveAccountUid.mockReturnValue(null);
        await expect(service.addClient({ nombre: 'Test', telefono: '123', apellido: 'Perez', direccion: '', codigoPostal: '', ciudad: '' })).rejects.toThrow('No hay cuenta activa');
    });

    it('debe llamar a addDoc en addClient si el cliente no está duplicado', async () => {
        const { addDoc, getDocs } = await import('firebase/firestore');
        vi.mocked(getDocs).mockResolvedValueOnce({ empty: true } as any);

        const res = await service.addClient({ nombre: 'Juan', telefono: '456', apellido: 'Perez', direccion: '', codigoPostal: '', ciudad: '' });

        expect(getDocs).toHaveBeenCalled();
        expect(addDoc).toHaveBeenCalled();
        expect(res.id).toBe('new-client-id');
    });

    it('debe lanzar un error en addClient si ya existe un cliente con el mismo nombre y telefono', async () => {
        const { getDocs } = await import('firebase/firestore');
        vi.mocked(getDocs).mockResolvedValueOnce({ empty: false } as any);

        await expect(service.addClient({ nombre: 'Duplicado', telefono: '123', apellido: 'Perez', direccion: '', codigoPostal: '', ciudad: '' })).rejects.toThrow('Ya existe un cliente con este nombre y teléfono');
    });

    it('debe llamar a updateDoc en updateClient', async () => {
        const { updateDoc } = await import('firebase/firestore');

        await service.updateClient('client-1', { nombre: 'Nombre Editado' });

        expect(updateDoc).toHaveBeenCalled();
    });

    it('debe llamar a deleteDoc en deleteClient', async () => {
        const { deleteDoc } = await import('firebase/firestore');

        await service.deleteClient('client-1');

        expect(deleteDoc).toHaveBeenCalled();
    });
});
