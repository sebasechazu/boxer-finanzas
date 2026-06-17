import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardCardsComponent } from './dashboard-cards.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('DashboardCardsComponent', () => {
    let component: DashboardCardsComponent;
    let fixture: ComponentFixture<DashboardCardsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DashboardCardsComponent]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DashboardCardsComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('totalPaid', 1000);
        fixture.componentRef.setInput('moneyOnTheStreet', 5000);
        fixture.componentRef.setInput('collectedToday', 200);
        fixture.componentRef.setInput('pendingCollectionsToday', 300);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
