import { Meta, StoryObj } from '@storybook/angular';
import { ClientListComponent } from './client-list.component';

const meta: Meta<ClientListComponent> = {
  title: 'Clients/ClientList',
  component: ClientListComponent,
  tags: ['autodocs'],
  argTypes: {
    edit: { action: 'edit' },
    delete: { action: 'delete' },
    openWhatsApp: { action: 'openWhatsApp' },
  },
};

export default meta;
type Story = StoryObj<ClientListComponent>;

export const Default: Story = {
  args: {
    clients: [
      {
        id: '1',
        usuarioId: 'u1',
        nombre: 'Juan Pérez',
        apellido: 'Pérez',
        direccion: 'Calle Falsa 123',
        codigoPostal: '1000',
        ciudad: 'Ciudad',
        telefono: '+5491112345678',
        saldoPendiente: 1500
      },
      {
        id: '2',
        usuarioId: 'u1',
        nombre: 'María Gómez',
        apellido: 'Gómez',
        direccion: 'Av. Siempreviva 742',
        codigoPostal: '2000',
        ciudad: 'Otra Ciudad',
        telefono: '+5491187654321',
        saldoPendiente: 0
      }
    ],
  },
};

export const Empty: Story = {
  args: {
    clients: [],
  },
};
