import { Component, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonIcon, IonFab, IonFabButton } from '@ionic/angular/standalone';
import { ClientService } from '../../core/services/client.service';
import { UiService } from '../../core/services/ui.service';
import { addIcons } from 'ionicons';
import { logoWhatsapp, addOutline, personAddOutline, trashOutline, createOutline } from 'ionicons/icons';
import { ClientListComponent } from './components/client-list/client-list.component';
import { ClientModalComponent } from './components/client-modal/client-modal.component';
import { Cliente } from '../../core/models';
import { NotificationBellComponent } from '../../shared/components/notification-bell/notification-bell.component';

@Component({
  selector: 'app-clients',
  templateUrl: 'clients.page.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonFabButton, IonHeader, IonToolbar, IonTitle, IonContent,
    IonIcon, IonFab, ClientListComponent, ClientModalComponent, NotificationBellComponent
  ],
})
export class ClientsPage {
  public clientService = inject(ClientService);
  private cdr = inject(ChangeDetectorRef);
  private uiService = inject(UiService);

  isModalOpen = false;
  isSaving = false;
  editingClientId: string | null = null;
  editingClientData: Cliente | null = null;

  constructor() {
    addIcons({ addOutline, personAddOutline, logoWhatsapp, trashOutline, createOutline });
  }

  openWhatsApp(phone: string) {
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  }

  openAddModal() {
    this.editingClientId = null;
    this.editingClientData = null;
    this.isModalOpen = true;
  }

  editClient(client: Cliente) {
    this.editingClientId = client.id || null;
    this.editingClientData = client;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingClientId = null;
    this.editingClientData = null;
  }

  async deleteClient(id: string) {
    await this.uiService.showConfirmAlert({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que deseas eliminar este cliente?',
      confirmText: 'Eliminar',
      confirmRole: 'destructive',
      onConfirm: async () => {
        try {
          await this.clientService.deleteClient(id);
        } catch (error) {
          console.error('Error deleting client:', error);
          await this.uiService.showErrorAlert('No se pudo eliminar el cliente', error);
        }
      }
    });
  }

  async onSubmit(formData: Pick<Cliente, 'nombre' | 'telefono'>) {
    if (!this.isSaving) {
      this.isSaving = true;
      this.cdr.detectChanges();
      try {
        if (this.editingClientId) {
          await this.clientService.updateClient(this.editingClientId, formData);
        } else {
          await this.clientService.addClient(formData as any);
        }
        this.closeModal();
        this.cdr.detectChanges();
      } catch (error: any) {
        await this.uiService.showErrorAlert('Error al guardar el cliente', error);
      } finally {
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    }
  }
}
