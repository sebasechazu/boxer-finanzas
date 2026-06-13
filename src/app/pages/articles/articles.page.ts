import { Component, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonInput, IonButton, IonIcon, IonModal, IonNote,
  AlertController, IonButtons, IonGrid, IonRow, IonCol, IonCard, IonCardContent } from '@ionic/angular/standalone';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FinanceService } from '../../core/services/finance.service';
import { addIcons } from 'ionicons';
import { addOutline, createOutline, trashOutline, cubeOutline, cashOutline, trendingUpOutline, walletOutline } from 'ionicons/icons';
import { Articulo } from '../../core/models/models';

@Component({
  selector: 'app-articles',
  templateUrl: 'articles.page.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [IonButtons, CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonInput, IonButton, IonIcon, IonModal,
    IonGrid, IonRow, IonCol, IonCard, IonCardContent,
    ReactiveFormsModule
  ],
})
export class ArticlesPage {
  public financeService = inject(FinanceService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private alertCtrl = inject(AlertController);

  isModalOpen = false;
  isSaving = false;
  editingArticleId: string | null = null;

  articleForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    precioCompra: [0, [Validators.required, Validators.min(0)]],
    precioVentaContado: [0, [Validators.required, Validators.min(0)]]
  });

  constructor() {
    addIcons({ addOutline, createOutline, trashOutline, cubeOutline, cashOutline, trendingUpOutline, walletOutline });
  }

  openAddModal() {
    this.editingArticleId = null;
    this.articleForm.reset({ precioCompra: 0, precioVentaContado: 0 });
    this.isModalOpen = true;
  }

  editArticle(article: Articulo) {
    this.editingArticleId = article.id;
    this.articleForm.patchValue({
      nombre: article.nombre,
      precioCompra: article.precioCompra || 0,
      precioVentaContado: article.precioVentaContado
    });
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingArticleId = null;
  }

  async deleteArticle(id: string) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que deseas eliminar este artículo?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.financeService.deleteArticle(id);
            } catch (error) {
              console.error('Error deleting article:', error);
              const errorAlert = await this.alertCtrl.create({
                header: 'Error',
                message: 'No se pudo eliminar el artículo',
                buttons: ['OK']
              });
              await errorAlert.present();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async onSubmit() {
    if (this.articleForm.valid && !this.isSaving) {
      this.isSaving = true;
      this.cdr.detectChanges();

      try {
        const articleData = {
          ...this.articleForm.value,
          precioCompra: Number(this.articleForm.value.precioCompra),
          precioVentaContado: Number(this.articleForm.value.precioVentaContado)
        };

        if (this.editingArticleId) {
          await this.financeService.updateArticle(this.editingArticleId, articleData);
        } else {
          await this.financeService.addArticle(articleData);
        }
        this.closeModal();
      } catch (error: any) {
        console.error('Error saving article:', error);
        const errorAlert = await this.alertCtrl.create({
          header: 'Error',
          message: error.message || 'Error al guardar el artículo',
          buttons: ['OK']
        });
        await errorAlert.present();
      } finally {
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    }
  }
}
