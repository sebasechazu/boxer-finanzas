import { Component, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonFab, IonFabButton, IonIcon} from '@ionic/angular/standalone';
import { LoanPlanService } from '../../../core/services/loan-plan.service';
import { UiService } from '../../../core/services/ui.service';
import { addIcons } from 'ionicons';
import { addOutline, createOutline, trashOutline, listOutline } from 'ionicons/icons';
import { PlanPrestamo } from '../../../core/models';
import { LoansListComponent } from './loans-list/loans-list.component';
import { LoanModalComponent } from './loan-modal/loan-modal.component';

@Component({
  selector: 'app-loans-tab',
  templateUrl: 'loans-tab.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  private uiService = inject(UiService);
  private cdr = inject(ChangeDetectorRef);

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
    await this.uiService.showConfirmAlert({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que deseas eliminar este plan de préstamo configurable?',
      confirmText: 'Eliminar',
      confirmRole: 'destructive',
      onConfirm: async () => {
        try {
          await this.loanPlanService.deleteLoanPlan(id);
        } catch (error) {
          await this.uiService.showErrorAlert('No se pudo eliminar el plan de préstamo', error);
        }
      }
    });
  }

  async onSaveLoan(loanFormData: Partial<PlanPrestamo>) {
    if (!this.isSaving) {
      this.isSaving = true;
      this.cdr.detectChanges();
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
          await this.loanPlanService.updateLoanPlan(this.editingLoanId, loanData as any);
        } else {
          await this.loanPlanService.addLoanPlan(loanData as any);
        }
        this.closeModal();
      } catch (error) {
        await this.uiService.showErrorAlert('Error al guardar el plan de préstamo', error);
      } finally {
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    }
  }
}
