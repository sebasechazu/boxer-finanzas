import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ArticlesPage } from './articles.page';
import { ArticleService } from '../../core/services/article.service';
import { UiService } from '../../core/services/ui.service';
import { FormBuilder } from '@angular/forms';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createArticleServiceMock, createUiServiceMock } from '../../testing/mocks';

describe('ArticlesPage', () => {
    let component: ArticlesPage;
    let fixture: ComponentFixture<ArticlesPage>;
    let mockArticleService: any;
    let mockUiService: any;

    beforeEach(async () => {
        mockArticleService = createArticleServiceMock();
        mockUiService = createUiServiceMock();

        await TestBed.configureTestingModule({
            imports: [ArticlesPage],
            providers: [
                FormBuilder,
                { provide: ArticleService, useValue: mockArticleService },
                { provide: UiService, useValue: mockUiService }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ArticlesPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('debe abrir el modal en openAddModal y limpiar el formulario', () => {
        component.openAddModal();
        expect(component.isModalOpen).toBe(true);
        expect(component.editingArticleId).toBeNull();
        expect(component.articleForm.value).toEqual({ nombre: '', precioCompra: 0, precioVentaContado: 0 });
    });

    it('debe cargar los datos en el formulario al llamar a editArticle', () => {
        const article = { id: 'art123', nombre: 'Articulo Test', precioCompra: 100, precioVentaContado: 150, usuarioId: 'user1' };
        component.editArticle(article);
        expect(component.isModalOpen).toBe(true);
        expect(component.editingArticleId).toBe('art123');
        expect(component.articleForm.value).toEqual({ nombre: 'Articulo Test', precioCompra: 100, precioVentaContado: 150 });
    });

    it('debe cerrar el modal al llamar a closeModal', () => {
        component.isModalOpen = true;
        component.editingArticleId = '123';
        component.closeModal();
        expect(component.isModalOpen).toBe(false);
        expect(component.editingArticleId).toBeNull();
    });

    it('debe llamar a uiService.showConfirmAlert en deleteArticle', async () => {
        await component.deleteArticle('123');
        expect(mockUiService.showConfirmAlert).toHaveBeenCalled();
    });

    it('debe llamar a articleService.addArticle en onSubmit si es un articulo nuevo', async () => {
        component.articleForm.setValue({ nombre: 'Nuevo Articulo', precioCompra: 10, precioVentaContado: 15 });
        await component.onSubmit();
        expect(mockArticleService.addArticle).toHaveBeenCalledWith({ nombre: 'Nuevo Articulo', precioCompra: 10, precioVentaContado: 15 });
    });

    it('debe llamar a articleService.updateArticle en onSubmit si se esta editando', async () => {
        component.editingArticleId = '123';
        component.articleForm.setValue({ nombre: 'Editado', precioCompra: 20, precioVentaContado: 30 });
        await component.onSubmit();
        expect(mockArticleService.updateArticle).toHaveBeenCalledWith('123', { nombre: 'Editado', precioCompra: 20, precioVentaContado: 30 });
    });
});
