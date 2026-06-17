import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { AlertController, NavController } from '@ionic/angular';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

vi.mock('../../firebase.config', () => ({
    auth: { currentUser: null },
    db: {}
}));

vi.mock('firebase/auth', () => ({
    onAuthStateChanged: vi.fn().mockImplementation((auth, cb) => {
        // immediately return an unsubscribe function
        return vi.fn();
    }),
    signOut: vi.fn(),
    signInWithPopup: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    GoogleAuthProvider: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
    doc: vi.fn(),
    getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
    setDoc: vi.fn(),
    updateDoc: vi.fn()
}));

describe('AuthService', () => {
    let service: AuthService;
    let mockRouter: any;
    let mockAlertCtrl: any;
    let mockNavCtrl: any;

    beforeEach(() => {
        mockRouter = {
            navigate: vi.fn(),
            navigateByUrl: vi.fn(),
            url: '/login'
        };

        mockAlertCtrl = {
            create: vi.fn().mockResolvedValue({ present: vi.fn() })
        };

        mockNavCtrl = {
            navigateRoot: vi.fn()
        };

        TestBed.configureTestingModule({
            providers: [
                AuthService,
                { provide: Router, useValue: mockRouter },
                { provide: AlertController, useValue: mockAlertCtrl },
                { provide: NavController, useValue: mockNavCtrl }
            ]
        });

        service = TestBed.inject(AuthService);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should calculate isAuthenticated correctly', () => {
        // Since we mocked auth without current user and userSignal is null, it should be false
        expect(service.isAuthenticated()).toBeFalsy();
    });

    it('should clean up on destroy', () => {
        expect(() => service.ngOnDestroy()).not.toThrow();
    });

    it('should register a user with email and password', async () => {
        const { createUserWithEmailAndPassword } = await import('firebase/auth');
        const mockUserCredential = { user: { uid: 'abc123' } };
        vi.mocked(createUserWithEmailAndPassword).mockResolvedValue(mockUserCredential as any);

        await service.registerWithEmailAndPassword('demo@test.com', '123456');

        expect(createUserWithEmailAndPassword).toHaveBeenCalled();
    });

    it('should login a user with email and password', async () => {
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        const mockUserCredential = { user: { uid: 'abc123' } };
        vi.mocked(signInWithEmailAndPassword).mockResolvedValue(mockUserCredential as any);

        await service.loginWithEmailAndPassword('demo@test.com', '123456');

        expect(signInWithEmailAndPassword).toHaveBeenCalled();
    });
});
