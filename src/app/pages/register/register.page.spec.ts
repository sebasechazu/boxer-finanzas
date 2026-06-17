import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterPage } from './register.page';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

describe('RegisterPage', () => {
    let component: RegisterPage;
    let fixture: ComponentFixture<RegisterPage>;
    let mockAuthService: any;
    let mockRouter: any;

    beforeEach(async () => {
        mockAuthService = {
            registerWithEmailAndPassword: vi.fn().mockResolvedValue(undefined)
        };

        mockRouter = {
            navigateByUrl: vi.fn().mockResolvedValue(true)
        };

        await TestBed.configureTestingModule({
            imports: [RegisterPage],
            providers: [
                { provide: AuthService, useValue: mockAuthService },
                { provide: Router, useValue: mockRouter },
                { provide: ActivatedRoute, useValue: {} }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(RegisterPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('debe registrar el usuario y navegar al login', async () => {
        component.email = 'new@example.com';
        component.password = 'password123';

        await component.submit();

        expect(mockAuthService.registerWithEmailAndPassword).toHaveBeenCalledWith('new@example.com', 'password123');
        expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/login', { replaceUrl: true });
    });

    it('debe quitar el foco antes de navegar al login', async () => {
        const button = document.createElement('button');
        document.body.appendChild(button);
        const blurSpy = vi.spyOn(button, 'blur');

        button.focus();
        component.ionViewWillLeave();

        expect(blurSpy).toHaveBeenCalled();
        document.body.removeChild(button);
    });
});
