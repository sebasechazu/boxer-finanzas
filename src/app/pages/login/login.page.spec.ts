import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginPage } from './login.page';
import { AuthService } from '../../core/services/auth.service';
import { NavController } from '@ionic/angular';
import { Router } from '@angular/router';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createAuthServiceMock, createRouterMock, createNavControllerMock } from '../../testing/mocks';

describe('LoginPage', () => {
    let component: LoginPage;
    let fixture: ComponentFixture<LoginPage>;
    let mockAuthService: any;
    let mockNavCtrl: any;
    let mockRouter: any;

    beforeEach(async () => {
        mockAuthService = createAuthServiceMock();
        mockNavCtrl = createNavControllerMock();
        mockRouter = createRouterMock();

        await TestBed.configureTestingModule({
            imports: [LoginPage],
            providers: [
                { provide: AuthService, useValue: mockAuthService },
                { provide: NavController, useValue: mockNavCtrl },
                { provide: Router, useValue: mockRouter }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(LoginPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('debe redirigir al dashboard en ngOnInit si el usuario ya está autenticado', async () => {
        mockAuthService.waitForAuth.mockResolvedValue({ uid: 'user123' });
        await component.ngOnInit();
        expect(mockNavCtrl.navigateRoot).toHaveBeenCalledWith('/tabs/dashboard', { animated: false });
    });

    it('debe llamar a loginWithGoogle y cambiar isLoading', async () => {
        await component.loginWithGoogle();
        expect(mockAuthService.loginWithGoogle).toHaveBeenCalled();
    });

    it('debe llamar a loginWithEmailAndPassword con los datos ingresados', async () => {
        component.email = 'test@example.com';
        component.password = '123456';
        await component.submitEmailAuth();
        expect(mockAuthService.loginWithEmailAndPassword).toHaveBeenCalledWith('test@example.com', '123456');
    });

    it('debe redirigir a registro al llamar a goToRegister', () => {
        component.goToRegister();
        expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/register');
    });
});
