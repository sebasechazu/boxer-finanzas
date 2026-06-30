import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationBellComponent } from './notification-bell.component';
import { NotificationService } from '../../../core/services/notification.service';
import { Router } from '@angular/router';
import { signal, computed, WritableSignal } from '@angular/core';

describe('NotificationBellComponent', () => {
  let component: NotificationBellComponent;
  let fixture: ComponentFixture<NotificationBellComponent>;
  let mockNotificationService: any;
  let mockRouter: any;

  beforeEach(async () => {
    // Create a mock for NotificationService using Signals
    const cantidadVencimientosHoySignal = signal(0);
    const tieneVencimientosHoySignal = computed(() => cantidadVencimientosHoySignal() > 0);

    mockNotificationService = {
      cantidadVencimientosHoy: cantidadVencimientosHoySignal,
      tieneVencimientosHoy: tieneVencimientosHoySignal,
      // Helper for testing
      setCantidad: (num: number) => cantidadVencimientosHoySignal.set(num)
    };

    mockRouter = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [NotificationBellComponent],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationBellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not display badge when there are no expirations', () => {
    mockNotificationService.setCantidad(0);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const badge = compiled.querySelector('ion-badge');
    expect(badge).toBeNull();
  });

  it('should display badge with correct count when there are expirations', () => {
    mockNotificationService.setCantidad(3);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const badge = compiled.querySelector('ion-badge');
    expect(badge).not.toBeNull();
    expect(badge?.textContent?.trim()).toBe('3');
  });

  it('should navigate to dashboard on click', () => {
    component.onClick();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/tabs/dashboard']);
  });
});
