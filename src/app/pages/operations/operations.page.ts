import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import {
  IonHeader, IonToolbar, IonSegment, IonSegmentButton, IonLabel, IonContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { receiptOutline, cubeOutline } from 'ionicons/icons';
import { OperationsListComponent } from './operations-list/operations-list.component';
import { ArticlesListComponent } from './articles-list/articles-list.component';

@Component({
  selector: 'app-operations',
  templateUrl: 'operations.page.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    IonHeader, IonToolbar, IonSegment, IonSegmentButton, IonLabel, IonContent,
    OperationsListComponent,
    ArticlesListComponent,
  ],
})
export class OperationsPage {
  selectedTab = signal<'operaciones' | 'articulos'>('operaciones');

  constructor() {
    addIcons({ receiptOutline, cubeOutline });
  }

  onTabChange(event: any) {
    this.selectedTab.set(event.detail.value);
  }
}
