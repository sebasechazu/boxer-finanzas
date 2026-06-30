import { Component, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonFab, IonFabButton, IonIcon
} from '@ionic/angular/standalone';
import { OperationService } from '../../../core/services/operation.service';
import { UiService } from '../../../core/services/ui.service';
import { addIcons } from 'ionicons';
import {
  trashOutline, cashOutline, receiptOutline, createOutline,
  calendarOutline, personOutline, addOutline
} from 'ionicons/icons';
import { OperationsListComponent } from './operations-list/operations-list.component';
import { OperationModalComponent, OperationFormData } from './operation-modal/operation-modal.component';
import { InvoiceModalComponent } from './invoice-modal/invoice-modal.component';
import { Operacion } from '../../../core/models';

@Component({
  selector: 'app-operations-tab',
  templateUrl: 'operations-tab.component.html',
  styles: ['ion-fab { position: fixed; bottom: 16px; right: 16px; z-index: 1000; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    IonFab, IonFabButton, IonIcon,
    OperationsListComponent, OperationModalComponent, InvoiceModalComponent
  ],
})
export class OperationsTabComponent {
  public operationService = inject(OperationService);
  private uiService = inject(UiService);
  private cdr = inject(ChangeDetectorRef);

  isModalOpen = false;
  isSavingOp = false;
  operationIdToEdit: string | null = null;
  initialOperationData: any = null;

  isInvoiceModalOpen = false;
  selectedOperationForInvoice: Operacion | null = null;

  constructor() {
    addIcons({
      trashOutline, cashOutline, receiptOutline, createOutline,
      calendarOutline, personOutline, addOutline
    });
  }

  openAddModal() {
    this.operationIdToEdit = null;
    this.initialOperationData = null;
    this.isModalOpen = true;
  }

  openEditModal(id: string) {
    this.operationIdToEdit = id;
    this.loadOperation(id);
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.operationIdToEdit = null;
    this.initialOperationData = null;
  }

  openInvoiceModal(op: Operacion) {
    this.selectedOperationForInvoice = op;
    this.isInvoiceModalOpen = true;
  }

  closeInvoiceModal() {
    this.isInvoiceModalOpen = false;
    this.selectedOperationForInvoice = null;
  }

  private loadOperation(id: string) {
    const op = this.operationService.userOperations().find(o => o.id === id);
    if (op) {
      let montoBase = 0;
      let porcentajeRecargo = 0;
      let articuloId = '';
      let planPrestamoId = '';

      if (op.tipo === 'VENTA' && op.ventaId) {
        const venta = this.operationService.userSales().find(v => v.id === op.ventaId);
        if (venta) {
          montoBase = venta.montoBase;
          porcentajeRecargo = venta.porcentajeRecargo;
          articuloId = venta.articuloId || '';
        }
      } else if (op.tipo === 'PRESTAMO' && op.prestamoId) {
        const prestamo = this.operationService.userLoans().find(p => p.id === op.prestamoId);
        if (prestamo) {
          montoBase = prestamo.montoBase;
          porcentajeRecargo = prestamo.porcentajeRecargo;
          planPrestamoId = prestamo.planId || '';
        }
      }

      this.initialOperationData = {
        tipo: op.tipo,
        montoBase,
        porcentajeRecargo,
        clienteId: op.clienteId,
        articuloId,
        prestamoId: planPrestamoId,
        cuotasCount: op.cuotasCount,
        tieneVencimiento: !!op.fechaPrimerVencimiento,
        periodicidad: op.periodicidad || 'MENSUAL',
        diaSemana: op.diaSemana ?? new Date().getDay(),
        diaVencimiento: op.diaVencimiento ?? 5,
        fechaPrimerVencimiento: op.fechaPrimerVencimiento || new Date().toISOString()
      };
    }
  }

  async onSubmitOperation(opFormData: OperationFormData) {
    if (!this.isSavingOp) {
      this.isSavingOp = true;
      this.cdr.detectChanges();

      try {
        const opData = {
          ...opFormData,
          montoBase: Number(opFormData.montoBase),
          porcentajeRecargo: Number(opFormData.porcentajeRecargo),
          cuotasCount: Number(opFormData.cuotasCount)
        };

        if (this.operationIdToEdit) {
          await this.operationService.updateOperation(this.operationIdToEdit, opData as any);
        } else {
          await this.operationService.addOperation(opData as any);
        }

        await this.uiService.showConfirmAlert({
          header: 'Éxito',
          message: this.operationIdToEdit ? 'Operación actualizada con éxito' : 'Operación guardada con éxito',
          confirmText: 'OK',
          cancelText: 'Cerrar',
          onConfirm: () => {
            this.closeModal();
          }
        });
      } catch (error) {
        await this.uiService.showErrorAlert('Error al guardar la operación', error);
      } finally {
        this.isSavingOp = false;
        this.cdr.detectChanges();
      }
    }
  }

  async payInstallment(cuotaId: string) {
    try {
      await this.operationService.payInstallment(cuotaId);
    } catch (error) {
      await this.uiService.showErrorAlert('No se pudo registrar el pago', error);
    }
  }

  async deleteOperation(id: string) {
    await this.uiService.showConfirmAlert({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que deseas eliminar esta operación? Se eliminarán también todas sus cuotas asociadas.',
      confirmText: 'Eliminar',
      confirmRole: 'destructive',
      onConfirm: async () => {
        try {
          await this.operationService.deleteOperation(id);
        } catch (error) {
          await this.uiService.showErrorAlert('No se pudo eliminar la operación', error);
        }
      }
    });
  }
}
