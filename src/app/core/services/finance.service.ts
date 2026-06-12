import { Injectable, inject, computed, signal, effect, OnDestroy } from '@angular/core';
import { collection, addDoc, getDocs, query, where, onSnapshot, DocumentData, QuerySnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from './auth.service';
import { AccountService } from './account.service';
import { Operacion, Cuota, Articulo, Cliente } from '../models/models';
import { db } from '../../firebase.config';

@Injectable({
    providedIn: 'root'
})
export class FinanceService implements OnDestroy {
    private authService = inject(AuthService);
    private accountService = inject(AccountService);

    private _clientesSignal = signal<Cliente[]>([]);
    private _operacionesSignal = signal<Operacion[]>([]);
    private _articulosSignal = signal<Articulo[]>([]);
    private _cuotasSignal = signal<Cuota[]>([]);

    // Suscripciones actuales (para desuscribir al cambiar de cuenta)
    private _unsubClientes?: () => void;
    private _unsubOperaciones?: () => void;
    private _unsubArticulos?: () => void;
    private _unsubCuotas?: () => void;

    constructor() {
        // Reaccionar al cambio de cuenta activa y al login/logout
        effect(() => {
            const uid = this.accountService.effectiveAccountUid();
            if (!uid) {
                this._limpiarSuscripciones();
                this._clientesSignal.set([]);
                this._operacionesSignal.set([]);
                this._articulosSignal.set([]);
                this._cuotasSignal.set([]);
                return;
            }
            this._suscribirDatos(uid);
        });
    }

    ngOnDestroy() {
        this._limpiarSuscripciones();
    }

    private _limpiarSuscripciones() {
        this._unsubClientes?.();
        this._unsubOperaciones?.();
        this._unsubArticulos?.();
        this._unsubCuotas?.();
    }

    private _suscribirDatos(uid: string) {
        this._limpiarSuscripciones();

        const qClientes = query(collection(db, 'clientes'), where('usuarioId', '==', uid));
        this._unsubClientes = onSnapshot(qClientes, snap => {
            this._clientesSignal.set(snap.docs.map(d => ({ id: d.id, ...d.data() } as Cliente)));
        });

        const qOps = query(collection(db, 'operaciones'), where('usuarioId', '==', uid));
        this._unsubOperaciones = onSnapshot(qOps, snap => {
            this._operacionesSignal.set(snap.docs.map(d => ({ id: d.id, ...d.data() } as Operacion)));
        });

        const qArts = query(collection(db, 'articulos'), where('usuarioId', '==', uid));
        this._unsubArticulos = onSnapshot(qArts, snap => {
            this._articulosSignal.set(snap.docs.map(d => ({ id: d.id, ...d.data() } as Articulo)));
        });

        const qCuotas = collection(db, 'cuotas');
        this._unsubCuotas = onSnapshot(qCuotas, snap => {
            this._cuotasSignal.set(snap.docs.map(d => ({ id: d.id, ...d.data() } as Cuota)));
        });
    }

    // Señales públicas (readonly)
    readonly userClients = this._clientesSignal.asReadonly();
    readonly userOperations = this._operacionesSignal.asReadonly();
    readonly userArticles = this._articulosSignal.asReadonly();
    readonly userInstalments = this._cuotasSignal.asReadonly();

    // ─── Computed ─────────────────────────────────────────────────────────────

    readonly totalPaid = computed(() => {
        const opIds = new Set(this.userOperations().map(op => op.id));
        return this.userInstalments()
            .filter(i => opIds.has(i.operacionId) && i.estado === 'PAGADA')
            .reduce((sum, i) => sum + i.monto, 0);
    });

    readonly moneyOnTheStreet = computed(() => {
        const opIds = new Set(this.userOperations().map(op => op.id));
        return this.userInstalments()
            .filter(i => opIds.has(i.operacionId) && (i.estado === 'PENDIENTE' || i.estado === 'VENCIDA'))
            .reduce((sum, i) => sum + i.monto, 0);
    });

    readonly collectedToday = computed(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        const opIds = new Set(this.userOperations().map(op => op.id));
        return this.userInstalments()
            .filter(i => opIds.has(i.operacionId) && 
                i.estado === 'PAGADA' && i.fechaPago &&
                new Date(i.fechaPago).getTime() >= startOfToday)
            .reduce((sum, i) => sum + i.monto, 0);
    });

    readonly pendingCollectionsToday = computed(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        const opIds = new Set(this.userOperations().map(op => op.id));
        return this.userInstalments()
            .filter(i => opIds.has(i.operacionId) &&
                i.estado === 'PENDIENTE' && 
                (!i.vencimiento || new Date(i.vencimiento).getTime() <= startOfToday))
            .reduce((sum, i) => sum + i.monto, 0);
    });

    readonly totalArticlePurchasePrice = computed(() => {
        return this.userArticles().reduce((sum, art) => sum + (art.precioCompra || 0), 0);
    });

    readonly totalArticleSalePrice = computed(() => {
        return this.userArticles().reduce((sum, art) => sum + (art.precioVentaContado || 0), 0);
    });

    readonly totalPotentialProfit = computed(() => {
        return this.totalArticleSalePrice() - this.totalArticlePurchasePrice();
    });

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /** UID de la cuenta activa (propietario). Usado en escrituras. */
    private get activeUid(): string {
        const uid = this.accountService.effectiveAccountUid();
        if (!uid) throw new Error('No hay cuenta activa');
        return uid;
    }

    // Cálculo automático con recargo/interés con precisión de 2 decimales
    calculateTotal(montoBase: number, porcentajeRecargo: number): number {
        const base = Number(montoBase);
        const recargo = base * (Number(porcentajeRecargo) / 100);
        return Math.round((base + recargo) * 100) / 100;
    }

    // ─── CRUD Clientes ────────────────────────────────────────────────────────

    async addClient(cliente: Omit<Cliente, 'id' | 'usuarioId' | 'saldoPendiente'>) {
        console.log('Iniciando guardado de cliente...', cliente);
        const uid = this.activeUid;

        try {
            const q = query(
                collection(db, 'clientes'),
                where('usuarioId', '==', uid),
                where('nombre', '==', cliente.nombre),
                where('telefono', '==', cliente.telefono)
            );

            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                throw new Error('Ya existe un cliente con este nombre y teléfono');
            }

            const newClient = {
                ...cliente,
                usuarioId: uid,
                saldoPendiente: 0
            };

            const docRef = await addDoc(collection(db, 'clientes'), newClient);
            console.log('Cliente guardado con ID:', docRef.id);
            return docRef;
        } catch (error) {
            console.error('Error detallado en addClient:', error);
            throw error;
        }
    }

    async updateClient(id: string, cliente: Partial<Cliente>) {
        const docRef = doc(db, 'clientes', id);
        return await updateDoc(docRef, cliente);
    }

    async deleteClient(id: string) {
        const docRef = doc(db, 'clientes', id);
        return await deleteDoc(docRef);
    }

    // ─── CRUD Artículos ───────────────────────────────────────────────────────

    async addArticle(articulo: Omit<Articulo, 'id' | 'usuarioId'>) {
        const uid = this.activeUid;
        const newArticle = { ...articulo, usuarioId: uid };
        return await addDoc(collection(db, 'articulos'), newArticle);
    }

    async updateArticle(id: string, articulo: Partial<Articulo>) {
        const docRef = doc(db, 'articulos', id);
        return await updateDoc(docRef, articulo);
    }

    async deleteArticle(id: string) {
        const docRef = doc(db, 'articulos', id);
        return await deleteDoc(docRef);
    }

    // ─── CRUD Operaciones ─────────────────────────────────────────────────────

    async addOperation(op: Omit<Operacion, 'id' | 'usuarioId' | 'totalFinal'> & { tieneVencimiento?: boolean }) {
        const uid = this.activeUid;

        const totalFinal = this.calculateTotal(op.montoBase, op.porcentajeRecargo);

        const { tieneVencimiento, ...cleanOp } = op;

        const newOp = {
            ...cleanOp,
            usuarioId: uid,
            totalFinal
        };
        const opRef = await addDoc(collection(db, 'operaciones'), newOp);

        const montoCuota = totalFinal / op.cuotasCount;
        
        // Fecha base del primer vencimiento (hoy por defecto si no viene informada)
        const fechaBase = op.fechaPrimerVencimiento ? new Date(op.fechaPrimerVencimiento) : new Date();

        for (let i = 0; i < op.cuotasCount; i++) {
            let vencimientoISO: string | undefined = undefined;

            if (tieneVencimiento) {
                const vencimiento = new Date(fechaBase);

                if (op.periodicidad === 'SEMANAL') {
                    if (i === 0 && op.diaSemana !== undefined) {
                        const diff = (op.diaSemana + 7 - vencimiento.getDay()) % 7;
                        vencimiento.setDate(vencimiento.getDate() + diff);
                        fechaBase.setTime(vencimiento.getTime());
                    }
                    vencimiento.setDate(fechaBase.getDate() + (i * 7));
                } 
                else if (op.periodicidad === 'QUINCENAL') {
                    if (i === 0 && op.diaSemana !== undefined) {
                        const diff = (op.diaSemana + 7 - vencimiento.getDay()) % 7;
                        vencimiento.setDate(vencimiento.getDate() + diff);
                        fechaBase.setTime(vencimiento.getTime());
                    }
                    vencimiento.setDate(fechaBase.getDate() + (i * 14));
                } 
                else { // MENSUAL por defecto
                    if (i === 0 && op.diaVencimiento !== undefined) {
                        vencimiento.setDate(op.diaVencimiento);
                        fechaBase.setTime(vencimiento.getTime());
                    }
                    vencimiento.setMonth(fechaBase.getMonth() + i);
                    if (op.diaVencimiento) {
                        vencimiento.setDate(op.diaVencimiento);
                    }
                }
                
                vencimientoISO = vencimiento.toISOString();
            }

            const cuotaData: any = {
                operacionId: opRef.id,
                usuarioId: uid,
                monto: montoCuota,
                estado: 'PENDIENTE'
            };

            if (vencimientoISO) {
                cuotaData.vencimiento = vencimientoISO;
            }

            await addDoc(collection(db, 'cuotas'), cuotaData);
        }

        return opRef;
    }

    async payInstallment(cuotaId: string) {
        const docRef = doc(db, 'cuotas', cuotaId);
        return await updateDoc(docRef, {
            estado: 'PAGADA',
            fechaPago: new Date().toISOString()
        });
    }

    async deleteOperation(id: string) {
        // 1. Borrar la operación
        await deleteDoc(doc(db, 'operaciones', id));
        
        // 2. Borrar cuotas asociadas
        const q = query(collection(db, 'cuotas'), where('operacionId', '==', id));
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'cuotas', d.id)));
        await Promise.all(deletePromises);
    }

    async updateOperation(id: string, op: Partial<Operacion> & { tieneVencimiento?: boolean }) {
        const { tieneVencimiento, ...cleanOp } = op;
        
        const docRef = doc(db, 'operaciones', id);
        
        if (cleanOp.montoBase !== undefined || cleanOp.porcentajeRecargo !== undefined) {
            const finalMontoBase = cleanOp.montoBase ?? 0;
            const finalPorcentajeRecargo = cleanOp.porcentajeRecargo ?? 0;
            cleanOp.totalFinal = this.calculateTotal(finalMontoBase, finalPorcentajeRecargo);
        }

        await updateDoc(docRef, cleanOp);
        
        return docRef;
    }
}
