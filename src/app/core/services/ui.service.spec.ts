import { TestBed } from '@angular/core/testing';
import { UiService } from './ui.service';
import { AlertController, ToastController } from '@ionic/angular/standalone';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

describe('UiService', () => {
    let service: UiService;
    let mockAlertController: any;
    let mockToastController: any;
    let mockAlert: any;
    let mockToast: any;

    beforeEach(() => {
        mockAlert = {
            present: vi.fn().mockResolvedValue(undefined)
        };

        mockAlertController = {
            create: vi.fn().mockResolvedValue(mockAlert)
        };

        mockToast = {
            present: vi.fn().mockResolvedValue(undefined)
        };

        mockToastController = {
            create: vi.fn().mockResolvedValue(mockToast)
        };

        TestBed.configureTestingModule({
            providers: [
                UiService,
                { provide: AlertController, useValue: mockAlertController },
                { provide: ToastController, useValue: mockToastController }
            ]
        });

        service = TestBed.inject(UiService);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('debe llamar a alertController.create y present en showErrorAlert', async () => {
        await service.showErrorAlert('Mensaje de error', new Error('Detalle error'), 'Cabecera');

        expect(mockAlertController.create).toHaveBeenCalledWith({
            header: 'Cabecera',
            message: 'Detalle error',
            buttons: ['OK']
        });
        expect(mockAlert.present).toHaveBeenCalled();
    });

    it('debe llamar a alertController.create en showConfirmAlert y ejecutar el handler', async () => {
        const onConfirmSpy = vi.fn();
        await service.showConfirmAlert({
            header: 'Confirmar',
            message: '¿Estás seguro?',
            onConfirm: onConfirmSpy
        });

        expect(mockAlertController.create).toHaveBeenCalled();
        const args = mockAlertController.create.mock.calls[0][0];
        
        // Buscar el botón de confirmar y ejecutar su handler
        const confirmBtn = args.buttons.find((btn: any) => btn.text === 'Aceptar');
        expect(confirmBtn).toBeDefined();
        await confirmBtn.handler();

        expect(onConfirmSpy).toHaveBeenCalled();
    });

    it('debe llamar a toastController.create y present en showToast', async () => {
        await service.showToast('Notificacion', 3000, 'top');

        expect(mockToastController.create).toHaveBeenCalledWith({
            message: 'Notificacion',
            duration: 3000,
            position: 'top'
        });
        expect(mockToast.present).toHaveBeenCalled();
    });
});
