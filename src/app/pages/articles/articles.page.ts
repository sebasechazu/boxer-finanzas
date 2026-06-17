import { Component, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonInput, IonButton, IonIcon, IonModal, IonNote,
  IonButtons } from '@ionic/angular/standalone';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ArticleService } from '../../core/services/article.service';
import { UiService } from '../../core/services/ui.service';
import { addIcons } from 'ionicons';
import { addOutline, createOutline, trashOutline, cubeOutline } from 'ionicons/icons';
import { Articulo } from '../../core/models';

@Component({
  selector: 'app-articles',
  templateUrl: 'articles.page.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButtons, CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonInput, IonButton, IonIcon, IonModal,
    ReactiveFormsModule
  ],
})
export class ArticlesPage {
  public articleService = inject(ArticleService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private uiService = inject(UiService);

  isModalOpen = false;
  isSaving = false;
  editingArticleId: string | null = null;

  articleForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    precioCompra: [0, [Validators.required, Validators.min(0)]],
    precioVentaContado: [0, [Validators.required, Validators.min(0)]]
  });

  constructor() {
    addIcons({ addOutline, createOutline, trashOutline, cubeOutline });
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

  async onSubmit() {
    if (this.articleForm.valid && !this.isSaving) {
      this.isSaving = true;
      this.cdr.detectChanges();

      try {
        const rawValues = this.articleForm.getRawValue();
        const articleData = {
          nombre: rawValues.nombre,
          precioCompra: Number(rawValues.precioCompra),
          precioVentaContado: Number(rawValues.precioVentaContado)
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
        this.cdr.detectChanges();
      }
    }
  }
}
