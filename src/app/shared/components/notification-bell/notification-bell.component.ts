import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { IonButtons, IonButton, IonIcon, IonBadge } from '@ionic/angular/standalone';
import { NotificationService } from '../../../core/services/notification.service';
import { addIcons } from 'ionicons';
import { notificationsOutline } from 'ionicons/icons';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  templateUrl: './notification-bell.component.html',
  imports: [IonButtons, IonButton, IonIcon, IonBadge],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationBellComponent {
  public notificationService = inject(NotificationService);
  private router = inject(Router);

  constructor() {
    addIcons({ notificationsOutline });
  }

  onClick() {
    // Si hay vencimientos, navegamos al dashboard (donde ya existe el calendario y modal)
    // Opcionalmente, aquí podríamos abrir directamente el modal de vencimientos
    // Por simplicidad, navegamos a dashboard
    this.router.navigate(['/tabs/dashboard']);
  }
}
