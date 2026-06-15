import { Component, signal } from '@angular/core';
import { IonHeader, IonContent, IonSegment, IonSegmentButton, IonLabel, IonToolbar } from "@ionic/angular/standalone";
import { OperationsTabComponent } from "./operations-tab/operations-tab.component";
import { ArticlesTabComponent } from "./articles-tab/articles-tab.component";
import { LoansTabComponent } from "./loans-tab/loans-tab.component";

@Component({
  selector: 'app-historial',
  templateUrl: './historial.component.html',
  imports: [
    IonToolbar, 
    IonLabel, 
    IonSegmentButton, 
    IonSegment, 
    IonHeader, 
    IonContent, 
    OperationsTabComponent,
    ArticlesTabComponent, 
    LoansTabComponent
  ]
})
export class HistorialComponent {

  selectedTab = signal<'operaciones' | 'articulos' | 'prestamos'>('operaciones');

  onTabChange(event: any) {
    this.selectedTab.set(event.detail.value);
  }
}
