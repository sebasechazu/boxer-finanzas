import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
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
  @Input() loans: PlanPrestamo[] = [];
  @Output() edit = new EventEmitter<PlanPrestamo>();
  @Output() delete = new EventEmitter<string>();
}
