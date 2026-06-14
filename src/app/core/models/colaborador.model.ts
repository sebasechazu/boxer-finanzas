/** Relación propietario-colaborador ya aceptada (colección `colaboradores`) */
export interface Colaborador {
    id: string;              
    propietarioUid: string;
    colaboradorUid: string;
    colaboradorEmail: string;
    colaboradorNombre: string;
    creadoEn: string;        
}
