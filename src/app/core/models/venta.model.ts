export interface Venta {
    id: string;
    usuarioId: string;
    clienteId: string;
    articuloId?: string;
    montoBase: number;
    porcentajeRecargo: number;
    totalFinal: number;
    creadoEn: string;
}
