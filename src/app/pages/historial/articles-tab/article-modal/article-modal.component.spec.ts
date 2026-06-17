import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ArticleModalComponent } from './article-modal.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SimpleChange } from '@angular/core';

describe('ArticleModalComponent', () => {
    let component: ArticleModalComponent;
    let fixture: ComponentFixture<ArticleModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ArticleModalComponent]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ArticleModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('debe resetear el formulario si isOpen cambia a true y no se esta editando', () => {
        component.articleForm.setValue({ nombre: 'Articulo', precioCompra: 10, precioVentaContado: 20 });
        fixture.componentRef.setInput('editingArticleId', null);
        fixture.componentRef.setInput('isOpen', true);
        fixture.detectChanges();
        expect(component.articleForm.value).toEqual({ nombre: '', precioCompra: 0, precioVentaContado: 0 });
    });

    it('debe cargar los datos en el formulario si initialData cambia', () => {
        component.articleForm.reset();
        const initialData = { nombre: 'Articulo Viejo', precioCompra: 50, precioVentaContado: 100 };
        fixture.componentRef.setInput('initialData', initialData);
        fixture.detectChanges();
        expect(component.articleForm.value).toEqual({ nombre: 'Articulo Viejo', precioCompra: 50, precioVentaContado: 100 });
    });

    it('debe emitir save si el formulario es valido en onSubmit', () => {
        const spySave = vi.spyOn(component.save, 'emit');
        component.articleForm.setValue({ nombre: 'Articulo Valido', precioCompra: 5, precioVentaContado: 10 });
        fixture.componentRef.setInput('isSaving', false);
        fixture.detectChanges();
        component.onSubmit();
        expect(spySave).toHaveBeenCalledWith({ nombre: 'Articulo Valido', precioCompra: 5, precioVentaContado: 10 });
    });
});
