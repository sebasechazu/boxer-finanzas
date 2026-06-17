import { Meta, StoryObj, applicationConfig } from '@storybook/angular';
import { OperationsListComponent } from './operations-list.component';
import { of } from 'rxjs';

const meta: Meta<OperationsListComponent> = {
  title: 'Historial/OperationsList',
  component: OperationsListComponent,
  tags: ['autodocs'],
  argTypes: {
    edit: { action: 'edit' },
    delete: { action: 'delete' },
  },
  decorators: [
    applicationConfig({
      providers: [
        { 
          provide: 'ClientService', 
          useValue: { 
            getClientById: (id: string) => ({ id, nombre: id === 'c1' ? 'Juan Pérez' : 'María Gómez' }) 
          } 
        },
        { provide: 'OperationService', useValue: {} }
      ],
    }),
  ],
};

export default meta;
type Story = StoryObj<OperationsListComponent>;

export const Default: Story = {
  args: {
    operations: [
      {
        id: 'op1',
        usuarioId: 'u1',
        clienteId: 'c1',
        tipo: 'PRESTAMO',
        cuotasCount: 10,
        periodicidad: 'SEMANAL',
        fechaPrimerVencimiento: '2023-11-01'
      },
      {
        id: 'op2',
        usuarioId: 'u1',
        clienteId: 'c2',
        tipo: 'VENTA',
        cuotasCount: 3,
        periodicidad: 'MENSUAL',
        fechaPrimerVencimiento: '2023-11-15'
      }
    ]
  },
};

export const Empty: Story = {
  args: {
    operations: []
  },
};
