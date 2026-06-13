import { Component, inject, ChangeDetectionStrategy, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonList, IonItem, IonLabel, IonButton, IonIcon, IonNote, IonBadge,
  IonAccordion, IonAccordionGroup, IonItemDivider, IonText,
  IonModal, IonInput, IonSelect, IonSelectOption, IonCheckbox,
  IonDatetime, IonDatetimeButton, IonButtons, IonHeader, IonToolbar, IonTitle,
  IonFab, IonFabButton, IonContent, AlertController
} from '@ionic/angular/standalone';
import { FinanceService } from '../../../core/services/finance.service';
import { addIcons } from 'ionicons';
import {
  trashOutline, cashOutline, receiptOutline, createOutline,
  calendarOutline, personOutline, addOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-operations-list',
  templateUrl: 'operations-list.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonList, IonItem, IonLabel, IonButton, IonIcon, IonNote, IonBadge,
    IonAccordion, IonAccordionGroup, IonItemDivider, IonText,
    IonModal, IonInput, IonSelect, IonSelectOption, IonCheckbox,
    IonDatetime, IonDatetimeButton, IonButtons, IonHeader, IonToolbar, IonTitle,
    IonFab, IonFabButton, IonContent, DecimalPipe, DatePipe
  ],
})
export class OperationsListComponent {
  public financeService = inject(FinanceService);
  private alertCtrl = inject(AlertController);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  isModalOpen = false;
  isSavingOp = false;
  operationIdToEdit: string | null = null;

  opForm: FormGroup = this.fb.group({
    tipo: ['VENTA', Validators.required],
    montoBase: [0, [Validators.required, Validators.min(1)]],
    porcentajeRecargo: [0, [Validators.required, Validators.min(0)]],
    clienteId: ['', Validators.required],
    articuloId: [''],
    cuotasCount: [1, [Validators.required, Validators.min(1)]],
    tieneVencimiento: [false],
    periodicidad: ['MENSUAL'],
    diaSemana: [new Date().getDay()],
    diaVencimiento: [5, [Validators.min(1), Validators.max(31)]],
    fechaPrimerVencimiento: [new Date().toISOString()]
  });

  constructor() {
    addIcons({
      trashOutline, cashOutline, receiptOutline, createOutline,
      calendarOutline, personOutline, addOutline
    });
  }

  openAddModal() {
    this.operationIdToEdit = null;
    this.resetOpForm();
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
    this.resetOpForm();
  }

  private resetOpForm() {
    this.opForm.reset({
      tipo: 'VENTA',
      montoBase: 0,
      porcentajeRecargo: 0,
      cuotasCount: 1,
      tieneVencimiento: false,
      periodicidad: 'MENSUAL',
      diaSemana: new Date().getDay(),
      diaVencimiento: 5,
      fechaPrimerVencimiento: new Date().toISOString()
    });
  }

  private loadOperation(id: string) {
    const op = this.financeService.userOperations().find(o => o.id === id);
    if (op) {
      this.opForm.patchValue({
        tipo: op.tipo,
        montoBase: op.montoBase,
        porcentajeRecargo: op.porcentajeRecargo,
        clienteId: op.clienteId,
        articuloId: op.articuloId || '',
        cuotasCount: op.cuotasCount,
        tieneVencimiento: !!op.fechaPrimerVencimiento,
        periodicidad: op.periodicidad || 'MENSUAL',
        diaSemana: op.diaSemana ?? new Date().getDay(),
        diaVencimiento: op.diaVencimiento ?? 5,
        fechaPrimerVencimiento: op.fechaPrimerVencimiento || new Date().toISOString()
      });
    }
  }

  onArticleChange(event: any) {
    const articleId = event.detail.value;
    if (articleId) {
      const article = this.financeService.userArticles().find(a => a.id === articleId);
      if (article) {
        this.opForm.patchValue({ montoBase: article.precioVentaContado });
      }
    }
  }

  calculatePreview() {
    const { montoBase, porcentajeRecargo } = this.opForm.value;
    return this.financeService.calculateTotal(montoBase, porcentajeRecargo);
  }

  async onSubmitOperation() {
    if (this.opForm.valid && !this.isSavingOp) {
      this.isSavingOp = true;
      this.cdr.detectChanges();

      try {
        const opData = {
          ...this.opForm.value,
          montoBase: Number(this.opForm.value.montoBase),
          porcentajeRecargo: Number(this.opForm.value.porcentajeRecargo),
          cuotasCount: Number(this.opForm.value.cuotasCount)
        };

        if (this.operationIdToEdit) {
          await this.financeService.updateOperation(this.operationIdToEdit, opData);
        } else {
          await this.financeService.addOperation(opData);
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

  getClientName(id: string) {
    const client = this.financeService.userClients().find(c => c.id === id);
    return client ? client.nombre : 'Cliente Desconocido';
  }

  getInstalments(opId: string) {
    return this.financeService.userInstalments()
      .filter(i => i.operacionId === opId)
      .sort((a, b) => {
        if (!a.vencimiento) return 1;
        if (!b.vencimiento) return -1;
        return new Date(a.vencimiento).getTime() - new Date(b.vencimiento).getTime();
      });
  }

  async payInstallment(cuotaId: string) {
    try {
      await this.financeService.payInstallment(cuotaId);
    } catch (error) {
      const errorAlert = await this.alertCtrl.create({
        header: 'Error',
        message: 'No se pudo registrar el pago',
        buttons: ['OK']
      });
      await errorAlert.present();
    }
  }

  getStatusColor(estado: string) {
    switch (estado) {
      case 'PAGADA': return 'success';
      case 'PENDIENTE': return 'warning';
      case 'VENCIDA': return 'danger';
      default: return 'medium';
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
              await this.financeService.deleteOperation(id);
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
