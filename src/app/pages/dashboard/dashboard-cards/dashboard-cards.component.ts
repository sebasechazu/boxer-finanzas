import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonLabel } from '@ionic/angular/standalone';
import { CurrencyPipe } from '@angular/common';

@Component({
    selector: 'app-dashboard-cards',
    templateUrl: './dashboard-cards.component.html',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonLabel, IonCardTitle, IonCardHeader,
    IonGrid, IonRow, IonCol,
    IonCard, IonCardContent,
    CurrencyPipe]
})
export class DashboardCardsComponent {
    totalPaid = input.required<number>();
    moneyOnTheStreet = input.required<number>();
    collectedToday = input.required<number>();
    pendingCollectionsToday = input.required<number>();
}
