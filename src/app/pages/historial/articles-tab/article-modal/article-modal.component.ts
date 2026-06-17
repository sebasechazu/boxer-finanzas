import { Component, ChangeDetectionStrategy, OnChanges, SimpleChanges, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonItem, IonLabel, IonInput
} from '@ionic/angular/standalone';
import { Articulo } from '../../../../core/models';

@Component({
  selector: 'app-article-modal',
  templateUrl: './article-modal.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonItem, IonLabel, IonInput
  ]
})
export class ArticleModalComponent implements OnChanges {
  private fb = inject(FormBuilder);

  readonly isOpen = input(false);
  readonly isSaving = input(false);
  readonly editingArticleId = input<string | null>(null);
  readonly initialData = input<Partial<Articulo> | null>(null);

  readonly dismiss = output<void>();
  readonly save = output<{ nombre: string; precioCompra: number; precioVentaContado: number }>();

  articleForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    precioCompra: [0, [Validators.required, Validators.min(0)]],
    precioVentaContado: [0, [Validators.required, Validators.min(0)]]
  });

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialData'] && this.initialData()) {
      this.articleForm.patchValue({
        nombre: this.initialData()!.nombre || '',
        precioCompra: this.initialData()!.precioCompra || 0,
        precioVentaContado: this.initialData()!.precioVentaContado || 0
      });
    } else if (changes['isOpen'] && this.isOpen() && !this.editingArticleId()) {
       this.articleForm.reset({ precioCompra: 0, precioVentaContado: 0 });
    }
  }

  onSubmit() {
    if (this.articleForm.valid && !this.isSaving()) {
      this.save.emit(this.articleForm.getRawValue());
    }
  }
}
