import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonList, IonItem, IonLabel, IonButton, IonIcon, IonItemDivider, IonItemSliding, IonItemOptions, IonItemOption, IonCard, IonNote } from '@ionic/angular/standalone';
import { Cliente } from '../../../../core/models';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-client-list',
  templateUrl: './client-list.component.html',
  standalone: true,
  imports: [IonNote,
    IonCard, IonItemOption, IonItemOptions, IonItemSliding, IonList, IonItem, IonLabel, IonIcon, CurrencyPipe]
})
export class ClientListComponent {
  @Input() clients: readonly Cliente[] = [];
  @Output() edit = new EventEmitter<Cliente>();
  @Output() delete = new EventEmitter<string>();
  @Output() openWhatsApp = new EventEmitter<string>();
}
