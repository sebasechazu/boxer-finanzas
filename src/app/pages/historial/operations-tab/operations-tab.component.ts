import { Component, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonFab, IonFabButton, IonIcon, AlertController
} from '@ionic/angular/standalone';
import { OperationService } from '../../../core/services/operation.service';
import { addIcons } from 'ionicons';
import {
  trashOutline, cashOutline, receiptOutline, createOutline,
  calendarOutline, personOutline, addOutline
} from 'ionicons/icons';
import { OperationsListComponent } from './operations-list/operations-list.component';
import { OperationModalComponent } from './operation-modal/operation-modal.component';

@Component({
  selector: 'app-operations-tab',
  templateUrl: 'operations-tab.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    CommonModule,
    IonFab, IonFabButton, IonIcon,
    OperationsListComponent, OperationModalComponent
  ],
})
export class OperationsTabComponent {
  public operationService = inject(OperationService);
  private alertCtrl = inject(AlertController);
  private cdr = inject(ChangeDetectorRef);

  isModalOpen = false;
  isSavingOp = false;
  operationIdToEdit: string | null = null;
  initialOperationData: any = null;

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

  async onSubmitOperation(opFormData: any) {
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
          await this.operationService.updateOperation(this.operationIdToEdit, opData);
        } else {
          await this.operationService.addOperation(opData);
        }

        const successAlert = await this.alertCtrl.create({
          header: 'Éxito',
          message: this.operationIdToEdit ? 'Operación actualizada con éxito' : 'Operación guardada con éxito',
          buttons: [{
            text: 'OK',
            handler: () => {
              this.closeModal();
            }
          }]
        });
        await successAlert.present();
      } catch (error: any) {
        const errorAlert = await this.alertCtrl.create({
          header: 'Error',
          message: error.message || 'Error al guardar la operación',
          buttons: ['OK']
        });
        await errorAlert.present();
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
      const errorAlert = await this.alertCtrl.create({
        header: 'Error',
        message: 'No se pudo registrar el pago',
        buttons: ['OK']
      });
      await errorAlert.present();
    }
  }

  async deleteOperation(id: string) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que deseas eliminar esta operación? Se eliminarán también todas sus cuotas asociadas.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.operationService.deleteOperation(id);
            } catch (error) {
              const errorAlert = await this.alertCtrl.create({
                header: 'Error',
                message: 'No se pudo eliminar la operación',
                buttons: ['OK']
              });
              await errorAlert.present();
            }
          }
        }
      ]
    });
    await alert.present();
  }
}
