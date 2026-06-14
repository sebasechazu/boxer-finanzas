export interface Prestamo {
    id: string;
    usuarioId: string;
    clienteId: string;
    planId?: string;
    montoBase: number;
    porcentajeRecargo: number;
    totalFinal: number;
    creadoEn: string;
}
