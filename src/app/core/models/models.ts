import { Signal } from '@angular/core';

export interface Usuario {
    uid: string;
    email: string;
    nombreNegocio: string;
}

/** Perfil completo del usuario guardado en Firestore (colección `usuarios/{uid}`) */
export interface PerfilUsuario {
    uid: string;
    email: string;
    nombre: string;          // displayName de Google
    nombreNegocio: string;
    creadoEn: string;        // ISO string
}

export type EstadoInvitacion = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';

/** Invitación enviada por un propietario a otro usuario (colección `invitaciones`) */
export interface Invitacion {
    id: string;
    propietarioUid: string;
    propietarioEmail: string;
    propietarioNombre: string;
    propietarioNombreNegocio: string;
    emailInvitado: string;
    estado: EstadoInvitacion;
    creadoEn: string;        // ISO string
}

/** Relación propietario-colaborador ya aceptada (colección `colaboradores`) */
export interface Colaborador {
    id: string;              // formato: `{propietarioUid}_{colaboradorUid}`
    propietarioUid: string;
    colaboradorUid: string;
    colaboradorEmail: string;
    colaboradorNombre: string;
    creadoEn: string;        // ISO string
}

/** Descriptor de una cuenta a la que el usuario tiene acceso */
export interface CuentaAccesible {
    propietarioUid: string;
    propietarioNombre: string;
    propietarioNombreNegocio: string;
    esPropia: boolean;
}

export interface Cliente {
    id: string;
    usuarioId: string;
    nombre: string;
    telefono: string;
    saldoPendiente: number | Signal<number>; // Se usará Signal para la reactividad en UI
}

export interface Articulo {
    id: string;
    usuarioId: string;
    nombre: string;
    precioCompra: number;
    precioVentaContado: number;
}

export type TipoOperacion = 'PRESTAMO' | 'VENTA';
export type TipoPeriodicidad = 'SEMANAL' | 'QUINCENAL' | 'MENSUAL';

export interface Operacion {
    id: string;
    usuarioId: string;
    clienteId: string;
    articuloId?: string;
    tipo: TipoOperacion;
    montoBase: number;
    porcentajeRecargo: number;
    totalFinal: number;
    cuotasCount: number;
    periodicidad?: TipoPeriodicidad;
    diaSemana?: number; // 0-6 (Domingo a Sábado)
    diaVencimiento?: number; // 1-31 (Día del mes)
    fechaPrimerVencimiento?: string; // ISO string
}

export type EstadoCuota = 'PENDIENTE' | 'PAGADA' | 'VENCIDA';

export interface Cuota {
    id: string;
    operacionId: string;
    usuarioId: string;
    monto: number;
    vencimiento?: string; // ISO string
    fechaPago?: string; // ISO string
    estado: EstadoCuota;
}
