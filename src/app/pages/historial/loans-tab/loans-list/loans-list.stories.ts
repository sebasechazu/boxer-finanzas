import { Meta, StoryObj } from '@storybook/angular';
import { LoansListComponent } from './loans-list.component';

const meta: Meta<LoansListComponent> = {
  title: 'Historial/LoansList',
  component: LoansListComponent,
  tags: ['autodocs'],
  argTypes: {
    edit: { action: 'edit' },
    delete: { action: 'delete' },
  },
};

export default meta;
type Story = StoryObj<LoansListComponent>;

export const Default: Story = {
  args: {
    loans: [
      {
        id: '1',
        usuarioId: 'u1',
        nombre: 'Préstamo Rápido 10k',
        montoBase: 10000,
        porcentajeRecargo: 20,
        cuotasCount: 4,
        periodicidad: 'SEMANAL',
        diaSemana: 1 // Lunes
      },
      {
        id: '2',
        usuarioId: 'u1',
        nombre: 'Préstamo Mensual 50k',
        montoBase: 50000,
        porcentajeRecargo: 35,
        cuotasCount: 6,
        periodicidad: 'MENSUAL',
        diaVencimiento: 10
      }
    ]
  },
};

export const Empty: Story = {
  args: {
    loans: []
  },
};
