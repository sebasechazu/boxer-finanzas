import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfilePage } from './profile.page';
import { AuthService } from '../../core/services/auth.service';
import { AccountService } from '../../core/services/account.service';
import { AlertController, ToastController } from '@ionic/angular/standalone';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { signal } from '@angular/core';
import { Invitacion } from '../../core/models/models';

describe('ProfilePage', () => {
    let component: ProfilePage;
    let fixture: ComponentFixture<ProfilePage>;
    let mockAuthService: any;
    let mockAccountService: any;
    let mockAlertController: any;
    let mockToastController: any;

    beforeEach(async () => {
        mockAuthService = {
            userSignal: signal({ uid: 'user123', email: 'me@example.com', displayName: 'Test User' }),
            profileSignal: signal({ nombreNegocio: 'Negocio Test' }),
            logout: vi.fn()
        };

        mockAccountService = {
            misColaboradores: signal([]),
            cuentasAjenas: signal([]),
            invitacionesPendientesRecibidas: signal([]),
            invitacionesEnviadas: signal([]),
            actualizarNombreNegocio: vi.fn(),
            enviarInvitacion: vi.fn(),
            aceptarInvitacion: vi.fn(),
            rechazarInvitacion: vi.fn(),
            eliminarColaborador: vi.fn(),
            getNombreNegocioPropietario: vi.fn().mockReturnValue('Negocio Ajeno'),
            getNombrePropietario: vi.fn().mockReturnValue('Otro Propietario')
        };

        mockAlertController = {
            create: vi.fn().mockResolvedValue({
                present: vi.fn()
            })
        };

        mockToastController = {
            create: vi.fn().mockResolvedValue({
                present: vi.fn()
            })
        };

        await TestBed.configureTestingModule({
            imports: [ProfilePage],
            providers: [
                { provide: AuthService, useValue: mockAuthService },
                { provide: AccountService, useValue: mockAccountService },
                { provide: AlertController, useValue: mockAlertController },
                { provide: ToastController, useValue: mockToastController }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ProfilePage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Flujo de invitaciones en UI', () => {
        it('debe mostrar la alerta de confirmacion al aceptarInvitacion y llamar a accountService al confirmar', async () => {
            const mockAlert = {
                present: vi.fn()
            };
            mockAlertController.create.mockResolvedValue(mockAlert);

            const inv: Invitacion = {
                id: 'inv1',
                propietarioUid: 'prop123',
                propietarioEmail: 'prop@example.com',
                propietarioNombre: 'Propietario',
                propietarioNombreNegocio: 'Negocio Prop',
                emailInvitado: 'me@example.com',
                estado: 'PENDIENTE',
                creadoEn: new Date().toISOString()
            };

            await component.aceptarInvitacion(inv);

            expect(mockAlertController.create).toHaveBeenCalled();
            const alertArgs = mockAlertController.create.mock.calls[0][0];
            expect(alertArgs.header).toBe('Aceptar Invitación');

            // Encontrar el botón de Aceptar y llamar su handler
            const aceptarButton = alertArgs.buttons.find((b: any) => b.text === 'Aceptar');
            expect(aceptarButton).toBeDefined();

            await aceptarButton.handler();

            expect(mockAccountService.aceptarInvitacion).toHaveBeenCalledWith(inv);
        });

        it('debe llamar a accountService.rechazarInvitacion directamente al rechazar una invitacion', async () => {
            const inv: Invitacion = {
                id: 'inv1',
                propietarioUid: 'prop123',
                propietarioEmail: 'prop@example.com',
                propietarioNombre: 'Propietario',
                propietarioNombreNegocio: 'Negocio Prop',
                emailInvitado: 'me@example.com',
                estado: 'PENDIENTE',
                creadoEn: new Date().toISOString()
            };

            await component.rechazarInvitacion(inv);

            expect(mockAccountService.rechazarInvitacion).toHaveBeenCalledWith(inv);
        });

        it('debe abrir la alerta de invitar colaborador y llamar a enviarInvitacion al confirmar', async () => {
            const mockAlert = {
                present: vi.fn()
            };
            mockAlertController.create.mockResolvedValue(mockAlert);

            await component.invitarColaborador();

            expect(mockAlertController.create).toHaveBeenCalled();
            const alertArgs = mockAlertController.create.mock.calls[0][0];
            expect(alertArgs.header).toBe('Invitar Colaborador');

            const enviarButton = alertArgs.buttons.find((b: any) => b.text === 'Enviar Invitación');
            expect(enviarButton).toBeDefined();

            await enviarButton.handler({ email: 'nuevo@example.com' });

            expect(mockAccountService.enviarInvitacion).toHaveBeenCalledWith('nuevo@example.com');
        });
    });
});
