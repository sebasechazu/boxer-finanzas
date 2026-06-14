import { Injectable, inject, signal, computed, effect, OnDestroy } from '@angular/core';
import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc,
    query, where, onSnapshot, DocumentData, QuerySnapshot
} from 'firebase/firestore';
import { db } from '../../firebase.config';
import { AuthService } from './auth.service';
import {
    PerfilUsuario, Invitacion, Colaborador, CuentaAccesible
} from '../models/models';

@Injectable({
    providedIn: 'root'
})
export class AccountService implements OnDestroy {
    private authService = inject(AuthService);
    
    private _misColaboradores = signal<Colaborador[]>([]);
    private _cuentasAjenas = signal<Colaborador[]>([]);
    private _invitacionesRecibidas = signal<Invitacion[]>([]);
    private _invitacionesEnviadas = signal<Invitacion[]>([]);

    private _unsubColaboradores?: () => void;
    private _unsubAjenas?: () => void;
    private _unsubInvRecibidas?: () => void;
    private _unsubInvEnviadas?: () => void;

    readonly misColaboradores = this._misColaboradores.asReadonly();
    readonly cuentasAjenas = this._cuentasAjenas.asReadonly();
    readonly invitacionesPendientesRecibidas = this._invitacionesRecibidas.asReadonly();
    readonly invitacionesEnviadas = this._invitacionesEnviadas.asReadonly();

    readonly cuentasAccesibles = computed<CuentaAccesible[]>(() => {
        const user = this.authService.userSignal();
        const perfil = this.authService.profileSignal();
        if (!user) return [];

        const propia: CuentaAccesible = {
            propietarioUid: user.uid,
            propietarioNombre: user.displayName ?? user.email ?? 'Mi cuenta',
            propietarioNombreNegocio: perfil?.nombreNegocio ?? 'Mi negocio',
            esPropia: true
        };

        const ajenas: CuentaAccesible[] = this.cuentasAjenas().map(col => ({
            propietarioUid: col.propietarioUid,
            propietarioNombre: col.colaboradorNombre, // nombre del propietario (lo cargamos aparte)
            propietarioNombreNegocio: '',
            esPropia: false
        }));

        return [propia, ...ajenas];
    });

    readonly activeAccountUid = signal<string | null>(null);

    readonly effectiveAccountUid = computed(() => {
        return this.activeAccountUid() ?? this.authService.currentUserUid ?? null;
    });

    readonly cuentaActivaInfo = computed<CuentaAccesible | null>(() => {
        const uid = this.effectiveAccountUid();
        if (!uid) return null;
        return this.cuentasAccesibles().find(c => c.propietarioUid === uid) ?? null;
    });

    constructor() {
        effect(() => {
            const user = this.authService.userSignal();
            
            this._unsubColaboradores?.();
            this._unsubAjenas?.();
            this._unsubInvRecibidas?.();
            this._unsubInvEnviadas?.();

            if (!user) {
                this._misColaboradores.set([]);
                this._cuentasAjenas.set([]);
                this._invitacionesRecibidas.set([]);
                this._invitacionesEnviadas.set([]);
                this.activeAccountUid.set(null);
                return;
            }

            this.activeAccountUid.set(user.uid);

            const qMisColab = query(collection(db, 'colaboradores'), where('propietarioUid', '==', user.uid));
            this._unsubColaboradores = onSnapshot(qMisColab, snap => {
                this._misColaboradores.set(snap.docs.map(d => ({ id: d.id, ...d.data() } as Colaborador)));
            });

            const qAjenas = query(collection(db, 'colaboradores'), where('colaboradorUid', '==', user.uid));
            this._unsubAjenas = onSnapshot(qAjenas, snap => {
                this._cuentasAjenas.set(snap.docs.map(d => ({ id: d.id, ...d.data() } as Colaborador)));
            });

            if (user.email) {
                const qInvRec = query(collection(db, 'invitaciones'), where('emailInvitado', '==', user.email), where('estado', '==', 'PENDIENTE'));
                this._unsubInvRecibidas = onSnapshot(qInvRec, snap => {
                    this._invitacionesRecibidas.set(snap.docs.map(d => ({ id: d.id, ...d.data() } as Invitacion)));
                });
            }

            const qInvEnv = query(collection(db, 'invitaciones'), where('propietarioUid', '==', user.uid));
            this._unsubInvEnviadas = onSnapshot(qInvEnv, snap => {
                this._invitacionesEnviadas.set(snap.docs.map(d => ({ id: d.id, ...d.data() } as Invitacion)));
            });
        });

        effect(() => {
            const ajenas = this.cuentasAjenas();
            ajenas.forEach(col => this.cargarPerfilPropietario(col.propietarioUid));
        });
    }

