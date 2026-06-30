import { Component, ChangeDetectionStrategy, OnChanges, SimpleChanges, inject, input, output, signal, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
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
import * as QRCode from 'qrcode';
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
  encapsulation: ViewEncapsulation.None,
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
      const availableWidth = width - 32;
      const scale = availableWidth / 800;
      this.invoiceScale.set(scale);
    } else {
      const availableWidth = width - 380 - 60;
      const scale = Math.min(1, availableWidth / 800);
      this.invoiceScale.set(scale);
    }
  }

  getScaledHeight(): string {
    const scale = this.invoiceScale();
    if (scale >= 1) return 'auto';
    return (1130 * scale) + 'px';
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen() && this.operation()) {
      this.loadInvoiceData(this.operation()!);
      setTimeout(() => this.calculateScale(), 100);
    }
  }

  loadInvoiceData(op: Operacion) {
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

    const opDateStr = (op as any).creadoEn || new Date().toISOString();
    const opDate = new Date(opDateStr);
    const formattedDate = opDate.toISOString().substring(0, 10);
    const caeDueDate = new Date(opDate.getTime() + 10 * 24 * 60 * 60 * 1000);
    const formattedCaeDueDate = caeDueDate.toISOString().substring(0, 10);

    const items: InvoiceItem[] = [];
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

    const emisorName = profile?.nombre || 'Negocio';
    const emisorFant = profile?.nombreNegocio || 'ELECTRONLINE';
    const clientName = client ? `${client.apellido || ''} ${client.nombre || ''}`.trim() : 'Consumidor Final';
    const clientAddress = client ? `${client.direccion || ''} ${client.ciudad || ''}`.trim() : 'Monseñor de Andrea 417';

    const rawNumber = op.id ? parseInt(op.id.replace(/\D/g, '').substring(0, 8)) || 104 : 104;
    const formattedCompNro = String(rawNumber).padStart(8, '0');
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
    const qrData = {
      ver: 1,
      fecha: values.fechaEmision,
      cuit: parseInt(values.emisorCuit.replace(/\D/g, '')) || 20345332449,
      ptoVta: parseInt(values.puntoVenta) || 3,
      tipoCodAut: 'E',
      codAut: parseInt(values.caeNro) || 86030757854814,
      tipoComp: 11,
      nroComp: parseInt(values.compNro) || 104,
      importe: this.totalFinal(),
      moneda: 'PES',
      cotiz: 1
    };

    const base64Payload = btoa(JSON.stringify(qrData));
    const targetUrl = `https://www.afip.gob.ar/fe/qr/?p=${base64Payload}`;

    QRCode.toDataURL(targetUrl, {
      width: 150,
      margin: 1,
      errorCorrectionLevel: 'M'
    }).then(url => {
      this.qrCodeUrl.set(url);
    }).catch(err => {
      console.error('Error generating QR code:', err);
    });
  }

  onFormChange() {
    this.updateQrCode();
  }

  printInvoice() {
    const element = document.getElementById('invoiceFrame');
    if (!element) return;

    if (this.isMobileDevice()) {
      this.printInvoiceMobile(element);
    } else {
      this.printInvoiceDesktop(element);
    }
  }

  private printInvoiceDesktop(element: HTMLElement) {
    // PC: clonar al body + window.print() con estilos globales en <head>
    const clone = element.cloneNode(true) as HTMLElement;
    clone.id = 'invoice-print-clone';
    clone.style.transform = 'none';

    const globalPrintStyle = document.createElement('style');
    globalPrintStyle.id = 'invoice-print-global-style';
    globalPrintStyle.textContent = `
      @media print {
        @page { margin: 0 !important; size: A4 portrait; }
        body.printing-invoice > *:not(#invoice-print-clone) { display: none !important; }
        body.printing-invoice { margin: 0 !important; padding: 0 !important; background: #ffffff !important; }
        #invoice-print-clone {
          display: block !important; position: absolute !important;
          left: 0 !important; top: 0 !important;
          width: 100% !important; padding: 1.2cm !important;
          box-sizing: border-box !important; background: #ffffff !important;
          margin: 0 !important; box-shadow: none !important;
        }
        #invoice-print-clone .invoice-box {
          width: 100% !important; min-width: 0 !important;
          max-width: 100% !important; padding: 0 !important;
          box-sizing: border-box !important; box-shadow: none !important; border: none !important;
        }
        #invoice-print-clone .spacer-row td { height: 380px !important; }
        #invoice-print-clone .items-table th {
          background-color: #e0e0e0 !important;
          -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
        }
      }
    `;

    document.head.appendChild(globalPrintStyle);
    document.body.classList.add('printing-invoice');
    document.body.appendChild(clone);

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.getElementById('invoice-print-clone')?.remove();
        document.getElementById('invoice-print-global-style')?.remove();
        document.body.classList.remove('printing-invoice');
      }, 500);
    }, 150);
  }

  private async printInvoiceMobile(element: HTMLElement) {
    // En móvil/PWA: window.print() e iframe.print() son escalados por el
    // sistema de impresión de Android sin importar el CSS.
    // Solución: generar el PDF (igual que downloadPdf) y abrirlo en nueva pestaña.
    // El visor de PDF del browser imprime en A4 correcto sin escalado.
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '800px';
    tempContainer.style.background = '#ffffff';
    tempContainer.style.zIndex = '-9999';
    tempContainer.style.overflow = 'hidden';

    const contentClone = element.cloneNode(true) as HTMLElement;
    contentClone.style.transform = 'none';
    contentClone.style.boxShadow = 'none';

    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .invoice-box { box-shadow: none !important; }
      .spacer-row td { height: 380px !important; }
      .items-table th { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    `;

    tempContainer.appendChild(styleEl);
    tempContainer.appendChild(contentClone);
    document.body.appendChild(tempContainer);

    try {
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 800,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = 210;
      const ratio = canvas.height / canvas.width;
      const imgH = Math.min(pageW * ratio, 297);
      pdf.addImage(imgData, 'PNG', 0, 0, pageW, imgH);

      // Abrir el PDF en nueva pestaña para imprimir desde el visor de PDF
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, '_blank');
      // Liberar la URL del blob después de que el browser la haya cargado
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
    } catch (error) {
      console.error('Error al generar PDF para impresión:', error);
    } finally {
      document.body.removeChild(tempContainer);
    }
  }

  async downloadPdf() {
    const element = document.getElementById('invoiceFrame');
    if (!element) return;

    // Contenedor temporal con el ancho nativo de la factura (800px)
    // No modificamos el layout — solo quitamos el scale transform y la sombra
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '800px';
    tempContainer.style.background = '#ffffff';
    tempContainer.style.zIndex = '-9999';
    tempContainer.style.overflow = 'hidden';

    const contentClone = element.cloneNode(true) as HTMLElement;
    contentClone.style.transform = 'none';
    contentClone.style.boxShadow = 'none';

    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .invoice-box { box-shadow: none !important; }
      .spacer-row td { height: 380px !important; }
      .items-table th {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    `;

    tempContainer.appendChild(styleEl);
    tempContainer.appendChild(contentClone);
    document.body.appendChild(tempContainer);

    try {
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 800,
      });

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Escalar el canvas de 800px al ancho de A4 (210mm), respetando el ratio
      const pageW = 210;
      const ratio = canvas.height / canvas.width;
      const imgH = Math.min(pageW * ratio, 297);

      pdf.addImage(imgData, 'PNG', 0, 0, pageW, imgH);
      pdf.save(`factura-${this.simForm.get('compNro')?.value || 'simulada'}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF:', error);
    } finally {
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
