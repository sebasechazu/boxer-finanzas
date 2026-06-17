import { Injectable, inject } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root'
})
export class UiService {
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  /**
   * Muestra una alerta estándar de error.
   */
  async showErrorAlert(message: string, error?: unknown, header = 'Error') {
    const errorMessage = (error instanceof Error)
      ? error.message
      : (typeof error === 'string' ? error : message);
    const alert = await this.alertCtrl.create({
      header,
      message: errorMessage,
      buttons: ['OK']
    });
    await alert.present();
  }

  /**
   * Muestra una alerta de confirmación con callbacks.
   */
  async showConfirmAlert(options: {
    header: string;
    message: string;
    confirmText?: string;
    confirmRole?: string;
    cancelText?: string;
    onConfirm: () => void | Promise<void>;
  }) {
    const alert = await this.alertCtrl.create({
      header: options.header,
      message: options.message,
      buttons: [
        {
          text: options.cancelText || 'Cancelar',
          role: 'cancel'
        },
        {
          text: options.confirmText || 'Aceptar',
          role: options.confirmRole,
          handler: async () => {
            await options.onConfirm();
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Muestra un toast en pantalla.
   */
  async showToast(message: string, duration = 2000, position: 'top' | 'bottom' | 'middle' = 'bottom') {
    const toast = await this.toastCtrl.create({
      message,
      duration,
      position
    });
    await toast.present();
  }
}
