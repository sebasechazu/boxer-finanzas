import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { onAuthStateChanged, signOut, signInWithPopup, GoogleAuthProvider, User, Unsubscribe } from 'firebase/auth';
import { Router } from '@angular/router';
import { PerfilUsuario } from '../models/models';
import { auth, db } from '../../firebase.config';
import { AlertController } from '@ionic/angular';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

@Injectable({
    providedIn: 'root'
})
export class AuthService implements OnDestroy {
    private router = inject(Router);
    private alertController = inject(AlertController);
    private _authStateInitialized = signal(false);
    readonly authStateInitialized = this._authStateInitialized.asReadonly();
    private _authUnsubscribe?: Unsubscribe;

    readonly userSignal = signal<User | null>(null);

    constructor() {
        this._authUnsubscribe = onAuthStateChanged(auth, async user => {
            this.userSignal.set(user);
            this._authStateInitialized.set(true);

            if (user) {
                // Cargar perfil extendido desde Firestore
                await this._loadOrCreateProfile(user);

                // Si estamos en login, navegar al dashboard
                if (this.router.url === '/login' || this.router.url === '/') {
                    this.router.navigate(['/tabs/dashboard'], { replaceUrl: true });
                }
            }
        });
    }

    ngOnDestroy() {
        this._authUnsubscribe?.();
    }

    // Método para esperar a que Firebase nos diga si hay usuario o no
    async waitForAuth(): Promise<User | null> {
        if (this._authStateInitialized()) return this.userSignal();
        return new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, user => {
                unsubscribe();
                resolve(user);
            });
        });
    }

    // Signal para datos extendidos del usuario (perfil en Firestore)
    readonly profileSignal = signal<PerfilUsuario | null>(null);

    get currentUserUid(): string | undefined {
        return auth.currentUser?.uid || this.userSignal()?.uid;
    }

    /** Carga o crea el perfil del usuario en Firestore */
    private async _loadOrCreateProfile(user: User): Promise<void> {
        const perfilRef = doc(db, 'usuarios', user.uid);
        const snap = await getDoc(perfilRef);

        if (snap.exists()) {
            const perfil = snap.data() as PerfilUsuario;
            // Actualizar nombre si cambió en Google
            if (perfil.nombre !== user.displayName) {
                await updateDoc(perfilRef, { nombre: user.displayName ?? perfil.nombre });
                perfil.nombre = user.displayName ?? perfil.nombre;
            }
            this.profileSignal.set(perfil);
        } else {
            // Primera vez: crear el perfil
            const nuevoPerfil: PerfilUsuario = {
                uid: user.uid,
                email: user.email ?? '',
                nombre: user.displayName ?? user.email ?? '',
                nombreNegocio: user.displayName ? `Negocio de ${user.displayName.split(' ')[0]}` : 'Mi Negocio',
                creadoEn: new Date().toISOString()
            };
            await setDoc(perfilRef, nuevoPerfil);
            this.profileSignal.set(nuevoPerfil);
        }
    }

    async loginWithGoogle() {
        
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            this.router.navigate(['/tabs/dashboard']);
        } catch (error: any) {
            console.error('AuthService: Error en login web:', error);
            const alert = await this.alertController.create({
                header: 'Error de Autenticación',
                message: 'No se pudo completar el inicio de sesión. Si estás usando una PWA instalada, asegúrate de que tu navegador permita abrir ventanas emergentes o vuelve a intentarlo.',
                buttons: ['OK']
            });
            await alert.present();
        }
    }

    async logout() {
        try {
            if (this.router.url.includes('login')) return;

            // 1. Limpiar estado local
            this.profileSignal.set(null);

            // 2. Sign out de Firebase Auth (Web/Core)
            await signOut(auth);
            
            // 3. Navegar al login
            await this.router.navigateByUrl('/login', { replaceUrl: true });
            
        } catch (error) {
            console.error('Error durante el cierre de sesión:', error);
            window.location.href = '/login';
        }
    }

    isAuthenticated() {
        return !!auth.currentUser || !!this.userSignal();
    }
}

// Functional Auth Guard de Angular 21
export const authGuard = async () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Esperar a que Firebase se inicialice antes de decidir
    const user = await authService.waitForAuth();

    if (user) {
        return true;
    }

    return router.parseUrl('/login');
};
