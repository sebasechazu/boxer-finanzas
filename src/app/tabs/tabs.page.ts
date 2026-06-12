import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    pieChartOutline, cashOutline, personOutline, cubeOutline, receiptOutline,
    pieChart, cash, person, cube
} from 'ionicons/icons';
import { AvatarComponent } from '../components/avatar/avatar.component';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, AvatarComponent],
})
export class TabsPage {
  constructor() {
    addIcons({
        pieChartOutline, cashOutline, personOutline, cubeOutline, receiptOutline,
        pieChart, cash, person, cube
    });
  }
}
