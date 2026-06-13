import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import {
    IonContent, IonImg,
    IonCard, IonCardContent,
    IonSpinner
} from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: 'login.page.html',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
        IonContent, IonImg,
        IonCard, IonCardContent,
        IonSpinner
    ],
})
export class LoginPage implements OnInit {
    private authService = inject(AuthService);
    private navCtrl = inject(NavController);
    
    // Convertimos isLoading a Signal para evitar problemas del ciclo de vida de Ionic/Angular
    public isLoading = signal(false);
    
    // Reactivamente determinamos si estamos verificando la sesión
    public isCheckingAuth = computed(() => !this.authService.authStateInitialized() || !!this.authService.userSignal());

    constructor() {}

    async ngOnInit() {
        // Al iniciar, esperamos a ver si Firebase tiene sesión guardada
        const user = await this.authService.waitForAuth();
        if (user) {
            // Si hay usuario, vamos directo al dashboard y no mostramos el login
            this.navCtrl.navigateRoot('/tabs/dashboard', { animated: false });
        }
    }

    ionViewWillEnter() {
        this.isLoading.set(false);
    }

    async login() {
        this.isLoading.set(true);
        try {
            await this.authService.loginWithGoogle();
            // No seteamos isLoading a false aquí, para que la transición hacia
            // el dashboard se vea fluida y no parpadee la UI.
        } catch (error) {
            this.isLoading.set(false);
        }
    }
}
