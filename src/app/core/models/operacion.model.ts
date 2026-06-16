import { TipoOperacion } from '../types/tipo-operacion.type';
import { TipoPeriodicidad } from './periodicidad.model';

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
