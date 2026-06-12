import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import {
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonDatetime, IonChip, IonIcon, IonLabel} from '@ionic/angular/standalone';
import { FinanceService } from '../../core/services/finance.service';
import { AuthService } from '../../core/services/auth.service';
import { AccountService } from '../../core/services/account.service';
import { CurrencyPipe } from '@angular/common';
import { addIcons } from 'ionicons';
import { swapHorizontalOutline, personOutline, businessOutline } from 'ionicons/icons';
import { CuentaAccesible } from '../../core/models/models';
import { DashboardCardsComponent } from './dashboard-cards/dashboard-cards.component';

@Component({
    selector: 'app-dashboard',
    templateUrl: 'dashboard.page.html',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonDatetime, IonChip, IonIcon, IonLabel,
    DashboardCardsComponent
],
})
export class DashboardPage {
    public financeService = inject(FinanceService);
    private authService = inject(AuthService);
    public accountService = inject(AccountService);

    constructor() {
        addIcons({ swapHorizontalOutline, personOutline, businessOutline });
    }

    readonly highlightedDates = computed(() => {
        return this.financeService.userInstalments()
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
