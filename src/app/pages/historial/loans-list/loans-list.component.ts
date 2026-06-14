import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import {
  IonContent, IonList, IonItem, IonLabel, IonButton, IonIcon, IonModal,
  IonButtons, IonInput, IonHeader, IonToolbar, IonTitle, IonFab, IonFabButton,
  IonSelect, IonSelectOption, IonText, AlertController
} from '@ionic/angular/standalone';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LoanPlanService } from '../../../core/services/loan-plan.service';
import { OperationService } from '../../../core/services/operation.service';
import { addIcons } from 'ionicons';
import { addOutline, createOutline, trashOutline, cashOutline, calendarOutline, listOutline } from 'ionicons/icons';
import { PlanPrestamo } from '../../../core/models';

@Component({
  selector: 'app-loans-list',
  templateUrl: 'loans-list.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    CommonModule, ReactiveFormsModule, DecimalPipe,
    IonContent, IonList, IonItem, IonLabel, IonButton, IonIcon, IonModal,
    IonButtons, IonInput, IonHeader, IonToolbar, IonTitle, IonFab, IonFabButton,
    IonSelect, IonSelectOption, IonText
  ],
})
export class LoansListComponent {
  public loanPlanService = inject(LoanPlanService);
  private operationService = inject(OperationService);
  private fb = inject(FormBuilder);
  private alertCtrl = inject(AlertController);

  isModalOpen = false;
  isSaving = false;
  editingLoanId: string | null = null;

  loanForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    montoBase: [0, [Validators.required, Validators.min(1)]],
    porcentajeRecargo: [0, [Validators.required, Validators.min(0)]],
    cuotasCount: [1, [Validators.required, Validators.min(1)]],
    periodicidad: ['MENSUAL', Validators.required],
    diaSemana: [1],
    diaVencimiento: [5, [Validators.min(1), Validators.max(31)]]
  });

  constructor() {
    addIcons({ addOutline, createOutline, trashOutline, cashOutline, calendarOutline, listOutline });
  }

  openAddModal() {
    this.editingLoanId = null;
    this.loanForm.reset({
      nombre: '',
      montoBase: 0,
      porcentajeRecargo: 0,
      cuotasCount: 1,
      periodicidad: 'MENSUAL',
      diaSemana: 1,
      diaVencimiento: 5
    });
    this.isModalOpen = true;
  }

  editLoan(loan: PlanPrestamo) {
    this.editingLoanId = loan.id;
    this.loanForm.patchValue({
      nombre: loan.nombre,
      montoBase: loan.montoBase,
      porcentajeRecargo: loan.porcentajeRecargo,
      cuotasCount: loan.cuotasCount,
      periodicidad: loan.periodicidad,
      diaSemana: loan.diaSemana ?? 1,
      diaVencimiento: loan.diaVencimiento ?? 5
    });
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingLoanId = null;
  }

  async deleteLoan(id: string) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que deseas eliminar este plan de préstamo configurable?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.loanPlanService.deleteLoanPlan(id);
            } catch (error) {
              const errorAlert = await this.alertCtrl.create({
                header: 'Error',
                message: 'No se pudo eliminar el plan de préstamo',
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

  async onSubmit() {
    if (this.loanForm.valid && !this.isSaving) {
      this.isSaving = true;
      try {
        const loanData = {
          ...this.loanForm.value,
          montoBase: Number(this.loanForm.value.montoBase),
          porcentajeRecargo: Number(this.loanForm.value.porcentajeRecargo),
          cuotasCount: Number(this.loanForm.value.cuotasCount)
        };

        // Limpieza de campos según periodicidad
        if (loanData.periodicidad === 'MENSUAL') {
          delete loanData.diaSemana;
          loanData.diaVencimiento = Number(loanData.diaVencimiento);
        } else {
          delete loanData.diaVencimiento;
          loanData.diaSemana = Number(loanData.diaSemana);
        }

        if (this.editingLoanId) {
          await this.loanPlanService.updateLoanPlan(this.editingLoanId, loanData);
        } else {
          await this.loanPlanService.addLoanPlan(loanData);
        }
        this.closeModal();
      } catch (error: any) {
        const errorAlert = await this.alertCtrl.create({
          header: 'Error',
          message: error.message || 'Error al guardar el plan de préstamo',
          buttons: ['OK']
        });
        await errorAlert.present();
      } finally {
        this.isSaving = false;
      }
    }
  }

  calculateTotalPreview() {
    const { montoBase, porcentajeRecargo } = this.loanForm.value;
    return this.operationService.calculateTotal(montoBase, porcentajeRecargo);
  }
}
