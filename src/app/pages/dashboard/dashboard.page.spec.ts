import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardPage } from './dashboard.page';
import { OperationService } from '../../core/services/operation.service';
import { AuthService } from '../../core/services/auth.service';
import { AccountService } from '../../core/services/account.service';
import { Router } from '@angular/router';
import { UiService } from '../../core/services/ui.service';
import { ClientService } from '../../core/services/client.service';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  createOperationServiceMock,
  createAuthServiceMock,
  createAccountServiceMock,
  createClientServiceMock,
  createRouterMock,
  createUiServiceMock
} from '../../testing/mocks';

describe('DashboardPage', () => {
    let component: DashboardPage;
    let fixture: ComponentFixture<DashboardPage>;
    let mockOperationService: any;
    let mockAuthService: any;
    let mockAccountService: any;
    let mockClientService: any;
    let mockRouter: any;
    let mockUiService: any;

    beforeEach(async () => {
        mockOperationService = createOperationServiceMock();
        mockAuthService = createAuthServiceMock();
        mockAccountService = createAccountServiceMock();
        mockClientService = createClientServiceMock();
        mockRouter = createRouterMock();
        mockUiService = createUiServiceMock();

        await TestBed.configureTestingModule({
            imports: [DashboardPage],
            providers: [
                { provide: OperationService, useValue: mockOperationService },
                { provide: AuthService, useValue: mockAuthService },
                { provide: AccountService, useValue: mockAccountService },
                { provide: ClientService, useValue: mockClientService },
                { provide: Router, useValue: mockRouter },
                { provide: UiService, useValue: mockUiService }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DashboardPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('debe cambiar de fecha y abrir el modal al cambiar fecha en calendario', () => {
        component.onDateChange({ detail: { value: '2026-06-17T00:00:00Z' } });
        expect(component.selectedDate()).toBe('2026-06-17');
        expect(component.isModalOpen()).toBe(true);
    });

    it('debe cerrar el modal al llamar a closeModal', () => {
        component.selectedDate.set('2026-06-17');
        component.isModalOpen.set(true);
        component.closeModal();
        expect(component.isModalOpen()).toBe(false);
        expect(component.selectedDate()).toBeNull();
    });

    it('debe llamar a operationService.payInstallment al pagar cuota', async () => {
        await component.payInstallment('cuota123');
        expect(mockOperationService.payInstallment).toHaveBeenCalledWith('cuota123');
        expect(mockUiService.showConfirmAlert).toHaveBeenCalled();
    });

    it('debe cambiar de cuenta al llamar a switchAccount', () => {
        const cuenta = { propietarioUid: 'user456', esPropia: false };
        component.switchAccount(cuenta);
        expect(mockAccountService.switchAccount).toHaveBeenCalledWith('user456');
    });
});
