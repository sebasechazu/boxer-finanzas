import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
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

    beforeEach(() => {
        mockRouter = {
            navigate: vi.fn(),
            navigateByUrl: vi.fn(),
            url: '/login'
        };

        mockAlertCtrl = {
            create: vi.fn().mockResolvedValue({ present: vi.fn() })
        };

        TestBed.configureTestingModule({
            providers: [
                AuthService,
                { provide: Router, useValue: mockRouter },
                { provide: AlertController, useValue: mockAlertCtrl }
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
});
