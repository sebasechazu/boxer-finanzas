import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonText, IonList
} from '@ionic/angular/standalone';
import { PlanPrestamo } from '../../../../core/models';
import { OperationService } from '../../../../core/services/operation.service';

@Component({
  selector: 'app-loan-modal',
  templateUrl: './loan-modal.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, ReactiveFormsModule, DecimalPipe,
    IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonText, IonList
  ]
})
export class LoanModalComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private operationService = inject(OperationService);

  @Input() isOpen = false;
  @Input() isSaving = false;
  @Input() editingLoanId: string | null = null;
  @Input() initialData: Partial<PlanPrestamo> | null = null;

  @Output() dismiss = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  loanForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    montoBase: [0, [Validators.required, Validators.min(1)]],
    porcentajeRecargo: [0, [Validators.required, Validators.min(0)]],
    cuotasCount: [1, [Validators.required, Validators.min(1)]],
    periodicidad: ['MENSUAL', Validators.required],
    diaSemana: [1],
    diaVencimiento: [5, [Validators.min(1), Validators.max(31)]]
  });

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialData'] && this.initialData) {
      this.loanForm.patchValue({
        nombre: this.initialData.nombre || '',
        montoBase: this.initialData.montoBase || 0,
        porcentajeRecargo: this.initialData.porcentajeRecargo || 0,
        cuotasCount: this.initialData.cuotasCount || 1,
        periodicidad: this.initialData.periodicidad || 'MENSUAL',
        diaSemana: this.initialData.diaSemana ?? 1,
        diaVencimiento: this.initialData.diaVencimiento ?? 5
      });
    } else if (changes['isOpen'] && this.isOpen && !this.editingLoanId) {
      this.loanForm.reset({
        nombre: '',
        montoBase: 0,
        porcentajeRecargo: 0,
        cuotasCount: 1,
        periodicidad: 'MENSUAL',
        diaSemana: 1,
        diaVencimiento: 5
      });
    }
  }

  calculateTotalPreview() {
    const { montoBase, porcentajeRecargo } = this.loanForm.value;
    return this.operationService.calculateTotal(montoBase, porcentajeRecargo);
  }

  onSubmit() {
    if (this.loanForm.valid && !this.isSaving) {
      this.save.emit(this.loanForm.value);
    }
  }
}
