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
}
