import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonFab, IonFabButton, IonIcon, AlertController } from '@ionic/angular/standalone';
import { ArticleService } from '../../../core/services/article.service';
import { addIcons } from 'ionicons';
import { addOutline, createOutline, trashOutline, cubeOutline } from 'ionicons/icons';
import { Articulo } from '../../../core/models';
import { ArticlesListComponent } from './articles-list/articles-list.component';
import { ArticleModalComponent } from './article-modal/article-modal.component';

@Component({
  selector: 'app-articles-tab',
  templateUrl: 'articles-tab.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    CommonModule,
    IonFab, IonFabButton, IonIcon,
    ArticlesListComponent, ArticleModalComponent
],
})
export class ArticlesTabComponent {
  public articleService = inject(ArticleService);
  private alertCtrl = inject(AlertController);

  isModalOpen = false;
  isSaving = false;
  editingArticleId: string | null = null;
  initialArticleData: Partial<Articulo> | null = null;

  constructor() {
    addIcons({ addOutline, createOutline, trashOutline, cubeOutline });
  }

  openAddModal() {
    this.editingArticleId = null;
    this.initialArticleData = null;
    this.isModalOpen = true;
  }

  editArticle(article: Articulo) {
    this.editingArticleId = article.id;
    this.initialArticleData = { ...article };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingArticleId = null;
    this.initialArticleData = null;
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
              await this.articleService.deleteArticle(id);
            } catch (error) {
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

  async onSaveArticle(articleFormData: any) {
    if (!this.isSaving) {
      this.isSaving = true;
      try {
        const articleData = {
          ...articleFormData,
          precioCompra: Number(articleFormData.precioCompra),
          precioVentaContado: Number(articleFormData.precioVentaContado)
        };
        if (this.editingArticleId) {
          await this.articleService.updateArticle(this.editingArticleId, articleData);
        } else {
          await this.articleService.addArticle(articleData);
        }
        this.closeModal();
      } catch (error: any) {
        const errorAlert = await this.alertCtrl.create({
          header: 'Error',
          message: error.message || 'Error al guardar el artículo',
          buttons: ['OK']
        });
        await errorAlert.present();
      } finally {
        this.isSaving = false;
      }
    }
  }
}
