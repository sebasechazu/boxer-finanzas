import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientModalComponent } from './client-modal.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SimpleChange } from '@angular/core';

describe('ClientModalComponent', () => {
    let component: ClientModalComponent;
    let fixture: ComponentFixture<ClientModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ClientModalComponent]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ClientModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('debe resetear el formulario si isOpen cambia a true y no se esta editando', () => {
        component.clientForm.setValue({ nombre: 'Juan', telefono: '12345678' });
        fixture.componentRef.setInput('isEditing', false);
        fixture.componentRef.setInput('isOpen', true);
        fixture.detectChanges();
        expect(component.clientForm.value).toEqual({ nombre: '', telefono: '' });
    });

    it('debe cargar los datos en el formulario si isOpen cambia a true y se esta editando', () => {
        component.clientForm.reset();
        fixture.componentRef.setInput('isEditing', true);
        fixture.componentRef.setInput('clientData', { id: 'c1', nombre: 'Juan Perez', telefono: '12345678', usuarioId: 'u1' });
        fixture.componentRef.setInput('isOpen', true);
        fixture.detectChanges();
        expect(component.clientForm.value).toEqual({ nombre: 'Juan Perez', telefono: '12345678' });
    });

    it('debe emitir save si el formulario es valido en onSubmit', () => {
        const spySave = vi.spyOn(component.save, 'emit');
        component.clientForm.setValue({ nombre: 'Juan Perez', telefono: '12345678' });
        fixture.componentRef.setInput('isSaving', false);
        fixture.detectChanges();
        component.onSubmit();
        expect(spySave).toHaveBeenCalledWith({ nombre: 'Juan Perez', telefono: '12345678' });
    });

    it('no debe emitir save si el formulario es invalido', () => {
        const spySave = vi.spyOn(component.save, 'emit');
        component.clientForm.setValue({ nombre: 'J', telefono: '1' }); // Invalido
        component.onSubmit();
        expect(spySave).not.toHaveBeenCalled();
    });
});
