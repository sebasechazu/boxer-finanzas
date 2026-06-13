import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonIcon, IonBadge, IonNote, IonListHeader, IonItemSliding, IonItemOptions, IonItemOption, AlertController, ToastController, IonThumbnail, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonAccordion, IonCardSubtitle } from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth.service';
import { AccountService } from '../../core/services/account.service';
import { Invitacion, Colaborador } from '../../core/models/models';
import { addIcons } from 'ionicons';
import {
    logOutOutline, mailOutline, personAddOutline, trashOutline,
    checkmarkCircleOutline, closeCircleOutline, businessOutline,
    peopleOutline, personOutline, shieldCheckmarkOutline,
    cafeOutline, cafe
} from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from '../../components/avatar/avatar.component';

@Component({
    selector: 'app-profile',
    templateUrl: 'profile.page.html',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [ IonCardTitle, IonCardHeader, IonCard,
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
    IonLabel, IonButton, IonIcon, IonBadge, IonNote,
    IonListHeader, IonItemSliding, IonItemOptions, IonItemOption,
    CommonModule,
    IonThumbnail, IonCardContent]
})
export class ProfilePage {
    private authService = inject(AuthService);
    private accountService = inject(AccountService);
    private alertController = inject(AlertController);
    private toastController = inject(ToastController);

    readonly user = this.authService.userSignal;
    readonly perfil = this.authService.profileSignal;
    readonly misColaboradores = this.accountService.misColaboradores;
    readonly cuentasAjenas = this.accountService.cuentasAjenas;
    readonly invitacionesPendientes = this.accountService.invitacionesPendientesRecibidas;
    readonly invitacionesEnviadas = this.accountService.invitacionesEnviadas;

    readonly isLoading = signal(false);
    nombreNegocioEditado = '';
    constructor() {
        addIcons({
            logOutOutline, mailOutline, personAddOutline, trashOutline,
            checkmarkCircleOutline, closeCircleOutline, businessOutline,
            peopleOutline, personOutline, shieldCheckmarkOutline,
            cafeOutline, cafe
        });
    }

    // ─── Nombre del negocio ───────────────────────────────────────────────────

    async editarNombreNegocio() {
        const perfil = this.perfil();
        const alert = await this.alertController.create({
            header: 'Nombre del Negocio',
            inputs: [{
                name: 'nombreNegocio',
                type: 'text',
                value: perfil?.nombreNegocio ?? '',
                placeholder: 'Ej: Tienda de Ropa'
            }],
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                    text: 'Guardar',
                    handler: async (data) => {
                        if (!data.nombreNegocio?.trim()) return;
                        try {
                            await this.accountService.actualizarNombreNegocio(data.nombreNegocio.trim());
                            this.showToast('Nombre actualizado', 'success');
                        } catch (e: any) {
                            this.showToast(e.message || 'Error al actualizar', 'danger');
                        }
                    }
                }
            ]
        });
        await alert.present();
    }

    // ─── Invitar colaborador ──────────────────────────────────────────────────

    async invitarColaborador() {
        const alert = await this.alertController.create({
            header: 'Invitar Colaborador',
            subHeader: 'El usuario recibirá la invitación al iniciar sesión',
            inputs: [{
                name: 'email',
                type: 'email',
                placeholder: 'email@ejemplo.com'
            }],
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                    text: 'Enviar Invitación',
                    handler: async (data) => {
                        if (!data.email?.trim()) return;
                        this.isLoading.set(true);
                        try {
                            await this.accountService.enviarInvitacion(data.email.trim().toLowerCase());
                            this.showToast('Invitación enviada correctamente', 'success');
                        } catch (e: any) {
                            this.showToast(e.message || 'Error al enviar', 'danger');
                        } finally {
                            this.isLoading.set(false);
                        }
                    }
                }
            ]
        });
        await alert.present();
    }

    // ─── Aceptar / Rechazar invitación ────────────────────────────────────────

    async aceptarInvitacion(inv: Invitacion) {
        const confirm = await this.alertController.create({
            header: 'Aceptar Invitación',
            message: `¿Querés unirte a la cuenta de <strong>${inv.propietarioNombreNegocio}</strong> (${inv.propietarioEmail})?`,
            buttons: [
                { text: 'No', role: 'cancel' },
                {
                    text: 'Aceptar',
                    handler: async () => {
                        try {
                            await this.accountService.aceptarInvitacion(inv);
                            this.showToast(`Ahora tenés acceso a la cuenta de ${inv.propietarioNombreNegocio}`, 'success');
                        } catch (e: any) {
                            this.showToast(e.message || 'Error al aceptar', 'danger');
                        }
                    }
                }
            ]
        });
        await confirm.present();
    }

    async rechazarInvitacion(inv: Invitacion) {
        try {
            await this.accountService.rechazarInvitacion(inv);
            this.showToast('Invitación rechazada', 'medium');
        } catch (e: any) {
            this.showToast(e.message || 'Error', 'danger');
        }
    }

    // ─── Eliminar colaborador ─────────────────────────────────────────────────

    async eliminarColaborador(col: Colaborador) {
        const confirm = await this.alertController.create({
            header: 'Eliminar Colaborador',
            message: `¿Eliminás a <strong>${col.colaboradorNombre}</strong> de tu cuenta?`,
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                    text: 'Eliminar',
                    role: 'destructive',
                    handler: async () => {
                        try {
                            await this.accountService.eliminarColaborador(col);
                            this.showToast('Colaborador eliminado', 'medium');
                        } catch (e: any) {
                            this.showToast(e.message || 'Error al eliminar', 'danger');
                        }
                    }
                }
            ]
        });
        await confirm.present();
    }

    // ─── Nombre del propietario para cuentas ajenas ───────────────────────────

    getNombreNegocio(propietarioUid: string): string {
        return this.accountService.getNombreNegocioPropietario(propietarioUid);
    }

    getNombrePropietario(propietarioUid: string): string {
        return this.accountService.getNombrePropietario(propietarioUid);
    }

    // ─── Logout ───────────────────────────────────────────────────────────────

    async logout() {
        const confirm = await this.alertController.create({
            header: 'Cerrar Sesión',
            message: '¿Estás seguro de que querés cerrar sesión?',
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                    text: 'Cerrar Sesión',
                    role: 'destructive',
                    handler: () => this.authService.logout()
                }
            ]
        });
        await confirm.present();
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private async showToast(message: string, color: string) {
        const toast = await this.toastController.create({
            message,
            duration: 3000,
            color,
            position: 'top'
        });
        await toast.present();
    }

    // Estado de invitación legible
    estadoLabel(estado: string): string {
        const map: Record<string, string> = {
            PENDIENTE: 'Pendiente',
            ACEPTADA: 'Aceptada',
            RECHAZADA: 'Rechazada'
        };
        return map[estado] ?? estado;
    }

    estadoColor(estado: string): string {
        const map: Record<string, string> = {
            PENDIENTE: 'warning',
            ACEPTADA: 'success',
            RECHAZADA: 'medium'
        };
        return map[estado] ?? 'medium';
    }
}
