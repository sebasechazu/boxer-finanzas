import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
    IonContent, IonImg,
    IonCard, IonCardContent,
    IonSpinner,
    IonItem,
    IonLabel,
    IonInput,
    IonButton, IonGrid, IonRow, IonCol, IonCardHeader, IonCardTitle, IonCardSubtitle } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: 'login.page.html',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonCardSubtitle, IonCardTitle, IonCardHeader, IonCol, IonRow, IonGrid, 
        IonContent, IonImg,
        IonCard, IonCardContent,
        IonSpinner,
        IonItem,
        IonLabel,
        IonInput,
        IonButton,
        FormsModule
    ],
})
export class LoginPage implements OnInit {
    private authService = inject(AuthService);
    private navCtrl = inject(NavController);
    private router = inject(Router);

    private clearActiveElementFocus(): void {
        const activeElement = document.activeElement as HTMLElement | null;
        activeElement?.blur();
    }
    
    // Convertimos isLoading a Signal para evitar problemas del ciclo de vida de Ionic/Angular
    public isLoading = signal(false);
    public email = '';
    public password = '';
    
    // isCheckingAuth permanece true hasta que el check de email_verified termine
    // (emailCheckReady). Así evitamos navegar al dashboard con un usuario no verificado.
    public isCheckingAuth = computed(() => !this.authService.emailCheckReady());

    constructor() {}

    async ngOnInit() {
        // Al iniciar, esperamos a ver si Firebase tiene sesión guardada
        const user = await this.authService.waitForAuth();
        if (user) {
            this.clearActiveElementFocus();
            // Si hay usuario, vamos directo al dashboard y no mostramos el login
            this.navCtrl.navigateRoot('/tabs/dashboard', { animated: false });
        }
    }

    ionViewWillEnter() {
        this.isLoading.set(false);
    }

    ionViewWillLeave() {
        this.clearActiveElementFocus();
    }

    async loginWithGoogle() {
        this.isLoading.set(true);
        try {
            await this.authService.loginWithGoogle();
        } catch (error) {
            this.isLoading.set(false);
        }
    }

    async submitEmailAuth() {
        this.isLoading.set(true);
        try {
            await this.authService.loginWithEmailAndPassword(this.email, this.password);
        } catch (error) {
            this.isLoading.set(false);
        }
    }

    goToRegister() {
        this.router.navigateByUrl('/register');
    }
}
