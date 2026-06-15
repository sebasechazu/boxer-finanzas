import { EstadoCuota } from "../types/estado-cuota.type";

export interface Cuota {
    id: string;
    operacionId: string;
    usuarioId: string;
    monto: number;
    vencimiento?: string; 
    fechaPago?: string; 
    estado: EstadoCuota;
}