    ngOnDestroy() {
        this._unsubColaboradores?.();
        this._unsubAjenas?.();
        this._unsubInvRecibidas?.();
        this._unsubInvEnviadas?.();
    }

    /** Cambia la cuenta que se está visualizando */
    switchAccount(propietarioUid: string) {
        this.activeAccountUid.set(propietarioUid);
    }

    private _perfilesPropietarios = signal<Map<string, PerfilUsuario>>(new Map());
    readonly perfilesPropietarios = this._perfilesPropietarios.asReadonly();

    private async cargarPerfilPropietario(uid: string) {
        if (this._perfilesPropietarios().has(uid)) return;
        const snap = await getDoc(doc(db, 'usuarios', uid));
        if (snap.exists()) {
            const perfil = snap.data() as PerfilUsuario;
            this._perfilesPropietarios.update(m => {
                const nuevo = new Map(m);
                nuevo.set(uid, perfil);
                return nuevo;
            });
        }
    }

    getNombreNegocioPropietario(uid: string): string {
        return this._perfilesPropietarios().get(uid)?.nombreNegocio
            ?? this._perfilesPropietarios().get(uid)?.nombre
            ?? 'Cuenta ajena';
    }

    getNombrePropietario(uid: string): string {
        return this._perfilesPropietarios().get(uid)?.nombre ?? uid;
    }

    async enviarInvitacion(emailInvitado: string): Promise<void> {
        const user = this.authService.userSignal();
        if (!user) throw new Error('No autenticado');
        const perfil = this.authService.profileSignal();

        const existing = this.invitacionesEnviadas().find(
            inv => inv.emailInvitado === emailInvitado && inv.estado === 'PENDIENTE'
        );
        if (existing) throw new Error('Ya existe una invitación pendiente para ese email');

        const yaColaborador = this.misColaboradores().find(
            col => col.colaboradorEmail === emailInvitado
        );
        if (yaColaborador) throw new Error('Ese usuario ya es colaborador de tu cuenta');

        if (emailInvitado === user.email) throw new Error('No puedes invitarte a ti mismo');

        const invitacion: Omit<Invitacion, 'id'> = {
            propietarioUid: user.uid,
            propietarioEmail: user.email ?? '',
            propietarioNombre: user.displayName ?? user.email ?? '',
            propietarioNombreNegocio: perfil?.nombreNegocio ?? 'Mi negocio',
            emailInvitado,
            estado: 'PENDIENTE',
            creadoEn: new Date().toISOString()
        };

        await addDoc(collection(db, 'invitaciones'), invitacion);
    }

    async aceptarInvitacion(invitacion: Invitacion): Promise<void> {
        const user = this.authService.userSignal();
        if (!user) throw new Error('No autenticado');

        const colaboradorId = `${invitacion.propietarioUid}_${user.uid}`;

        const colaborador: Omit<Colaborador, 'id'> = {
            propietarioUid: invitacion.propietarioUid,
            colaboradorUid: user.uid,
            colaboradorEmail: user.email ?? '',
            colaboradorNombre: user.displayName ?? user.email ?? '',
            creadoEn: new Date().toISOString()
        };

        await setDoc(doc(db, 'colaboradores', colaboradorId), colaborador);
        await updateDoc(doc(db, 'invitaciones', invitacion.id), { estado: 'ACEPTADA' });
        await this.cargarPerfilPropietario(invitacion.propietarioUid);
    }

    async rechazarInvitacion(invitacion: Invitacion): Promise<void> {
        await updateDoc(doc(db, 'invitaciones', invitacion.id), { estado: 'RECHAZADA' });
    }

    async eliminarColaborador(colaborador: Colaborador): Promise<void> {
        const { deleteDoc, doc: firestoreDoc } = await import('firebase/firestore');
        await deleteDoc(firestoreDoc(db, 'colaboradores', colaborador.id));
    }

    async actualizarNombreNegocio(nombreNegocio: string): Promise<void> {
        const user = this.authService.userSignal();
        if (!user) throw new Error('No autenticado');
        await updateDoc(doc(db, 'usuarios', user.uid), { nombreNegocio });
        const perfilActual = this.authService.profileSignal();
        if (perfilActual) {
            this.authService.profileSignal.set({ ...perfilActual, nombreNegocio });
        }
    }
}
