import { EstadoInvitacion } from "../types/estado-invitacion.type";

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
