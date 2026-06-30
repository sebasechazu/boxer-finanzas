import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InvoiceModalComponent } from './invoice-modal.component';
import { ClientService } from '../../../../core/services/client.service';
import { ArticleService } from '../../../../core/services/article.service';
import { OperationService } from '../../../../core/services/operation.service';
import { AuthService } from '../../../../core/services/auth.service';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  createClientServiceMock, 
  createArticleServiceMock, 
  createOperationServiceMock, 
  createAuthServiceMock 
} from '../../../../testing/mocks';
import { Operacion } from '../../../../core/models';

describe('InvoiceModalComponent', () => {
  let component: InvoiceModalComponent;
  let fixture: ComponentFixture<InvoiceModalComponent>;
  let mockClientService: any;
  let mockArticleService: any;
  let mockOperationService: any;
  let mockAuthService: any;

  beforeEach(async () => {
    mockClientService = createClientServiceMock();
    mockArticleService = createArticleServiceMock();
    mockOperationService = createOperationServiceMock();
    mockAuthService = createAuthServiceMock();

    await TestBed.configureTestingModule({
      imports: [InvoiceModalComponent],
      providers: [
        { provide: ClientService, useValue: mockClientService },
        { provide: ArticleService, useValue: mockArticleService },
        { provide: OperationService, useValue: mockOperationService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InvoiceModalComponent);
    component = fixture.componentInstance;
    
    // Set up mock data
    mockClientService.userClients.set([
      { id: 'c1', nombre: 'Ana', apellido: 'Pérez', dniCuit: '20-767-8', direccion: 'Merlo', ciudad: 'Buenos Aires' }
    ]);
    mockArticleService.userArticles.set([
      { id: 'art1', nombre: 'Notebook oasis 8 ram', precioVentaContado: 350000 }
    ]);
    mockOperationService.userSales.set([
      { id: 'v1', articuloId: 'art1', montoBase: 350000, porcentajeRecargo: 10, totalFinal: 385000 }
    ]);
    mockAuthService.profileSignal.set({
      nombre: 'Matias Gomez',
      nombreNegocio: 'Electronline'
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe formatear los números a formato AFIP (coma decimal, sin separador de miles)', () => {
    expect(component.formatNumber(350000)).toBe('350000,00');
    expect(component.formatNumber(125.45)).toBe('125,45');
    expect(component.formatNumber(null)).toBe('0,00');
    expect(component.formatNumber(undefined)).toBe('0,00');
  });

  it('debe formatear la fecha correctamente de YYYY-MM-DD a DD/MM/YYYY', () => {
    expect(component.getFormattedDate('2026-06-30')).toBe('30/06/2026');
    expect(component.getFormattedDate('')).toBe('');
    expect(component.getFormattedDate(null)).toBe('');
  });

  it('debe resolver CUIT o DNI según la longitud del identificador', () => {
    component.simForm.patchValue({ receptorCuitDni: '20345332449' });
    expect(component.getClientIdType()).toBe('CUIT');

    component.simForm.patchValue({ receptorCuitDni: '38263168' });
    expect(component.getClientIdType()).toBe('DNI');
  });

  it('debe cargar los datos de la venta y excluir los recargos financieros de la factura', () => {
    const op: Operacion = {
      id: 'op1',
      usuarioId: 'user123',
      clienteId: 'c1',
      tipo: 'VENTA',
      ventaId: 'v1',
      cuotasCount: 3
    };

    component.loadInvoiceData(op);

    // Form settings check
    expect(component.simForm.get('emisorFantasia')?.value).toBe('ELECTRONLINE');
    expect(component.simForm.get('receptorRazonSocial')?.value).toBe('PÉREZ ANA');
    
    // Items check: surcharges must be excluded, only the main item is present
    const items = component.invoiceItems();
    expect(items.length).toBe(1);
    expect(items[0].codigo).toBe('ART1');
    expect(items[0].descripcion).toBe('Notebook oasis 8 ram');
    expect(items[0].precioUnitario).toBe(350000);
    expect(items[0].subtotal).toBe(350000);

    // Totals check: surcharges set to 0 and total equal to cash price (montoBase)
    expect(component.totalBase()).toBe(350000);
    expect(component.totalSurcharges()).toBe(0);
    expect(component.totalFinal()).toBe(350000);
  });
});
