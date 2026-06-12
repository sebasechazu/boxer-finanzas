import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import {
    IonContent, IonImg,
    IonCard, IonCardContent,
    IonSpinner
} from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: 'login.page.html',
    styleUrl: 'login.page.scss',
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
    private router = inject(Router);
    
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
            this.router.navigate(['/tabs/dashboard'], { replaceUrl: true });
        }
    }

    ionViewWillEnter() {
        this.isLoading.set(false);
    }

    async login() {
        this.isLoading.set(true);
        try {
            await this.authService.loginWithGoogle();
        } finally {
            this.isLoading.set(false);
        }
    }
}
