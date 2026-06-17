import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoansListComponent } from './loans-list.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('LoansListComponent', () => {
    let component: LoansListComponent;
    let fixture: ComponentFixture<LoansListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LoansListComponent]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(LoansListComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('loans', [
            { id: 'l1', nombre: 'Plan A', montoBase: 100, porcentajeRecargo: 10, cuotasCount: 5, periodicidad: 'SEMANAL', diaSemana: 1, usuarioId: 'u1' }
        ]);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
