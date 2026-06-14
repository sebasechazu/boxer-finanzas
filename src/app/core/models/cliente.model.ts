import { Signal } from '@angular/core';

export interface Cliente {
    id: string;
    usuarioId: string;
    nombre: string;
    telefono: string;
    saldoPendiente: number | Signal<number>; 
}
