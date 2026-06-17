import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonFab, IonFabButton, IonIcon } from '@ionic/angular/standalone';
import { ArticleService } from '../../../core/services/article.service';
import { UiService } from '../../../core/services/ui.service';
import { addIcons } from 'ionicons';
import { addOutline, createOutline, trashOutline, cubeOutline } from 'ionicons/icons';
import { Articulo } from '../../../core/models';
import { ArticlesListComponent } from './articles-list/articles-list.component';
import { ArticleModalComponent } from './article-modal/article-modal.component';

@Component({
  selector: 'app-articles-tab',
  templateUrl: 'articles-tab.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    IonFab, IonFabButton, IonIcon,
    ArticlesListComponent, ArticleModalComponent
],
})
export class ArticlesTabComponent {
  public articleService = inject(ArticleService);
  private uiService = inject(UiService);

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
    await this.uiService.showConfirmAlert({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que deseas eliminar este artículo?',
      confirmText: 'Eliminar',
      confirmRole: 'destructive',
      onConfirm: async () => {
        try {
          await this.articleService.deleteArticle(id);
        } catch (error) {
          await this.uiService.showErrorAlert('No se pudo eliminar el artículo', error);
        }
      }
    });
  }

  async onSaveArticle(articleFormData: { nombre: string; precioCompra: number; precioVentaContado: number }) {
    if (!this.isSaving) {
      this.isSaving = true;
      try {
        const articleData = {
          nombre: articleFormData.nombre,
          precioCompra: Number(articleFormData.precioCompra),
          precioVentaContado: Number(articleFormData.precioVentaContado)
        };
        if (this.editingArticleId) {
          await this.articleService.updateArticle(this.editingArticleId, articleData);
        } else {
          await this.articleService.addArticle(articleData);
        }
        this.closeModal();
      } catch (error) {
        await this.uiService.showErrorAlert('Error al guardar el artículo', error);
      } finally {
        this.isSaving = false;
      }
    }
  }
}
