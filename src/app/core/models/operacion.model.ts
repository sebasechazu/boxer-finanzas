import { TipoPeriodicidad } from './periodicidad.model';

export type TipoOperacion = 'PRESTAMO' | 'VENTA';

export interface Operacion {
    id: string;
    usuarioId: string;
    clienteId: string;
    tipo: TipoOperacion;
    ventaId?: string;
    prestamoId?: string;
    cuotasCount: number;
    periodicidad?: TipoPeriodicidad;
    diaSemana?: number; 
    diaVencimiento?: number; 
    fechaPrimerVencimiento?: string; 
}
