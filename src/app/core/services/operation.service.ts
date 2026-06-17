import { Injectable, inject, signal, computed, effect, OnDestroy } from '@angular/core';
import { collection, addDoc, getDocs, query, where, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { AccountService } from './account.service';
import { Operacion, Cuota, Prestamo, Venta } from '../models';
import { db } from '../../firebase.config';

@Injectable({
    providedIn: 'root'
})
export class OperationService implements OnDestroy {
    private accountService = inject(AccountService);

    private _operacionesSignal = signal<Operacion[]>([]);
    private _prestamosSignal = signal<Prestamo[]>([]);
    private _ventasSignal = signal<Venta[]>([]);
    private _cuotasSignal = signal<Cuota[]>([]);

    private _unsubOperaciones?: () => void;
    private _unsubPrestamos?: () => void;
    private _unsubVentas?: () => void;
    private _unsubCuotas?: () => void;

    readonly userOperations = this._operacionesSignal.asReadonly();
    readonly userLoans = this._prestamosSignal.asReadonly();
    readonly userSales = this._ventasSignal.asReadonly();
    readonly userInstalments = this._cuotasSignal.asReadonly();

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

    constructor() {
        effect(() => {
            const uid = this.accountService.effectiveAccountUid();
            if (!uid) {
                this._limpiarSuscripciones();
                this._operacionesSignal.set([]);
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
        this._unsubOperaciones?.();
        this._unsubPrestamos?.();
        this._unsubVentas?.();
        this._unsubCuotas?.();
    }

    private _suscribirDatos(uid: string) {
        this._limpiarSuscripciones();

        const qOps = query(collection(db, 'operaciones'), where('usuarioId', '==', uid));
        this._unsubOperaciones = onSnapshot(qOps, snap => {
            this._operacionesSignal.set(snap.docs.map(d => ({ id: d.id, ...d.data() } as Operacion)));
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

        const newOpData = {
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
        
        const newOp = Object.fromEntries(Object.entries(newOpData).filter(([_, v]) => v !== undefined));

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
        const op = this._operacionesSignal().find(o => o.id === id);
        if (op) {
            if (op.tipo === 'VENTA' && op.ventaId) {
                await deleteDoc(doc(db, 'ventas', op.ventaId));
            } else if (op.tipo === 'PRESTAMO' && op.prestamoId) {
                await deleteDoc(doc(db, 'prestamos', op.prestamoId));
            }
        }

        await deleteDoc(doc(db, 'operaciones', id));

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
            prestamoId?: string;
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
