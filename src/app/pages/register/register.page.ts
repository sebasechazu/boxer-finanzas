import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonSpinner, IonGrid, IonRow, IonCol, IonCardHeader, IonCardTitle, IonCardSubtitle } from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonCardSubtitle, IonCardTitle, IonCardHeader, IonCol, IonRow, IonGrid, 
    IonContent,
    IonCard,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonSpinner,
    FormsModule
  ]
})
export class RegisterPage {
  private authService = inject(AuthService);
  private router = inject(Router);

  private clearActiveElementFocus(): void {
    const activeElement = document.activeElement as HTMLElement | null;
    activeElement?.blur();
  }

  ionViewWillLeave() {
    this.clearActiveElementFocus();
  }

  readonly isLoading = signal(false);
  email = '';
  password = '';

  async submit() {
    this.isLoading.set(true);
    try {
      await this.authService.registerWithEmailAndPassword(this.email, this.password);
      // El AuthService envía el correo de verificación y cierra la sesión automáticamente.
      // Solo hay que llevar al usuario al login para que ingrese después de verificar.
      await this.router.navigateByUrl('/login', { replaceUrl: true });
    } catch {
      this.isLoading.set(false);
    }
  }

  goToLogin() {
    this.router.navigateByUrl('/login');
  }
}
