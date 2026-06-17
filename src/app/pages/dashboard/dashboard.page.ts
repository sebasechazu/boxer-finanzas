import { Component, inject, computed, ChangeDetectionStrategy, signal } from '@angular/core';
import {
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonDatetime, IonChip, IonIcon, IonLabel, AlertController
} from '@ionic/angular/standalone';
import { OperationService } from '../../core/services/operation.service';
import { AuthService } from '../../core/services/auth.service';
import { AccountService } from '../../core/services/account.service';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { swapHorizontalOutline, personOutline, businessOutline } from 'ionicons/icons';
import { CuentaAccesible } from '../../core/models';
import { DashboardCardsComponent } from './dashboard-cards/dashboard-cards.component';
import { VencimientosModalComponent } from './vencimientos-modal/vencimientos-modal.component';

@Component({
    selector: 'app-dashboard',
    templateUrl: 'dashboard.page.html',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonDatetime, IonChip, IonIcon, IonLabel,
    DashboardCardsComponent, VencimientosModalComponent
],
})
export class DashboardPage {
    public operationService = inject(OperationService);
    private authService = inject(AuthService);
    public accountService = inject(AccountService);
    private router = inject(Router);
    private alertCtrl = inject(AlertController);

    private pendingNavigation = false;

    readonly selectedDate = signal<string | null>(null);
    readonly isModalOpen = signal<boolean>(false);

    readonly cuotasDelDia = computed(() => {
        const date = this.selectedDate();
        if (!date) return [];
        return this.operationService.userInstalments().filter(i => {
            if (!i.vencimiento) return false;
            const iDateStr = i.vencimiento.split('T')[0];
            return iDateStr === date;
        });
    });

    constructor() {
        addIcons({ swapHorizontalOutline, personOutline, businessOutline });
    }

    onDateChange(event: any) {
        const value = event.detail.value;
        if (!value) return;
        const dateStr = Array.isArray(value) ? value[0] : value;
        const selectedDateOnly = dateStr.split('T')[0];
        this.selectedDate.set(selectedDateOnly);
        this.isModalOpen.set(true);
    }

    closeModal() {
        this.isModalOpen.set(false);
        this.selectedDate.set(null);
    }

    onModalDismiss() {
        this.closeModal();
        if (this.pendingNavigation) {
            this.pendingNavigation = false;
            this.router.navigate(['/tabs/historial']);
        }
    }

    async payInstallment(cuotaId: string) {
        try {
            await this.operationService.payInstallment(cuotaId);
            const successAlert = await this.alertCtrl.create({
                header: 'Éxito',
                message: 'Pago registrado con éxito',
                buttons: ['OK']
            });
            await successAlert.present();
        } catch (error: any) {
            const errorAlert = await this.alertCtrl.create({
                header: 'Error',
                message: error.message || 'No se pudo registrar el pago',
                buttons: ['OK']
            });
            await errorAlert.present();
        }
    }

    goToOperations() {
        this.pendingNavigation = true;
        this.closeModal();
    }

    readonly highlightedDates = computed(() => {
        return this.operationService.userInstalments()
            .filter(i => i.estado === 'PENDIENTE' && i.vencimiento)
            .map(i => ({
                date: new Date(i.vencimiento!).toISOString().split('T')[0],
                textColor: 'white',
                backgroundColor: 'var(--ion-color-warning)'
            }));
    });

    /** Cuentas accesibles (propias + ajenas) — solo muestra el selector si hay más de una */
    readonly tieneMultiplesCuentas = computed(() => {
        return this.accountService.cuentasAccesibles().length > 1;
    });

    readonly cuentaActiva = computed(() => {
        return this.accountService.cuentaActivaInfo();
    });

    readonly nombreNegocioActivo = computed(() => {
        const info = this.cuentaActiva();
        if (!info) return 'Mi Negocio';
        if (info.esPropia) {
            return this.authService.profileSignal()?.nombreNegocio ?? 'Mi Negocio';
        }
        return this.accountService.getNombreNegocioPropietario(info.propietarioUid);
    });

    switchAccount(cuenta: CuentaAccesible) {
        this.accountService.switchAccount(cuenta.propietarioUid);
    }

    getNombreNegocio(uid: string): string {
        return this.accountService.getNombreNegocioPropietario(uid);
    }

    getNombrePropietario(uid: string): string {
        return this.accountService.getNombrePropietario(uid);
    }
}
