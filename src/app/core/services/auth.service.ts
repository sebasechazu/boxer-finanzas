import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import {
    onAuthStateChanged,
    signOut,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    User,
    Unsubscribe
} from 'firebase/auth';
import { Router } from '@angular/router';
import { PerfilUsuario } from '../models';
import { auth, db } from '../../firebase.config';
import { AlertController, NavController, ToastController } from '@ionic/angular';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

@Injectable({
    providedIn: 'root'
})
export class AuthService implements OnDestroy {
    private router = inject(Router);
    private navCtrl = inject(NavController);
    private alertController = inject(AlertController);
    private toastController = inject(ToastController);
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
                    this.navCtrl.navigateRoot('/tabs/dashboard', { animated: false });
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

    private async _showAuthError(message: string) {
        const toast = await this.toastController.create({
            message,
            duration: 3500,
            position: 'top',
            color: 'danger'
        });
        await toast.present();
    }

    private validateEmail(email: string): string | null {
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) {
            return 'Ingresa un correo electrónico.';
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return 'El correo ingresado no es válido.';
        }

        return null;
    }

    async loginWithGoogle() {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error: any) {
            await this._showAuthError(
                'No se pudo completar el inicio de sesión. Si estás usando una PWA instalada, asegúrate de que tu navegador permita abrir ventanas emergentes o vuelve a intentarlo.'
            );
            throw error;
        }
    }

    async loginWithEmailAndPassword(email: string, password: string) {
        const emailError = this.validateEmail(email);
        if (emailError) {
            await this._showAuthError(emailError);
            throw new Error(emailError);
        }

        try {
            await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
        } catch (error: any) {
            const message = error?.code === 'auth/invalid-email'
                ? 'El correo ingresado no es válido.'
                : error?.code === 'auth/user-not-found' || error?.code === 'auth/wrong-password'
                    ? 'Correo o contraseña incorrectos.'
                    : 'No se pudo iniciar sesión. Revisa tus datos e inténtalo nuevamente.';
            await this._showAuthError(message);
            throw error;
        }
    }

    async registerWithEmailAndPassword(email: string, password: string) {
        const emailError = this.validateEmail(email);
        if (emailError) {
            await this._showAuthError(emailError);
            throw new Error(emailError);
        }

        if (password.trim().length < 6) {
            await this._showAuthError('La contraseña debe tener al menos 6 caracteres.');
            throw new Error('password-too-short');
        }

        try {
            await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
        } catch (error: any) {
            const message = error?.code === 'auth/invalid-email'
                ? 'El correo ingresado no es válido.'
                : error?.code === 'auth/email-already-in-use'
                    ? 'Este correo ya está registrado.'
                    : 'No se pudo crear la cuenta. Verifica que el correo sea válido y que la contraseña tenga al menos 6 caracteres.';
            await this._showAuthError(message);
            throw error;
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
