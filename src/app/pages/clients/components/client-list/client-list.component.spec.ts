import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientListComponent } from './client-list.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('ClientListComponent', () => {
    let component: ClientListComponent;
    let fixture: ComponentFixture<ClientListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ClientListComponent]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ClientListComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('clients', [
            { id: '1', nombre: 'Juan Perez', telefono: '12345678', usuarioId: 'u1' }
        ]);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
