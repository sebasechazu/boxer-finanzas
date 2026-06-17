import { Component, ChangeDetectionStrategy, OnChanges, SimpleChanges, inject, input, output } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonText, IonList
} from '@ionic/angular/standalone';
import { PlanPrestamo, TipoPeriodicidad } from '../../../../core/models';
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

  readonly isOpen = input(false);
  readonly isSaving = input(false);
  readonly editingLoanId = input<string | null>(null);
  readonly initialData = input<Partial<PlanPrestamo> | null>(null);

  readonly dismiss = output<void>();
  readonly save = output<Partial<PlanPrestamo>>();

  loanForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    montoBase: [0, [Validators.required, Validators.min(1)]],
    porcentajeRecargo: [0, [Validators.required, Validators.min(0)]],
    cuotasCount: [1, [Validators.required, Validators.min(1)]],
    periodicidad: ['MENSUAL' as TipoPeriodicidad, Validators.required],
    diaSemana: [1],
    diaVencimiento: [5, [Validators.min(1), Validators.max(31)]]
  });

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialData'] && this.initialData()) {
      this.loanForm.patchValue({
        nombre: this.initialData()!.nombre || '',
        montoBase: this.initialData()!.montoBase || 0,
        porcentajeRecargo: this.initialData()!.porcentajeRecargo || 0,
        cuotasCount: this.initialData()!.cuotasCount || 1,
        periodicidad: this.initialData()!.periodicidad || 'MENSUAL',
        diaSemana: this.initialData()!.diaSemana ?? 1,
        diaVencimiento: this.initialData()!.diaVencimiento ?? 5
      });
    } else if (changes['isOpen'] && this.isOpen() && !this.editingLoanId()) {
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
    const { montoBase, porcentajeRecargo } = this.loanForm.getRawValue();
    return this.operationService.calculateTotal(montoBase, porcentajeRecargo);
  }

  onSubmit() {
    if (this.loanForm.valid && !this.isSaving()) {
      this.save.emit(this.loanForm.getRawValue());
    }
  }
}
