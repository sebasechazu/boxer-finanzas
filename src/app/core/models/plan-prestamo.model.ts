import { TipoPeriodicidad } from './periodicidad.model';

export interface PlanPrestamo {
    id: string;
    usuarioId: string;
    nombre: string;
    montoBase: number;
    porcentajeRecargo: number;
    cuotasCount: number;
    periodicidad: TipoPeriodicidad;
    diaSemana?: number;
    diaVencimiento?: number;
}
