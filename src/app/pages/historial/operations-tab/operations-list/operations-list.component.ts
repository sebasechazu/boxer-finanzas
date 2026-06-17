import { Component, ChangeDetectionStrategy, inject, input, output } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import {
  IonList, IonItem, IonLabel, IonButton, IonIcon, IonNote, IonBadge,
  IonAccordion, IonAccordionGroup, IonItemDivider, IonText
} from '@ionic/angular/standalone';
import { Operacion } from '../../../../core/models';
import { ClientService } from '../../../../core/services/client.service';
import { OperationService } from '../../../../core/services/operation.service';

@Component({
  selector: 'app-operations-list',
  templateUrl: './operations-list.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, DecimalPipe, DatePipe,
    IonList, IonItem, IonLabel, IonButton, IonIcon, IonNote, IonBadge,
    IonAccordion, IonAccordionGroup, IonItemDivider, IonText
  ]
})
export class OperationsListComponent {
  public clientService = inject(ClientService);
  public operationService = inject(OperationService);

  readonly operations = input<Operacion[]>([]);
  readonly edit = output<string>();
  readonly delete = output<string>();
  readonly pay = output<string>();

  getClientName(id: string) {
    const client = this.clientService.userClients().find(c => c.id === id);
    return client ? client.nombre : 'Cliente Desconocido';
  }

  getPorcentajeRecargo(op: Operacion): number {
    if (op.tipo === 'VENTA' && op.ventaId) {
      const venta = this.operationService.userSales().find(v => v.id === op.ventaId);
      return venta ? venta.porcentajeRecargo : 0;
    } else if (op.tipo === 'PRESTAMO' && op.prestamoId) {
      const prestamo = this.operationService.userLoans().find(p => p.id === op.prestamoId);
      return prestamo ? prestamo.porcentajeRecargo : 0;
    }
    return 0;
  }

  getTotalFinal(op: Operacion): number {
    if (op.tipo === 'VENTA' && op.ventaId) {
      const venta = this.operationService.userSales().find(v => v.id === op.ventaId);
      return venta ? venta.totalFinal : 0;
    } else if (op.tipo === 'PRESTAMO' && op.prestamoId) {
      const prestamo = this.operationService.userLoans().find(p => p.id === op.prestamoId);
      return prestamo ? prestamo.totalFinal : 0;
    }
    return 0;
  }

  getInstalments(opId: string) {
    return this.operationService.userInstalments()
      .filter(i => i.operacionId === opId)
      .sort((a, b) => {
        if (!a.vencimiento) return 1;
        if (!b.vencimiento) return -1;
        return new Date(a.vencimiento).getTime() - new Date(b.vencimiento).getTime();
      });
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
