export type EstadoCuota = 'PENDIENTE' | 'PAGADA' | 'VENCIDA';

export interface Cuota {
    id: string;
    operacionId: string;
    usuarioId: string;
    monto: number;
    vencimiento?: string; 
    fechaPago?: string; 
    estado: EstadoCuota;
}
