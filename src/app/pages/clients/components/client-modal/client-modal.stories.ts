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

import { userEvent, within, waitFor } from '@storybook/test';

export const ValidationErrors: Story = {
  args: {
    isOpen: true,
    isSaving: false,
    isEditing: false,
    clientData: null,
  },
  play: async ({ canvasElement }) => {
    // ion-modal is rendered in the body, not canvasElement
    const body = within(document.body);
    
    // Wait until the inputs are actually in the DOM
    await waitFor(() => {
      const inputs = document.querySelectorAll('ion-input');
      if (inputs.length < 2) {
        throw new Error('Inputs not ready');
      }
    }, { timeout: 3000 });

    const inputs = document.querySelectorAll('ion-input');
    const nombreInput = inputs[0] as any;
    const telefonoInput = inputs[1] as any;

    // We must interact with the native input inside the shadow root if it's Ionic 7+
    // or we can set value and dispatch the events Angular listens to:
    
    // 1. Nombre
    nombreInput.value = 'Juan 123';
    nombreInput.dispatchEvent(new CustomEvent('ionInput', { bubbles: true, composed: true, detail: { value: 'Juan 123' } }));
    nombreInput.dispatchEvent(new CustomEvent('ionBlur', { bubbles: true, composed: true }));
    nombreInput.classList.add('ion-touched', 'ion-invalid');

    // 2. Telefono
    telefonoInput.value = 'abc';
    telefonoInput.dispatchEvent(new CustomEvent('ionInput', { bubbles: true, composed: true, detail: { value: 'abc' } }));
    telefonoInput.dispatchEvent(new CustomEvent('ionBlur', { bubbles: true, composed: true }));
    telefonoInput.classList.add('ion-touched', 'ion-invalid');
  }
};
