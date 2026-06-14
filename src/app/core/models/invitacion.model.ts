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
