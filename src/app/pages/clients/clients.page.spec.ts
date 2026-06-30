import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientsPage } from './clients.page';
import { ClientService } from '../../core/services/client.service';
import { UiService } from '../../core/services/ui.service';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Cliente } from '../../core/models';
import { createClientServiceMock, createUiServiceMock } from '../../testing/mocks';

describe('ClientsPage', () => {
    let component: ClientsPage;
    let fixture: ComponentFixture<ClientsPage>;
    let mockClientService: any;
    let mockUiService: any;

    beforeEach(async () => {
        mockClientService = createClientServiceMock();
        mockUiService = createUiServiceMock();

        await TestBed.configureTestingModule({
            imports: [ClientsPage],
            providers: [
                { provide: ClientService, useValue: mockClientService },
                { provide: UiService, useValue: mockUiService }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ClientsPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('debe abrir WhatsApp con un link correcto', () => {
        const spyOpen = vi.spyOn(window, 'open').mockImplementation(() => null);
        component.openWhatsApp('+54 9 11 1234-5678');
        expect(spyOpen).toHaveBeenCalledWith('https://wa.me/+5491112345678', '_blank');
        spyOpen.mockRestore();
    });

    it('debe abrir modal en modo creacion', () => {
        component.openAddModal();
        expect(component.isModalOpen).toBe(true);
        expect(component.editingClientId).toBeNull();
        expect(component.editingClientData).toBeNull();
    });

    it('debe abrir modal en modo edicion con datos', () => {
        const client: Cliente = { id: 'c1', nombre: 'Juan', apellido: 'Perez', direccion: '', codigoPostal: '', ciudad: '', telefono: '123', usuarioId: 'u1', saldoPendiente: 0 };
        component.editClient(client);
        expect(component.isModalOpen).toBe(true);
        expect(component.editingClientId).toBe('c1');
        expect(component.editingClientData).toEqual(client);
    });

    it('debe cerrar modal', () => {
        component.isModalOpen = true;
        component.editingClientId = 'c1';
        component.closeModal();
        expect(component.isModalOpen).toBe(false);
        expect(component.editingClientId).toBeNull();
    });

    it('debe llamar a uiService.showConfirmAlert en deleteClient', async () => {
        await component.deleteClient('c1');
        expect(mockUiService.showConfirmAlert).toHaveBeenCalled();
    });

    it('debe llamar a clientService.addClient en onSubmit si es nuevo', async () => {
        await component.onSubmit({ nombre: 'Juan', apellido: 'Perez', direccion: '', codigoPostal: '', ciudad: '', telefono: '123' });
        expect(mockClientService.addClient).toHaveBeenCalledWith({ nombre: 'Juan', apellido: 'Perez', direccion: '', codigoPostal: '', ciudad: '', telefono: '123' });
    });

    it('debe llamar a clientService.updateClient en onSubmit si se edita', async () => {
        component.editingClientId = 'c1';
        await component.onSubmit({ nombre: 'Juan Modificado', apellido: 'Perez', direccion: '', codigoPostal: '', ciudad: '', telefono: '123' });
        expect(mockClientService.updateClient).toHaveBeenCalledWith('c1', { nombre: 'Juan Modificado', apellido: 'Perez', direccion: '', codigoPostal: '', ciudad: '', telefono: '123' });
    });
});
