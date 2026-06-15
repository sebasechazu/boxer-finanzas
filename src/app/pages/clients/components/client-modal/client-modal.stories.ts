import { Meta, StoryObj } from '@storybook/angular';
import { ClientModalComponent } from './client-modal.component';

const meta: Meta<ClientModalComponent> = {
  title: 'Clients/ClientModal',
  component: ClientModalComponent,
  tags: ['autodocs'],
  argTypes: {
    didDismiss: { action: 'didDismiss' },
    save: { action: 'save' },
  },
};

export default meta;
type Story = StoryObj<ClientModalComponent>;

export const CreateMode: Story = {
  args: {
    isOpen: true,
    isSaving: false,
    isEditing: false,
    clientData: null,
  },
};

export const EditMode: Story = {
  args: {
    isOpen: true,
    isSaving: false,
    isEditing: true,
    clientData: {
      id: '1',
      usuarioId: 'u1',
      nombre: 'Juan Pérez',
      telefono: '+5491112345678',
      saldoPendiente: 1500
    },
  },
};

export const SavingMode: Story = {
  args: {
    isOpen: true,
    isSaving: true,
    isEditing: false,
    clientData: null,
  },
};
