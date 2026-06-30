import { Component, ChangeDetectionStrategy, OnChanges, SimpleChanges, inject, input, output, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonIcon,
  IonSegment, IonSegmentButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, printOutline, downloadOutline } from 'ionicons/icons';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Operacion, Cliente, Articulo, Venta, Prestamo } from '../../../../core/models';
import { ClientService } from '../../../../core/services/client.service';
import { ArticleService } from '../../../../core/services/article.service';
import { OperationService } from '../../../../core/services/operation.service';
import { AuthService } from '../../../../core/services/auth.service';

export interface InvoiceItem {
  codigo: string;
  descripcion: string;
  cantidad: number;
  unidadMedida: string;
  precioUnitario: number;
  bonificacionPorc: number;
  bonificacionImp: number;
  subtotal: number;
}

@Component({
  selector: 'app-invoice-modal',
  templateUrl: './invoice-modal.component.html',
  styleUrls: ['./invoice-modal.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonIcon,
    IonSegment, IonSegmentButton
  ]
})
export class InvoiceModalComponent implements OnChanges, OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  public clientService = inject(ClientService);
  public articleService = inject(ArticleService);
  public operationService = inject(OperationService);
  public authService = inject(AuthService);

  readonly isOpen = input(false);
  readonly operation = input<Operacion | null>(null);
  readonly dismiss = output<void>();

  // Dynamic state for calculations
  invoiceItems = signal<InvoiceItem[]>([]);
  totalBase = signal<number>(0);
  totalSurcharges = signal<number>(0);
  totalFinal = signal<number>(0);
  qrCodeUrl = signal<string>('');

  // Mobile & layout scaling adaptation
  activeMobileTab = signal<'editor' | 'preview'>('preview');
  invoiceScale = signal<number>(1);

  // Form for customizable/simulated fields
  simForm = this.fb.nonNullable.group({
    // Emisor (Seller)
    emisorFantasia: ['ELECTRONLINE', Validators.required],
    emisorRazonSocial: ['', Validators.required],
    emisorDomicilio: ['25 De Mayo 512 - Merlo, Buenos Aires', Validators.required],
    emisorIva: ['Responsable Monotributo', Validators.required],
    emisorCuit: ['20345332449', Validators.required],
    emisorIngresosBrutos: ['80000', Validators.required],
    emisorInicioActividades: ['01/12/2017', Validators.required],
    
    // Comprobante
    puntoVenta: ['00003', Validators.required],
    compNro: ['00000104', Validators.required],
    fechaEmision: ['', Validators.required],
    
    // Receptor (Client)
    receptorCuitDni: ['38263168', Validators.required],
    receptorRazonSocial: ['', Validators.required],
    receptorIva: ['Consumidor Final', Validators.required],
    receptorDomicilio: ['', Validators.required],
    receptorCondicionVenta: ['Contado', Validators.required],

    // CAE
    caeNro: ['86030757854814', Validators.required],
    caeVencimiento: ['', Validators.required]
  });

  constructor() {
    addIcons({ closeOutline, printOutline, downloadOutline });
  }

  ngOnInit() {
    this.calculateScale();
    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.onResize);
  }

  private onResize = () => {
    this.calculateScale();
  };

  calculateScale() {
    const width = window.innerWidth;
    if (width < 768) {
      // Mobile viewport: preview wrapper takes full screen minus padding
      const availableWidth = width - 32; // 16px padding on each side
      const scale = availableWidth / 800;
      this.invoiceScale.set(scale);
    } else {
      // Desktop: window width minus 380px editor column and margin padding
      const availableWidth = width - 380 - 60;
      const scale = Math.min(1, availableWidth / 800);
      this.invoiceScale.set(scale);
    }
  }

  getScaledHeight(): string {
    const scale = this.invoiceScale();
    if (scale >= 1) return 'auto';
    // Standard A4 aspect ratio height scaled accordingly (800w -> 1130h)
    return (1130 * scale) + 'px';
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen() && this.operation()) {
      this.loadInvoiceData(this.operation()!);
      // Allow DOM layout to complete before scaling
      setTimeout(() => this.calculateScale(), 100);
    }
  }

  loadInvoiceData(op: Operacion) {
    // 1. Fetch related data
    const client = this.clientService.userClients().find(c => c.id === op.clienteId);
    const profile = this.authService.profileSignal();

    let montoBase = 0;
    let porcentajeRecargo = 0;
    let totalFinalValue = 0;
    let itemDescription = 'Producto / Servicio';
    let itemCodigo = '';

    if (op.tipo === 'VENTA' && op.ventaId) {
      const venta = this.operationService.userSales().find(v => v.id === op.ventaId);
      if (venta) {
        montoBase = venta.montoBase;
        porcentajeRecargo = venta.porcentajeRecargo;
        totalFinalValue = venta.totalFinal;
        
        // Find article name
        const article = this.articleService.userArticles().find(a => a.id === venta.articuloId);
        itemDescription = article ? article.nombre : 'Venta de Artículos Varios';
        itemCodigo = article ? article.id.substring(0, 6).toUpperCase() : 'V001';
      }
    } else if (op.tipo === 'PRESTAMO' && op.prestamoId) {
      const prestamo = this.operationService.userLoans().find(p => p.id === op.prestamoId);
      if (prestamo) {
        montoBase = prestamo.montoBase;
        porcentajeRecargo = prestamo.porcentajeRecargo;
        totalFinalValue = prestamo.totalFinal;
        itemDescription = `Otorgamiento de Préstamo Personal (${op.cuotasCount} cuotas)`;
        itemCodigo = 'P001';
      }
    }

    // Determine created date (defaults to today if missing)
    const opDateStr = (op as any).creadoEn || new Date().toISOString();
    const opDate = new Date(opDateStr);
    
    // Formatting date as YYYY-MM-DD for the date input
    const formattedDate = opDate.toISOString().substring(0, 10);
    
    // CAE Due date: 10 days after emission
    const caeDueDate = new Date(opDate.getTime() + 10 * 24 * 60 * 60 * 1000);
    const formattedCaeDueDate = caeDueDate.toISOString().substring(0, 10);

    // 2. Build Invoice Items
    const items: InvoiceItem[] = [];

    // Add main item
    items.push({
      codigo: itemCodigo,
      descripcion: itemDescription,
      cantidad: 1.0,
      unidadMedida: 'unidades',
      precioUnitario: montoBase,
      bonificacionPorc: 0,
      bonificacionImp: 0,
      subtotal: montoBase
    });

    this.invoiceItems.set(items);
    this.totalBase.set(montoBase);
    this.totalSurcharges.set(0);
    this.totalFinal.set(montoBase);

    // 3. Pre-populate Form Fields
    const emisorName = profile?.nombre || 'Negocio';
    const emisorFant = profile?.nombreNegocio || 'ELECTRONLINE';
    const clientName = client ? `${client.apellido || ''} ${client.nombre || ''}`.trim() : 'Consumidor Final';
    const clientAddress = client ? `${client.direccion || ''} ${client.ciudad || ''}`.trim() : 'Monseñor de Andrea 417';

    // Generates a mock but sequential Invoice Number
    const rawNumber = op.id ? parseInt(op.id.replace(/\D/g, '').substring(0, 8)) || 104 : 104;
    const formattedCompNro = String(rawNumber).padStart(8, '0');

    // Generate mock CAE
    const mockCae = op.id ? '86' + String(parseInt(op.id.replace(/\D/g, '')) || 86030757854814).substring(0, 12).padEnd(12, '0') : '86030757854814';

    this.simForm.patchValue({
      emisorFantasia: emisorFant.toUpperCase(),
      emisorRazonSocial: emisorName.toUpperCase(),
      emisorIva: 'Responsable Monotributo',
      emisorCuit: '20-34533244-9',
      emisorIngresosBrutos: '80000',
      emisorInicioActividades: '01/12/2017',
      puntoVenta: '00003',
      compNro: formattedCompNro,
      fechaEmision: formattedDate,
      receptorCuitDni: client ? '20-' + String(parseInt(client.id.replace(/\D/g, '')) || 38263168).substring(0, 8) + '-8' : '38263168',
      receptorRazonSocial: clientName.toUpperCase(),
      receptorIva: 'Consumidor Final',
      receptorDomicilio: clientAddress.toUpperCase() || 'DOMICILIO DESCONOCIDO',
      receptorCondicionVenta: op.tipo === 'VENTA' ? 'Contado' : 'Cuenta Corriente',
      caeNro: mockCae,
      caeVencimiento: formattedCaeDueDate
    });

    this.updateQrCode();
  }

  updateQrCode() {
    const values = this.simForm.getRawValue();
    // AFIP format QR code payload structure
    const qrData = {
      ver: 1,
      fecha: values.fechaEmision,
      cuit: parseInt(values.emisorCuit.replace(/\D/g, '')) || 20345332449,
      ptoVta: parseInt(values.puntoVenta) || 3,
      tipoCodAut: 'E',
      codAut: parseInt(values.caeNro) || 86030757854814,
      tipoComp: 11, // Comp. C
      nroComp: parseInt(values.compNro) || 104,
      importe: this.totalFinal(),
      moneda: 'PES',
      cotiz: 1
    };

    const base64Payload = btoa(JSON.stringify(qrData));
    const targetUrl = `https://www.afip.gob.ar/fe/qr/?p=${base64Payload}`;
    
    // We use qrserver to render the QR code cleanly in the DOM
    this.qrCodeUrl.set(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(targetUrl)}`);
  }

  onFormChange() {
    this.updateQrCode();
  }

  printInvoice() {
    const printContent = document.getElementById('invoiceFrame')?.innerHTML;
    if (!printContent) return;

    // Collect all stylesheets from the document, resolving relative URLs to absolute
    const printStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => {
        if (el.tagName.toLowerCase() === 'link') {
          const linkEl = el as HTMLLinkElement;
          return `<link rel="stylesheet" href="${linkEl.href}">`;
        }
        return el.outerHTML;
      })
      .join('\n');

    // Use a hidden iframe to print cleanly without opening tabs
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(`
        <html>
          <head>
            <title>Comprobante de Pago</title>
            ${printStyles}
            <style>
              @page {
                margin: 0;
              }
              body { 
                margin: 0 !important; 
                padding: 1.2cm !important; 
                box-sizing: border-box !important;
                background: white; 
                font-family: 'Arial', 'Helvetica', sans-serif;
              }
              * {
                box-sizing: border-box !important;
              }
              .invoice-box { 
                border: none !important; 
                margin: 0 !important; 
                padding: 0 !important; 
                width: 100% !important; 
                max-width: 100% !important; 
                min-width: 0 !important;
                transform: none !important;
                height: auto !important;
              }
              .spacer-row td { 
                height: 380px !important; 
              }
              /* Force borders and colors in all print engines */
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            </style>
          </head>
          <body>
            <div class="invoice-box">
              ${printContent}
            </div>
            <script>
              window.onload = function() {
                window.focus();
                setTimeout(function() {
                  window.print();
                  setTimeout(function() {
                    window.parent.document.body.removeChild(window.frameElement);
                  }, 500);
                }, 300);
              };
            </script>
          </body>
        </html>
      `);
      doc.close();
    }
  }

  async downloadPdf() {
    const element = document.getElementById('invoiceFrame');
    if (!element) return;

    // Create temporary off-screen container for isolated rendering
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = '800px';
    tempContainer.style.height = '1130px';
    tempContainer.style.background = '#ffffff';
    tempContainer.style.zIndex = '-9999';

    // Inject invoice contents and custom styles to isolate from mobile parents
    const tempStyle = `
      <style>
        .capturing-pdf {
          width: 800px !important;
          min-width: 800px !important;
          height: 1130px !important;
          min-height: 1130px !important;
          padding: 40px !important;
          box-sizing: border-box !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          background: #ffffff !important;
          color: #000000 !important;
          font-family: 'Arial', 'Helvetica', sans-serif !important;
        }
        .capturing-pdf .spacer-row td {
          height: 380px !important;
        }
        .capturing-pdf .invoice-header {
          display: flex !important;
          border: 0.5px solid #7f7f7f !important;
          min-height: 135px !important;
          position: relative !important;
        }
        .capturing-pdf .header-left {
          flex: 1 !important;
          padding: 12px 15px !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
        }
        .capturing-pdf .header-right {
          flex: 1 !important;
          padding: 12px 15px !important;
          padding-left: 50px !important;
          border-left: 0.5px solid #7f7f7f !important;
        }
        .capturing-pdf .header-center {
          position: absolute !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          top: -1px !important;
          height: 100% !important;
          width: 80px !important;
          display: flex !important;
          justify-content: center !important;
          align-items: flex-start !important;
        }
        .capturing-pdf .c-badge-box {
          width: 60px !important;
          height: 60px !important;
          border: 0.5px solid #7f7f7f !important;
          background-color: #ffffff !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .capturing-pdf .receptor-box {
          border: 0.5px solid #7f7f7f !important;
          padding: 10px 15px !important;
          margin-top: 4px !important;
          margin-bottom: 0 !important;
        }
        .capturing-pdf .items-table-container {
          margin-top: 4px !important;
        }
        .capturing-pdf .items-table {
          width: 100% !important;
          border-collapse: collapse !important;
          font-size: 11px !important;
        }
        .capturing-pdf .items-table th {
          background-color: #e0e0e0 !important;
          border-top: 0.5px solid #7f7f7f !important;
          border-bottom: 0.5px solid #7f7f7f !important;
          border-right: 0.5px solid #7f7f7f !important;
          padding: 8px 6px !important;
          font-weight: bold !important;
          text-align: left !important;
        }
        .capturing-pdf .items-table th:first-child {
          border-left: 0.5px solid #7f7f7f !important;
        }
        .capturing-pdf .items-table td {
          padding: 6px !important;
        }
        .capturing-pdf .totals-table {
          width: 100% !important;
          border: 0.5px solid #7f7f7f !important;
          border-collapse: collapse !important;
          font-size: 11px !important;
        }
        .capturing-pdf .totals-table td {
          padding: 6px 12px !important;
        }
        .capturing-pdf .consumer-defense-box {
          border: 0.5px solid #7f7f7f !important;
          text-align: center !important;
          padding: 6px !important;
          font-size: 10px !important;
        }
        .capturing-pdf .footer-section {
          margin-top: 10px !important;
        }
      </style>
    `;

    tempContainer.className = 'capturing-pdf';
    tempContainer.innerHTML = tempStyle + element.innerHTML;
    
    // Append to body to render in background
    document.body.appendChild(tempContainer);

    try {
      const canvas = await html2canvas(tempContainer, {
        scale: 2, // High resolution (renders crisp text and QR code)
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Create A4 PDF (210mm x 297mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = 297; // Force full A4 page height (matches capturing aspect ratio)

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`factura-${this.simForm.get('compNro')?.value || 'simulada'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      // Remove temporary container
      document.body.removeChild(tempContainer);
    }
  }

  formatNumber(value: number | null | undefined): string {
    if (value === null || value === undefined) return '0,00';
    return value.toFixed(2).replace('.', ',');
  }

  getClientIdType(): string {
    const value = this.simForm.get('receptorCuitDni')?.value || '';
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue.length > 8 ? 'CUIT' : 'DNI';
  }

  getFormattedDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
}
