import { Component, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonInput, IonButton, IonIcon, IonModal,
  AlertController, IonButtons } from '@ionic/angular/standalone';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FinanceService } from '../../core/services/finance.service';
import { addIcons } from 'ionicons';
import { logoWhatsapp, addOutline, personAddOutline, trashOutline, createOutline } from 'ionicons/icons';

@Component({
  selector: 'app-clients',
  templateUrl: 'clients.page.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [IonButtons, 
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonInput, IonButton, IonIcon, IonModal,
    ReactiveFormsModule
  ],
})
export class ClientsPage {
  public financeService = inject(FinanceService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private alertCtrl = inject(AlertController);

  isModalOpen = false;
  isSaving = false;
  editingClientId: string | null = null;

  clientForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    telefono: ['', Validators.required]
  });

  constructor() {
    addIcons({ addOutline, personAddOutline, logoWhatsapp, trashOutline, createOutline });
  }

  openWhatsApp(phone: string) {
    // Limpiar el número de caracteres no numéricos excepto el +
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  }

  openAddModal() {
    this.editingClientId = null;
    this.clientForm.reset();
    this.isModalOpen = true;
  }

  editClient(client: any) {
    this.editingClientId = client.id;
    this.clientForm.patchValue({
      nombre: client.nombre,
      telefono: client.telefono
    });
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingClientId = null;
  }

  async deleteClient(id: string) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que deseas eliminar este cliente?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.financeService.deleteClient(id);
            } catch (error) {
              console.error('Error deleting client:', error);
              const errorAlert = await this.alertCtrl.create({
                header: 'Error',
                message: 'No se pudo eliminar el cliente',
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
    if (this.clientForm.valid && !this.isSaving) {
      this.isSaving = true;
      this.cdr.detectChanges();
      try {
        if (this.editingClientId) {
          await this.financeService.updateClient(this.editingClientId, this.clientForm.value);
        } else {
          await this.financeService.addClient(this.clientForm.value);
        }
        this.clientForm.reset();
        this.closeModal();
        this.cdr.detectChanges();
      } catch (error: any) {
        console.error('Error saving client:', error);
        const errorAlert = await this.alertCtrl.create({
          header: 'Error',
          message: error.message || 'Error al guardar el cliente',
          buttons: ['OK']
        });
        await errorAlert.present();
      } finally {
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    }
  }
}
