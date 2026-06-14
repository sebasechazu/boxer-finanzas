/** Descriptor de una cuenta a la que el usuario tiene acceso */
export interface CuentaAccesible {
    propietarioUid: string;
    propietarioNombre: string;
    propietarioNombreNegocio: string;
    esPropia: boolean;
}
