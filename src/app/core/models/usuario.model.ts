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
