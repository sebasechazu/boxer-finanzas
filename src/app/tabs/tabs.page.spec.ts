import { TestBed } from '@angular/core/testing';
import { TabsPage } from './tabs.page';
import { describe, it, expect, beforeEach } from 'vitest';

describe('TabsPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabsPage]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TabsPage);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
