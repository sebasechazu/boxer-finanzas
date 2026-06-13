import { Component, signal } from '@angular/core';
import { IonHeader, IonContent, IonSegment, IonSegmentButton, IonLabel, IonToolbar } from "@ionic/angular/standalone";
import { OperationsListComponent } from "./operations-list/operations-list.component";
import { ArticlesListComponent } from "./articles-list/articles-list.component";

@Component({
  selector: 'app-historial',
  templateUrl: './historial.component.html',
  imports: [IonToolbar, IonLabel, IonSegmentButton, IonSegment, IonHeader, IonContent, OperationsListComponent, ArticlesListComponent]
})
export class HistorialComponent {

  selectedTab = signal<'operaciones' | 'articulos'>('operaciones');

  onTabChange(event: any) {
    this.selectedTab.set(event.detail.value);
  }
}
