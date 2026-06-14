import { Injectable, inject, computed, signal, effect, OnDestroy } from '@angular/core';
import { collection, addDoc, getDocs, query, where, onSnapshot, DocumentData, QuerySnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from './auth.service';
import { AccountService } from './account.service';
import { Operacion, Cuota, Articulo, Cliente, PlanPrestamo, Prestamo, Venta } from '../models/models';
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
    private _planesPrestamoSignal = signal<PlanPrestamo[]>([]);
    private _prestamosSignal = signal<Prestamo[]>([]);
    private _ventasSignal = signal<Venta[]>([]);
    private _cuotasSignal = signal<Cuota[]>([]);

    // Suscripciones actuales (para desuscribir al cambiar de cuenta)
    private _unsubClientes?: () => void;
    private _unsubOperaciones?: () => void;
    private _unsubArticulos?: () => void;
    private _unsubPlanesPrestamo?: () => void;
    private _unsubPrestamos?: () => void;
    private _unsubVentas?: () => void;
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
                this._planesPrestamoSignal.set([]);
                this._prestamosSignal.set([]);
                this._ventasSignal.set([]);
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
        this._unsubPlanesPrestamo?.();
        this._unsubPrestamos?.();
        this._unsubVentas?.();
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

        const qPlanes = query(collection(db, 'planes_prestamo'), where('usuarioId', '==', uid));
        this._unsubPlanesPrestamo = onSnapshot(qPlanes, snap => {
            this._planesPrestamoSignal.set(snap.docs.map(d => ({ id: d.id, ...d.data() } as PlanPrestamo)));
        });

        const qPrestamos = query(collection(db, 'prestamos'), where('usuarioId', '==', uid));
        this._unsubPrestamos = onSnapshot(qPrestamos, snap => {
            this._prestamosSignal.set(snap.docs.map(d => ({ id: d.id, ...d.data() } as Prestamo)));
        });

        const qVentas = query(collection(db, 'ventas'), where('usuarioId', '==', uid));
        this._unsubVentas = onSnapshot(qVentas, snap => {
            this._ventasSignal.set(snap.docs.map(d => ({ id: d.id, ...d.data() } as Venta)));
        });

        const qCuotas = query(collection(db, 'cuotas'), where('usuarioId', '==', uid));
        this._unsubCuotas = onSnapshot(qCuotas, snap => {
            this._cuotasSignal.set(snap.docs.map(d => ({ id: d.id, ...d.data() } as Cuota)));
        });
    }

    // Señales públicas (readonly)
    readonly userClients = this._clientesSignal.asReadonly();
    readonly userOperations = this._operacionesSignal.asReadonly();
    readonly userArticles = this._articulosSignal.asReadonly();
    readonly userLoanPlans = this._planesPrestamoSignal.asReadonly();
    readonly userLoans = this._prestamosSignal.asReadonly();
    readonly userSales = this._ventasSignal.asReadonly();
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

    // ─── CRUD Planes de Préstamo ────────────────────────────────────────────────
    
    async addLoanPlan(plan: Omit<PlanPrestamo, 'id' | 'usuarioId'>) {
        const uid = this.activeUid;
        const newPlan = { ...plan, usuarioId: uid };
        return await addDoc(collection(db, 'planes_prestamo'), newPlan);
    }

    async updateLoanPlan(id: string, plan: Partial<PlanPrestamo>) {
        const docRef = doc(db, 'planes_prestamo', id);
        return await updateDoc(docRef, plan);
    }

    async deleteLoanPlan(id: string) {
        const docRef = doc(db, 'planes_prestamo', id);
        return await deleteDoc(docRef);
    }

    // ─── CRUD Operaciones ─────────────────────────────────────────────────────

    async addOperation(
        op: Omit<Operacion, 'id' | 'usuarioId' | 'ventaId' | 'prestamoId'> & {
            tieneVencimiento?: boolean;
            montoBase: number;
            porcentajeRecargo: number;
            articuloId?: string;
            prestamoId?: string; // ID del PlanPrestamo seleccionado
        }
    ) {
        const uid = this.activeUid;
        const totalFinal = this.calculateTotal(op.montoBase, op.porcentajeRecargo);

        let ventaId: string | undefined = undefined;
        let prestamoId: string | undefined = undefined;

        if (op.tipo === 'VENTA') {
            const ventaData = {
                usuarioId: uid,
                clienteId: op.clienteId,
                articuloId: op.articuloId || '',
                montoBase: op.montoBase,
                porcentajeRecargo: op.porcentajeRecargo,
                totalFinal,
                creadoEn: new Date().toISOString()
            };
            const ventaRef = await addDoc(collection(db, 'ventas'), ventaData);
            ventaId = ventaRef.id;
        } else {
            const prestamoData = {
                usuarioId: uid,
                clienteId: op.clienteId,
                planId: op.prestamoId || '',
                montoBase: op.montoBase,
                porcentajeRecargo: op.porcentajeRecargo,
                totalFinal,
                creadoEn: new Date().toISOString()
            };
            const prestamoRef = await addDoc(collection(db, 'prestamos'), prestamoData);
            prestamoId = prestamoRef.id;
        }

        const newOp = {
            usuarioId: uid,
            clienteId: op.clienteId,
            tipo: op.tipo,
            ventaId,
            prestamoId,
            cuotasCount: op.cuotasCount,
            periodicidad: op.periodicidad,
            diaSemana: op.diaSemana,
            diaVencimiento: op.diaVencimiento,
            fechaPrimerVencimiento: op.fechaPrimerVencimiento
        };

        const opRef = await addDoc(collection(db, 'operaciones'), newOp);

        const montoCuota = totalFinal / op.cuotasCount;
        const fechaBase = op.fechaPrimerVencimiento ? new Date(op.fechaPrimerVencimiento) : new Date();

        for (let i = 0; i < op.cuotasCount; i++) {
            let vencimientoISO: string | undefined = undefined;

            if (op.tieneVencimiento) {
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
        // 1. Buscar la operación localmente para saber las referencias transaccionales
        const op = this._operacionesSignal().find(o => o.id === id);
        if (op) {
            if (op.tipo === 'VENTA' && op.ventaId) {
                await deleteDoc(doc(db, 'ventas', op.ventaId));
            } else if (op.tipo === 'PRESTAMO' && op.prestamoId) {
                await deleteDoc(doc(db, 'prestamos', op.prestamoId));
            }
        }

        // 2. Borrar la operación
        await deleteDoc(doc(db, 'operaciones', id));
        
        // 3. Borrar cuotas asociadas
        const q = query(collection(db, 'cuotas'), where('operacionId', '==', id));
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'cuotas', d.id)));
        await Promise.all(deletePromises);
    }

    async updateOperation(
        id: string, 
        op: Partial<Operacion> & { 
            tieneVencimiento?: boolean;
            montoBase?: number;
            porcentajeRecargo?: number;
            articuloId?: string;
            prestamoId?: string; // ID del PlanPrestamo seleccionado
        }
    ) {
        const { tieneVencimiento, montoBase, porcentajeRecargo, articuloId, prestamoId, ...cleanOp } = op;
        const docRef = doc(db, 'operaciones', id);

        const currentOp = this._operacionesSignal().find(o => o.id === id);

        if (currentOp) {
            if (currentOp.tipo === 'VENTA' && currentOp.ventaId) {
                const updateData: any = {};
                if (montoBase !== undefined) updateData.montoBase = montoBase;
                if (porcentajeRecargo !== undefined) updateData.porcentajeRecargo = porcentajeRecargo;
                if (articuloId !== undefined) updateData.articuloId = articuloId;

                if (montoBase !== undefined || porcentajeRecargo !== undefined) {
                    const base = montoBase ?? 0;
                    const recargo = porcentajeRecargo ?? 0;
                    updateData.totalFinal = this.calculateTotal(base, recargo);
                }
                if (Object.keys(updateData).length > 0) {
                    await updateDoc(doc(db, 'ventas', currentOp.ventaId), updateData);
                }
            } else if (currentOp.tipo === 'PRESTAMO' && currentOp.prestamoId) {
                const updateData: any = {};
                if (montoBase !== undefined) updateData.montoBase = montoBase;
                if (porcentajeRecargo !== undefined) updateData.porcentajeRecargo = porcentajeRecargo;
                if (prestamoId !== undefined) updateData.planId = prestamoId;

                if (montoBase !== undefined || porcentajeRecargo !== undefined) {
                    const base = montoBase ?? 0;
                    const recargo = porcentajeRecargo ?? 0;
                    updateData.totalFinal = this.calculateTotal(base, recargo);
                }
                if (Object.keys(updateData).length > 0) {
                    await updateDoc(doc(db, 'prestamos', currentOp.prestamoId), updateData);
                }
            }
        }

        await updateDoc(docRef, cleanOp);
        return docRef;
    }
}
