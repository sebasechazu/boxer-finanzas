import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonList, IonItem, IonIcon, IonLabel, IonButton } from '@ionic/angular/standalone';
import { PlanPrestamo } from '../../../../core/models';

@Component({
  selector: 'app-loans-list',
  templateUrl: './loans-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IonList, IonItem, IonIcon, IonLabel, IonButton]
})
export class LoansListComponent {
  readonly loans = input<PlanPrestamo[]>([]);
  readonly edit = output<PlanPrestamo>();
  readonly delete = output<string>();
}
