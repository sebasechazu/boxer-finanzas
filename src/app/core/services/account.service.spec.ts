import { TestBed } from '@angular/core/testing';
import { AccountService } from './account.service';
import { AuthService } from './auth.service';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Invitacion, Colaborador } from '../models';

vi.mock('../../firebase.config', () => ({
    db: {}
}));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    onSnapshot: vi.fn(),
    addDoc: vi.fn(),
    doc: vi.fn().mockReturnValue('mockDocRef'),
    deleteDoc: vi.fn(),
    updateDoc: vi.fn(),
    setDoc: vi.fn(),
    getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
}));

describe('AccountService', () => {
    let service: AccountService;
    let mockAuthService: any;

    beforeEach(() => {
        mockAuthService = {
            userSignal: vi.fn().mockReturnValue({ uid: 'user123', displayName: 'Test User' }),
            profileSignal: vi.fn().mockReturnValue({ nombreNegocio: 'Test Negocio' }),
            currentUserUid: 'user123'
        };

        TestBed.configureTestingModule({
            providers: [
                AccountService,
                { provide: AuthService, useValue: mockAuthService }
            ]
        });

        service = TestBed.inject(AccountService);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should set active account uid correctly on switchAccount', () => {
        service.switchAccount('new-uid');
        expect(service.activeAccountUid()).toBe('new-uid');
    });

    it('should clean subscriptions on destroy', () => {
        expect(() => service.ngOnDestroy()).not.toThrow();
    });

    describe('Flujo de Invitaciones', () => {
        it('debe lanzar un error en enviarInvitacion si el usuario no está autenticado', async () => {
            mockAuthService.userSignal.mockReturnValue(null);
            await expect(service.enviarInvitacion('test@example.com')).rejects.toThrow('No autenticado');
        });

        it('debe lanzar un error en enviarInvitacion si ya existe una invitación PENDIENTE al mismo email', async () => {
            const pendingInvitation: Invitacion = {
                id: 'inv1',
                propietarioUid: 'user123',
                propietarioEmail: 'user123@example.com',
                propietarioNombre: 'Propietario',
                propietarioNombreNegocio: 'Mi Negocio',
                emailInvitado: 'invitado@example.com',
                estado: 'PENDIENTE',
                creadoEn: new Date().toISOString()
            };
            (service as any)._invitacionesEnviadas.set([pendingInvitation]);

            await expect(service.enviarInvitacion('invitado@example.com')).rejects.toThrow('Ya existe una invitación pendiente para ese email');
        });

        it('debe lanzar un error en enviarInvitacion si el usuario se invita a sí mismo', async () => {
            mockAuthService.userSignal.mockReturnValue({ uid: 'user123', email: 'me@example.com' });
            await expect(service.enviarInvitacion('me@example.com')).rejects.toThrow('No puedes invitarte a ti mismo');
        });

        it('debe lanzar un error en enviarInvitacion si el invitado ya es colaborador', async () => {
            const colaborador: Colaborador = {
                id: 'user123_colab123',
                propietarioUid: 'user123',
                colaboradorUid: 'colab123',
                colaboradorEmail: 'colab@example.com',
                colaboradorNombre: 'Colaborador',
                creadoEn: new Date().toISOString()
            };
            (service as any)._misColaboradores.set([colaborador]);

            await expect(service.enviarInvitacion('colab@example.com')).rejects.toThrow('Ese usuario ya es colaborador de tu cuenta');
        });

        it('debe agregar un documento de invitación en enviarInvitacion si pasa todas las validaciones', async () => {
            const emailInvitado = 'nuevo@example.com';
            mockAuthService.userSignal.mockReturnValue({ uid: 'user123', email: 'me@example.com', displayName: 'Mi Nombre' });
            mockAuthService.profileSignal.mockReturnValue({ nombreNegocio: 'Mi Negocio' });

            const { addDoc } = await import('firebase/firestore');

            await service.enviarInvitacion(emailInvitado);

            expect(addDoc).toHaveBeenCalled();
            const calledWith = vi.mocked(addDoc).mock.calls[0][1];
            expect(calledWith).toMatchObject({
                propietarioUid: 'user123',
                propietarioEmail: 'me@example.com',
                propietarioNombre: 'Mi Nombre',
                propietarioNombreNegocio: 'Mi Negocio',
                emailInvitado: 'nuevo@example.com',
                estado: 'PENDIENTE'
            });
        });

        it('debe lanzar un error en aceptarInvitacion si el usuario no está autenticado', async () => {
            mockAuthService.userSignal.mockReturnValue(null);
            const inv: Invitacion = {
                id: 'inv1',
                propietarioUid: 'prop123',
                propietarioEmail: 'prop@example.com',
                propietarioNombre: 'Propietario',
                propietarioNombreNegocio: 'Negocio',
                emailInvitado: 'me@example.com',
                estado: 'PENDIENTE',
                creadoEn: new Date().toISOString()
            };
            await expect(service.aceptarInvitacion(inv)).rejects.toThrow('No autenticado');
        });

        it('debe registrar el colaborador, actualizar la invitación a ACEPTADA y cargar perfil del propietario en aceptarInvitacion', async () => {
            mockAuthService.userSignal.mockReturnValue({ uid: 'user123', email: 'me@example.com', displayName: 'Mi Nombre' });
            const inv: Invitacion = {
                id: 'inv1',
                propietarioUid: 'prop123',
                propietarioEmail: 'prop@example.com',
                propietarioNombre: 'Propietario',
                propietarioNombreNegocio: 'Negocio',
                emailInvitado: 'me@example.com',
                estado: 'PENDIENTE',
                creadoEn: new Date().toISOString()
            };

            const { setDoc, updateDoc } = await import('firebase/firestore');

            await service.aceptarInvitacion(inv);

            // Verificar setDoc de colaborador
            expect(setDoc).toHaveBeenCalled();
            const setDocCalls = vi.mocked(setDoc).mock.calls[0];
            expect(setDocCalls[1]).toMatchObject({
                propietarioUid: 'prop123',
                colaboradorUid: 'user123',
                colaboradorEmail: 'me@example.com',
                colaboradorNombre: 'Mi Nombre',
                invitacionId: 'inv1'
            });

            // Verificar updateDoc de invitación
            expect(updateDoc).toHaveBeenCalled();
            const updateDocCalls = vi.mocked(updateDoc).mock.calls[0];
            expect(updateDocCalls[1]).toEqual({ estado: 'ACEPTADA' });
        });

        it('debe actualizar la invitación a RECHAZADA en rechazarInvitacion', async () => {
            const inv: Invitacion = {
                id: 'inv1',
                propietarioUid: 'prop123',
                propietarioEmail: 'prop@example.com',
                propietarioNombre: 'Propietario',
                propietarioNombreNegocio: 'Negocio',
                emailInvitado: 'me@example.com',
                estado: 'PENDIENTE',
                creadoEn: new Date().toISOString()
            };

            const { updateDoc } = await import('firebase/firestore');

            await service.rechazarInvitacion(inv);

            expect(updateDoc).toHaveBeenCalled();
            const updateDocCalls = vi.mocked(updateDoc).mock.calls[0];
            expect(updateDocCalls[1]).toEqual({ estado: 'RECHAZADA' });
        });
    });
});

