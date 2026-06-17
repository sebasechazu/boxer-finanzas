import { TestBed } from '@angular/core/testing';
import { PwaService } from './pwa.service';
import { SwUpdate } from '@angular/service-worker';
import { ToastController } from '@ionic/angular/standalone';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Subject } from 'rxjs';

describe('PwaService', () => {
  let service: PwaService;
  let mockSwUpdate: any;
  let mockToastController: any;
  let mockToast: any;
  let versionUpdatesSubject: Subject<any>;

  beforeEach(() => {
    versionUpdatesSubject = new Subject();
    mockSwUpdate = {
      isEnabled: true,
      versionUpdates: versionUpdatesSubject.asObservable()
    };

    mockToast = {
      present: vi.fn().mockResolvedValue(undefined)
    };

    mockToastController = {
      create: vi.fn().mockResolvedValue(mockToast)
    };

    TestBed.configureTestingModule({
      providers: [
        PwaService,
        { provide: SwUpdate, useValue: mockSwUpdate },
        { provide: ToastController, useValue: mockToastController }
      ]
    });

    service = TestBed.inject(PwaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create and show toast when VERSION_READY event is emitted', async () => {
    versionUpdatesSubject.next({ type: 'VERSION_READY' });

    // Permitir que se ejecuten las tareas asíncronas
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockToastController.create).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Nueva versión disponible. ¿Deseas actualizar?',
        position: 'bottom'
      })
    );
    expect(mockToast.present).toHaveBeenCalled();
  });

  it('should not show toast when event is not VERSION_READY', async () => {
    versionUpdatesSubject.next({ type: 'NO_NEW_VERSION' });

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockToastController.create).not.toHaveBeenCalled();
  });
});
