import { Component, ChangeDetectionStrategy } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  pieChartOutline, cashOutline, personOutline, cubeOutline, receiptOutline,
  pieChart, cash, person, cube, peopleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon],
})
export class TabsPage {
  constructor() {
    addIcons({
      pieChartOutline,
      cashOutline,
      personOutline,
      cubeOutline,
      receiptOutline,
      peopleOutline,
      pieChart, 
      cash,
      person,
      cube
    });
  }
}
