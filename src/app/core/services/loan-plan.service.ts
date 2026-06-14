import { Injectable, inject, signal, effect, OnDestroy } from '@angular/core';
import { collection, addDoc, query, where, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { AccountService } from './account.service';
import { PlanPrestamo } from '../models';
import { db } from '../../firebase.config';

@Injectable({
    providedIn: 'root'
})
export class LoanPlanService implements OnDestroy {
    private accountService = inject(AccountService);

    private _planesPrestamoSignal = signal<PlanPrestamo[]>([]);
    private _unsubPlanesPrestamo?: () => void;

    readonly userLoanPlans = this._planesPrestamoSignal.asReadonly();

    constructor() {
        effect(() => {
            const uid = this.accountService.effectiveAccountUid();
            if (!uid) {
                this._unsubPlanesPrestamo?.();
                this._planesPrestamoSignal.set([]);
                return;
            }
            this._suscribirDatos(uid);
        });
    }

    ngOnDestroy() {
        this._unsubPlanesPrestamo?.();
    }

    private _suscribirDatos(uid: string) {
        this._unsubPlanesPrestamo?.();
        const qPlanes = query(collection(db, 'planes_prestamo'), where('usuarioId', '==', uid));
        this._unsubPlanesPrestamo = onSnapshot(qPlanes, snap => {
            this._planesPrestamoSignal.set(snap.docs.map(d => ({ id: d.id, ...d.data() } as PlanPrestamo)));
        });
    }

    private get activeUid(): string {
        const uid = this.accountService.effectiveAccountUid();
        if (!uid) throw new Error('No hay cuenta activa');
        return uid;
    }

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
}
