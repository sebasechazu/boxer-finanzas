import { TestBed } from '@angular/core/testing';
import { ArticleService } from './article.service';
import { AccountService } from './account.service';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Articulo } from '../models';

vi.mock('../../firebase.config', () => ({
    db: {}
}));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    onSnapshot: vi.fn(),
    addDoc: vi.fn().mockResolvedValue({ id: 'new-article-id' }),
    doc: vi.fn().mockReturnValue('mockDocRef'),
    deleteDoc: vi.fn().mockResolvedValue(undefined),
    updateDoc: vi.fn().mockResolvedValue(undefined)
}));

describe('ArticleService', () => {
    let service: ArticleService;
    let mockAccountService: any;

    beforeEach(() => {
        mockAccountService = {
            effectiveAccountUid: vi.fn().mockReturnValue('user123')
        };

        TestBed.configureTestingModule({
            providers: [
                ArticleService,
                { provide: AccountService, useValue: mockAccountService }
            ]
        });

        service = TestBed.inject(ArticleService);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('debe calcular los computed de precios correctamente', () => {
        const mockArticles: Articulo[] = [
            { id: '1', usuarioId: 'user123', nombre: 'A1', precioCompra: 100, precioVentaContado: 150 },
            { id: '2', usuarioId: 'user123', nombre: 'A2', precioCompra: 200, precioVentaContado: 320 }
        ];

        // Escribimos en el signal privado
        (service as any)._articulosSignal.set(mockArticles);

        expect(service.totalArticlePurchasePrice()).toBe(300);
        expect(service.totalArticleSalePrice()).toBe(470);
        expect(service.totalPotentialProfit()).toBe(170);
    });

    it('debe llamar a addDoc en addArticle', async () => {
        const { addDoc } = await import('firebase/firestore');

        const res = await service.addArticle({ nombre: 'Item', precioCompra: 50, precioVentaContado: 90 });

        expect(addDoc).toHaveBeenCalled();
        expect(res.id).toBe('new-article-id');
    });

    it('debe llamar a updateDoc en updateArticle', async () => {
        const { updateDoc } = await import('firebase/firestore');

        await service.updateArticle('art-1', { precioVentaContado: 120 });

        expect(updateDoc).toHaveBeenCalled();
    });

    it('debe llamar a deleteDoc en deleteArticle', async () => {
        const { deleteDoc } = await import('firebase/firestore');

        await service.deleteArticle('art-1');

        expect(deleteDoc).toHaveBeenCalled();
    });
});
