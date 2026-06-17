import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ArticlesListComponent } from './articles-list.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('ArticlesListComponent', () => {
    let component: ArticlesListComponent;
    let fixture: ComponentFixture<ArticlesListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ArticlesListComponent]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ArticlesListComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('articles', [
            { id: '1', nombre: 'Articulo Test', precioCompra: 100, precioVentaContado: 150, usuarioId: 'u1' }
        ]);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
