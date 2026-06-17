import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ArticlesTabComponent } from './articles-tab.component';
import { ArticleService } from '../../../core/services/article.service';
import { UiService } from '../../../core/services/ui.service';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createArticleServiceMock, createUiServiceMock } from '../../../testing/mocks';

describe('ArticlesTabComponent', () => {
    let component: ArticlesTabComponent;
    let fixture: ComponentFixture<ArticlesTabComponent>;
    let mockArticleService: any;
    let mockUiService: any;

    beforeEach(async () => {
        mockArticleService = createArticleServiceMock();
        mockUiService = createUiServiceMock();

        await TestBed.configureTestingModule({
            imports: [ArticlesTabComponent],
            providers: [
                { provide: ArticleService, useValue: mockArticleService },
                { provide: UiService, useValue: mockUiService }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ArticlesTabComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('debe abrir el modal en modo creacion en openAddModal', () => {
        component.openAddModal();
        expect(component.isModalOpen).toBe(true);
        expect(component.editingArticleId).toBeNull();
        expect(component.initialArticleData).toBeNull();
    });

    it('debe abrir el modal en modo edicion con datos al llamar a editArticle', () => {
        const article = { id: 'art-1', nombre: 'Test', precioCompra: 10, precioVentaContado: 15, usuarioId: 'u1' };
        component.editArticle(article);
        expect(component.isModalOpen).toBe(true);
        expect(component.editingArticleId).toBe('art-1');
        expect(component.initialArticleData).toEqual(article);
    });

    it('debe cerrar el modal al llamar a closeModal', () => {
        component.isModalOpen = true;
        component.closeModal();
        expect(component.isModalOpen).toBe(false);
        expect(component.editingArticleId).toBeNull();
        expect(component.initialArticleData).toBeNull();
    });

    it('debe llamar a uiService.showConfirmAlert en deleteArticle', async () => {
        await component.deleteArticle('art-1');
        expect(mockUiService.showConfirmAlert).toHaveBeenCalled();
    });

    it('debe llamar a articleService.addArticle en onSaveArticle si es nuevo', async () => {
        await component.onSaveArticle({ nombre: 'Item', precioCompra: '10', precioVentaContado: '20' });
        expect(mockArticleService.addArticle).toHaveBeenCalledWith({ nombre: 'Item', precioCompra: 10, precioVentaContado: 20 });
    });

    it('debe llamar a articleService.updateArticle en onSaveArticle si se edita', async () => {
        component.editingArticleId = 'art-1';
        await component.onSaveArticle({ nombre: 'Item Editado', precioCompra: '15', precioVentaContado: '25' });
        expect(mockArticleService.updateArticle).toHaveBeenCalledWith('art-1', { nombre: 'Item Editado', precioCompra: 15, precioVentaContado: 25 });
    });
});
