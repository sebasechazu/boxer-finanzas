import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistorialComponent } from './historial.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('HistorialComponent', () => {
    let component: HistorialComponent;
    let fixture: ComponentFixture<HistorialComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HistorialComponent]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(HistorialComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('debe cambiar de pestaña seleccionada al llamar a onTabChange', () => {
        expect(component.selectedTab()).toBe('operaciones');
        component.onTabChange({ detail: { value: 'articulos' } });
        expect(component.selectedTab()).toBe('articulos');
    });
});
