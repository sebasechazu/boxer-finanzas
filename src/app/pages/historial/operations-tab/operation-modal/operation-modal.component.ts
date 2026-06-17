import { Component, ChangeDetectionStrategy, OnChanges, SimpleChanges, inject, input, output } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonCheckbox,
  IonDatetime, IonDatetimeButton, IonList, IonText
} from '@ionic/angular/standalone';
import { ClientService } from '../../../../core/services/client.service';
import { ArticleService } from '../../../../core/services/article.service';
import { LoanPlanService } from '../../../../core/services/loan-plan.service';
import { OperationService } from '../../../../core/services/operation.service';

export interface OperationFormData {
  tipo: 'VENTA' | 'PRESTAMO';
  montoBase: number;
  porcentajeRecargo: number;
  clienteId: string;
  articuloId?: string;
  prestamoId?: string;
  cuotasCount: number;
  tieneVencimiento: boolean;
  periodicidad?: 'SEMANAL' | 'QUINCENAL' | 'MENSUAL';
  diaSemana?: number;
  diaVencimiento?: number;
  fechaPrimerVencimiento?: string;
}

@Component({
  selector: 'app-operation-modal',
  templateUrl: './operation-modal.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, ReactiveFormsModule, DecimalPipe,
    IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonCheckbox,
    IonDatetime, IonDatetimeButton, IonList, IonText
  ]
})
export class OperationModalComponent implements OnChanges {
  public clientService = inject(ClientService);
  public articleService = inject(ArticleService);
  public loanPlanService = inject(LoanPlanService);
  public operationService = inject(OperationService);
  private fb = inject(FormBuilder);

  readonly isOpen = input(false);
  readonly isSaving = input(false);
  readonly operationIdToEdit = input<string | null>(null);
  readonly initialData = input<Partial<OperationFormData> | null>(null);

  readonly dismiss = output<void>();
  readonly save = output<OperationFormData>();

  opForm = this.fb.nonNullable.group({
    tipo: ['VENTA' as 'VENTA' | 'PRESTAMO', Validators.required],
    montoBase: [0, [Validators.required, Validators.min(1)]],
    porcentajeRecargo: [0, [Validators.required, Validators.min(0)]],
    clienteId: ['', Validators.required],
    articuloId: [''],
    prestamoId: [''],
    cuotasCount: [1, [Validators.required, Validators.min(1)]],
    tieneVencimiento: [false],
    periodicidad: ['MENSUAL' as 'SEMANAL' | 'QUINCENAL' | 'MENSUAL'],
    diaSemana: [new Date().getDay()],
    diaVencimiento: [5, [Validators.min(1), Validators.max(31)]],
    fechaPrimerVencimiento: [new Date().toISOString()]
  });

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialData'] && this.initialData()) {
      this.opForm.patchValue(this.initialData()!);
    } else if (changes['isOpen'] && this.isOpen() && !this.operationIdToEdit()) {
      this.opForm.reset({
        tipo: 'VENTA',
        montoBase: 0,
        porcentajeRecargo: 0,
        articuloId: '',
        prestamoId: '',
        cuotasCount: 1,
        tieneVencimiento: false,
        periodicidad: 'MENSUAL',
        diaSemana: new Date().getDay(),
        diaVencimiento: 5,
        fechaPrimerVencimiento: new Date().toISOString()
      });
    }
  }

  onArticleChange(event: any) {
    const articleId = event.detail.value;
    if (articleId) {
      const article = this.articleService.userArticles().find(a => a.id === articleId);
      if (article) {
        this.opForm.patchValue({ montoBase: article.precioVentaContado });
      }
    }
  }

  onLoanChange(event: any) {
    const planId = event.detail.value;
    if (planId) {
      const plan = this.loanPlanService.userLoanPlans().find(p => p.id === planId);
      if (plan) {
        this.opForm.patchValue({
          montoBase: plan.montoBase,
          porcentajeRecargo: plan.porcentajeRecargo,
          cuotasCount: plan.cuotasCount,
          tieneVencimiento: true,
          periodicidad: plan.periodicidad,
          diaSemana: plan.diaSemana ?? new Date().getDay(),
          diaVencimiento: plan.diaVencimiento ?? 5
        });
      }
    }
  }

  calculatePreview() {
    const { montoBase, porcentajeRecargo } = this.opForm.getRawValue();
    return this.operationService.calculateTotal(montoBase, porcentajeRecargo);
  }

  onSubmit() {
    if (this.opForm.valid && !this.isSaving()) {
      this.save.emit(this.opForm.getRawValue());
    }
  }
}
