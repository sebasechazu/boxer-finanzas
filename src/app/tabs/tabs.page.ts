import { Component, ChangeDetectionStrategy } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  pieChartOutline, personOutline, receiptOutline,
  peopleOutline, listCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon],
})
export class TabsPage {
  constructor() {
    addIcons({
      pieChartOutline,
      listCircleOutline,
      receiptOutline,
      peopleOutline,
      personOutline,
    });
  }
}
