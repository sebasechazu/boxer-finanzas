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
    nombre: string;          
    nombreNegocio: string;
    creadoEn: string;       
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
    creadoEn: string;        
}

/** Relación propietario-colaborador ya aceptada (colección `colaboradores`) */
export interface Colaborador {
    id: string;              
    propietarioUid: string;
    colaboradorUid: string;
    colaboradorEmail: string;
    colaboradorNombre: string;
    creadoEn: string;        
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
    saldoPendiente: number | Signal<number>; 
}

export interface Articulo {
    id: string;
    usuarioId: string;
    nombre: string;
    precioCompra: number;
    precioVentaContado: number;
}

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

export type TipoOperacion = 'PRESTAMO' | 'VENTA';
export type TipoPeriodicidad = 'SEMANAL' | 'QUINCENAL' | 'MENSUAL';

export interface Operacion {
    id: string;
    usuarioId: string;
    clienteId: string;
    tipo: TipoOperacion;
    ventaId?: string;
    prestamoId?: string;
    cuotasCount: number;
    periodicidad?: TipoPeriodicidad;
    diaSemana?: number; //
    diaVencimiento?: number; // 
    fechaPrimerVencimiento?: string; 
}

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
