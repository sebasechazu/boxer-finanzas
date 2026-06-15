import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonFab, IonFabButton, IonIcon, AlertController} from '@ionic/angular/standalone';
import { LoanPlanService } from '../../../core/services/loan-plan.service';
import { addIcons } from 'ionicons';
import { addOutline, createOutline, trashOutline, listOutline } from 'ionicons/icons';
import { PlanPrestamo } from '../../../core/models';
import { LoansListComponent } from './loans-list/loans-list.component';
import { LoanModalComponent } from './loan-modal/loan-modal.component';

@Component({
  selector: 'app-loans-tab',
  templateUrl: 'loans-tab.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    CommonModule,
    IonFab,
    IonFabButton,
    IonIcon,
    LoansListComponent,
    LoanModalComponent
],
})
export class LoansTabComponent {
  public loanPlanService = inject(LoanPlanService);
  private alertCtrl = inject(AlertController);

  isModalOpen = false;
  isSaving = false;
  editingLoanId: string | null = null;
  initialLoanData: Partial<PlanPrestamo> | null = null;

  constructor() {
    addIcons({ addOutline, createOutline, trashOutline, listOutline });
  }

  openAddModal() {
    this.editingLoanId = null;
    this.initialLoanData = null;
    this.isModalOpen = true;
  }

  editLoan(loan: PlanPrestamo) {
    this.editingLoanId = loan.id;
    this.initialLoanData = { ...loan };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingLoanId = null;
    this.initialLoanData = null;
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

  async onSaveLoan(loanFormData: any) {
    if (!this.isSaving) {
      this.isSaving = true;
      try {
        const loanData = {
          ...loanFormData,
          montoBase: Number(loanFormData.montoBase),
          porcentajeRecargo: Number(loanFormData.porcentajeRecargo),
          cuotasCount: Number(loanFormData.cuotasCount)
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
}
