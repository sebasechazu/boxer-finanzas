import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonList, IonItem, IonIcon, IonLabel, IonItemSliding, IonItemOptions, IonItemOption, IonCardHeader, IonCard, IonCardTitle, IonCardContent, IonNote } from '@ionic/angular/standalone';
import { Articulo } from '../../../../core/models';

@Component({
  selector: 'app-articles-list',
  templateUrl: './articles-list.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonNote, IonCardContent, IonCardTitle, IonCard, IonCardHeader, IonItemOption, IonItemOptions, IonItemSliding, CommonModule, IonList, IonItem, IonIcon, IonLabel]
})
export class ArticlesListComponent {
  @Input() articles: Articulo[] = [];
  @Output() edit = new EventEmitter<Articulo>();
  @Output() delete = new EventEmitter<string>();
}
