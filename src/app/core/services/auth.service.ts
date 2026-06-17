import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import {
    onAuthStateChanged,
    signOut,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendEmailVerification,
    reload,
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
    // Solo se marca true cuando el check de email_verified terminó de forma segura.
    // Esto evita que login.page navegue al dashboard antes de completar la verificación.
    private _emailCheckReady = signal(false);
    readonly emailCheckReady = this._emailCheckReady.asReadonly();
    private _authUnsubscribe?: Unsubscribe;

    readonly userSignal = signal<User | null>(null);

    constructor() {
        this._authUnsubscribe = onAuthStateChanged(auth, async user => {
            this.userSignal.set(user);
            this._authStateInitialized.set(true);
            // Resetear el flag de check listo hasta completar la verificación
            this._emailCheckReady.set(false);

            if (user) {
                // Recargar el usuario para obtener el estado actualizado del correo
                await reload(user);
                const freshUser = auth.currentUser;

                // Si el usuario usa Email/Contraseña y no verificó su correo, bloquearlo
                if (freshUser && !freshUser.emailVerified && freshUser.providerData[0]?.providerId === 'password') {
                    await this._handleUnverifiedEmail(freshUser);
                    // No marcar emailCheckReady como true: el usuario fue expulsado
                    return;
                }

                // Cargar perfil extendido desde Firestore
                await this._loadOrCreateProfile(user);

                // Check completado: usuario verificado y con perfil cargado
                this._emailCheckReady.set(true);

                // Si estamos en login, navegar al dashboard
                if (this.router.url === '/login' || this.router.url === '/') {
                    this.navCtrl.navigateRoot('/tabs/dashboard', { animated: false });
                }
            } else {
                // Sin usuario: el check está listo (no hay nada que verificar)
                this._emailCheckReady.set(true);
            }
        });
    }

    ngOnDestroy() {
        this._authUnsubscribe?.();
    }

    // Método para esperar a que Firebase nos diga si hay usuario o no
    // y además a que el check de email_verified haya terminado.
    async waitForAuth(): Promise<User | null> {
        if (this._emailCheckReady()) return this.userSignal();
        return new Promise((resolve) => {
            // Esperar al primer evento del onAuthStateChanged de Firebase
            const unsubscribe = onAuthStateChanged(auth, user => {
                unsubscribe();
                // No resolvemos todavía: dejamos que el flujo asíncrono del constructor
                // complete el check de email. Usamos un intervalo corto para polling.
                const interval = setInterval(() => {
                    if (this._emailCheckReady()) {
                        clearInterval(interval);
                        resolve(this.userSignal());
                    }
                }, 50);
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

    private async _showSuccessToast(message: string) {
        const toast = await this.toastController.create({
            message,
            duration: 5000,
            position: 'top',
            color: 'success'
        });
        await toast.present();
    }

    /**
     * Muestra una alerta al usuario no verificado con la opción de reenviar el
     * correo de verificación. El signOut ocurre DENTRO de los handlers para que
     * el token siga activo al momento de llamar a sendEmailVerification.
     */
    private async _handleUnverifiedEmail(user: User): Promise<void> {
        // Limpiar estado local ANTES de mostrar el alert
        this.userSignal.set(null);
        this.profileSignal.set(null);

        const alert = await this.alertController.create({
            header: 'Verifica tu correo',
            message:
                'Tu cuenta aún no está verificada. Revisá tu bandeja de entrada (y la carpeta de spam) para confirmar tu dirección de correo electrónico.',
            backdropDismiss: false,
            buttons: [
                {
                    text: 'Reenviar correo',
                    handler: () => {
                        // Ejecutamos de forma async pero sin bloquear el cierre del alert
                        (async () => {
                            try {
                                // El usuario aún tiene sesión activa: podemos enviar el correo
                                await sendEmailVerification(user);
                                await this._showSuccessToast('Correo de verificación reenviado. Revisá tu bandeja de entrada.');
                            } catch {
                                await this._showAuthError('No se pudo reenviar el correo. Intentá más tarde.');
                            } finally {
                                // Cerrar sesión después de intentar el reenvío
                                await signOut(auth);
                            }
                        })();
                        return true; // cerrar el alert
                    }
                },
                {
                    text: 'Entendido',
                    role: 'cancel',
                    handler: () => {
                        // Cerrar sesión cuando descarta el alert
                        signOut(auth);
                    }
                }
            ]
        });
        await alert.present();
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
            const credential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
            // Enviar correo de verificación inmediatamente tras el registro
            await sendEmailVerification(credential.user);
            // Cerrar sesión para forzar que el usuario verifique su correo antes de ingresar
            await signOut(auth);
            await this._showSuccessToast(
                '¡Cuenta creada! Te enviamos un correo de verificación. Confirmá tu dirección para poder ingresar.'
            );
        } catch (error: any) {
            const message = error?.code === 'auth/invalid-email'
                ? 'El correo ingresado no es válido.'
                : error?.code === 'auth/email-already-in-use'
                    ? 'Este correo ya está registrado.'
                    : 'No se pudo crear la cuenta. Verificá que el correo sea válido y que la contraseña tenga al menos 6 caracteres.';
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
