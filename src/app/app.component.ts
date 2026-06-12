import { Component, ChangeDetectionStrategy } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { PwaService } from './core/services/pwa.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(private pwaService: PwaService) {}
}
