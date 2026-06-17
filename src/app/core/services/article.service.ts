import { Injectable, inject, signal, computed, effect, OnDestroy } from '@angular/core';
import { collection, addDoc, query, where, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { AccountService } from './account.service';
import { Articulo } from '../models';
import { db } from '../../firebase.config';

@Injectable({
    providedIn: 'root'
})
export class ArticleService implements OnDestroy {
    private accountService = inject(AccountService);

    private _articulosSignal = signal<Articulo[]>([]);
    private _unsubArticulos?: () => void;

    readonly userArticles = this._articulosSignal.asReadonly();

    readonly totalArticlePurchasePrice = computed(() => {
        return this._articulosSignal().reduce((sum, art) => sum + (art.precioCompra || 0), 0);
    });

    readonly totalArticleSalePrice = computed(() => {
        return this._articulosSignal().reduce((sum, art) => sum + (art.precioVentaContado || 0), 0);
    });

    readonly totalPotentialProfit = computed(() => {
        return this.totalArticleSalePrice() - this.totalArticlePurchasePrice();
    });

    constructor() {
        effect(() => {
            const uid = this.accountService.effectiveAccountUid();
            if (!uid) {
                this._unsubArticulos?.();
                this._articulosSignal.set([]);
                return;
            }
            this._suscribirDatos(uid);
        });
    }

    ngOnDestroy() {
        this._unsubArticulos?.();
    }

    private _suscribirDatos(uid: string) {
        this._unsubArticulos?.();
        const qArts = query(collection(db, 'articulos'), where('usuarioId', '==', uid));
        this._unsubArticulos = onSnapshot(qArts, snap => {
            this._articulosSignal.set(snap.docs.map(d => ({ id: d.id, ...d.data() } as Articulo)));
        });
    }

    private get activeUid(): string {
        const uid = this.accountService.effectiveAccountUid();
        if (!uid) throw new Error('No hay cuenta activa');
        return uid;
    }

    async addArticle(articulo: Omit<Articulo, 'id' | 'usuarioId'>) {
        const uid = this.activeUid;
        const newArticle = { ...articulo, usuarioId: uid };
        return await addDoc(collection(db, 'articulos'), newArticle);
    }

    // VULN-03 fix: solo permite actualizar campos editables.
    // Excluye explícitamente usuarioId para evitar cambio de ownership.
    async updateArticle(id: string, cambios: Pick<Articulo, 'nombre' | 'precioCompra' | 'precioVentaContado'>) {
        const docRef = doc(db, 'articulos', id);
        const { nombre, precioCompra, precioVentaContado } = cambios;
        return await updateDoc(docRef, { nombre, precioCompra, precioVentaContado });
    }

    async deleteArticle(id: string) {
        const docRef = doc(db, 'articulos', id);
        return await deleteDoc(docRef);
    }
}
