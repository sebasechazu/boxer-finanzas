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
  IonSpinner
} from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonContent,
    IonCard,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonSpinner,
    FormsModule,
    RouterLink
  ]
})
export class RegisterPage {
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly isLoading = signal(false);
  email = '';
  password = '';

  async submit() {
    this.isLoading.set(true);
    try {
      await this.authService.registerWithEmailAndPassword(this.email, this.password);
      await this.router.navigateByUrl('/login', { replaceUrl: true });
    } catch {
      this.isLoading.set(false);
    }
  }
}
