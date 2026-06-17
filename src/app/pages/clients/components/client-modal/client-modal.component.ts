import { Component, inject, OnChanges, SimpleChanges, input, output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonModal, IonNote } from '@ionic/angular/standalone';
import { Cliente } from '../../../../core/models';

function maxWordsValidator(maxWords: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const words = control.value.trim().split(/\s+/);
    return words.length > maxWords ? { maxWords: true } : null;
  };
}

@Component({
  selector: 'app-client-modal',
  templateUrl: './client-modal.component.html',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonModal, IonNote, ReactiveFormsModule]
})
export class ClientModalComponent implements OnChanges {
  readonly isOpen = input(false);
  readonly isSaving = input(false);
  readonly isEditing = input(false);
  readonly clientData = input<Cliente | null>(null);
  readonly didDismiss = output<void>();
  readonly save = output<Partial<Cliente>>();

  private fb = inject(FormBuilder);

  clientForm = this.fb.nonNullable.group({
    nombre: ['', [
      Validators.required, 
      Validators.minLength(3),
      Validators.maxLength(40),
      Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/),
      maxWordsValidator(2)
    ]],
    telefono: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(15),
      Validators.pattern(/^\+?[\d\s\-]+$/)
    ]]
  });

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      if (this.isEditing() && this.clientData()) {
        this.clientForm.patchValue({
          nombre: this.clientData()!.nombre,
          telefono: this.clientData()!.telefono
        });
      } else {
        this.clientForm.reset();
      }
    }
  }

  onSubmit() {
    if (this.clientForm.valid && !this.isSaving()) {
      this.save.emit(this.clientForm.getRawValue());
    }
  }
}
