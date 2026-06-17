import { Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { ToastController } from '@ionic/angular/standalone';
import { filter } from 'rxjs/operators';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class PwaService {
  constructor(
    private swUpdate: SwUpdate,
    private toastController: ToastController
  ) {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(
          filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
          takeUntilDestroyed()
        )
        .subscribe(async () => {
          const toast = await this.toastController.create({
            message: 'Nueva versión disponible. ¿Deseas actualizar?',
            position: 'bottom',
            buttons: [
              {
                text: 'Actualizar',
                role: 'cancel',
                handler: () => {
                  window.location.reload();
                },
              },
            ],
          });
          await toast.present();
        });
    }
  }

  /**
   * Permite compartir contenido nativamente (ej. comprobantes, reportes).
   * Solo funciona en entornos que soporten Web Share API (celulares modernos).
   */
  async shareContent(title: string, text: string, url?: string): Promise<boolean> {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return true;
      } catch (error) {
        console.error('Error al compartir', error);
        return false;
      }
    } else {
      console.warn('Web Share API no está soportada en este navegador');
      return false;
    }
  }

  /**
   * Muestra un globo de notificación (badge) en el ícono de la app en la pantalla de inicio.
   */
  async setAppBadge(count: number): Promise<void> {
    if ('setAppBadge' in navigator) {
      try {
        await (navigator as any).setAppBadge(count);
      } catch (error) {
        console.error('Error al poner el badge', error);
      }
    }
  }

  /**
   * Limpia el globo de notificación del ícono.
   */
  async clearAppBadge(): Promise<void> {
    if ('clearAppBadge' in navigator) {
      try {
        await (navigator as any).clearAppBadge();
      } catch (error) {
        console.error('Error al limpiar el badge', error);
      }
    }
  }
}
