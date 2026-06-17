import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { PwaService } from './core/services/pwa.service';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

describe('AppComponent', () => {
  let mockPwaService: any;

  beforeEach(async () => {
    mockPwaService = {};

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: PwaService, useValue: mockPwaService }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
