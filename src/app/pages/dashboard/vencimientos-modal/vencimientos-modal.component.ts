import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonModal, IonButton,
  IonButtons, IonList, IonItem, IonNote, IonBadge, IonText, IonIcon, IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendarOutline, cashOutline, checkmarkCircleOutline,
  alertCircleOutline, arrowForwardOutline, closeOutline, receiptOutline
} from 'ionicons/icons';
import { Cuota, Operacion } from '../../../core/models';
import { ClientService } from '../../../core/services/client.service';
import { OperationService } from '../../../core/services/operation.service';

@Component({
  selector: 'app-vencimientos-modal',
  templateUrl: './vencimientos-modal.component.html',
  standalone: true,
  imports: [
    CommonModule, DatePipe, DecimalPipe,
    IonHeader, IonToolbar, IonTitle, IonContent, IonModal, IonButton,
    IonButtons, IonList, IonItem, IonNote, IonBadge, IonText, IonIcon, IonLabel
  ]
})
export class VencimientosModalComponent {
  public clientService = inject(ClientService);
  public operationService = inject(OperationService);

  @Input() isOpen = false;
  @Input() selectedDate: string | null = null;
  @Input() cuotas: Cuota[] = [];

  @Output() dismiss = new EventEmitter<void>();
  @Output() pay = new EventEmitter<string>();
  @Output() viewAll = new EventEmitter<void>();

  constructor() {
    addIcons({
      calendarOutline, cashOutline, checkmarkCircleOutline,
      alertCircleOutline, arrowForwardOutline, closeOutline, receiptOutline
    });
  }

  get formattedSelectedDate(): string {
    const date = this.selectedDate;
    if (!date) return '';
    const parts = date.split('-');
    if (parts.length !== 3) return date;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }

  getClientName(id: string) {
    const client = this.clientService.userClients().find(c => c.id === id);
    return client ? client.nombre : 'Cliente Desconocido';
  }

  getOperation(operacionId: string): Operacion | undefined {
    return this.operationService.userOperations().find(o => o.id === operacionId);
  }

  getCuotaNumero(cuota: Cuota): string {
    const allCuotas = this.operationService.userInstalments()
      .filter(c => c.operacionId === cuota.operacionId)
      .sort((a, b) => {
        if (!a.vencimiento) return 1;
        if (!b.vencimiento) return -1;
        return new Date(a.vencimiento).getTime() - new Date(b.vencimiento).getTime();
      });
    const index = allCuotas.findIndex(c => c.id === cuota.id);
    return `${index + 1}/${allCuotas.length}`;
  }

  getStatusColor(estado: string) {
    switch (estado) {
      case 'PAGADA': return 'success';
      case 'PENDIENTE': return 'warning';
      case 'VENCIDA': return 'danger';
      default: return 'medium';
    }
  }
}
