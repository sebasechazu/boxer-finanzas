import { Injectable, inject, signal, effect, OnDestroy } from '@angular/core';
import { collection, addDoc, getDocs, query, where, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { AccountService } from './account.service';
import { Cliente } from '../models';
import { db } from '../../firebase.config';

@Injectable({
    providedIn: 'root'
})
export class ClientService implements OnDestroy {
    
    private accountService = inject(AccountService);

    private _clientesSignal = signal<Cliente[]>([]);
    private _unsubClientes?: () => void;

    readonly userClients = this._clientesSignal.asReadonly();

    constructor() {
        effect(() => {
            const uid = this.accountService.effectiveAccountUid();
            if (!uid) {
                this._unsubClientes?.();
                this._clientesSignal.set([]);
                return;
            }
            this._suscribirDatos(uid);
        });
    }

    ngOnDestroy() {
        this._unsubClientes?.();
    }

    private _suscribirDatos(uid: string) {
        this._unsubClientes?.();
        const qClientes = query(collection(db, 'clientes'), where('usuarioId', '==', uid));
        this._unsubClientes = onSnapshot(qClientes, snap => {
            this._clientesSignal.set(snap.docs.map(d => ({ id: d.id, ...d.data() } as Cliente)));
        });
    }

    private get activeUid(): string {
        const uid = this.accountService.effectiveAccountUid();
        if (!uid) throw new Error('No hay cuenta activa');
        return uid;
    }

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
}
