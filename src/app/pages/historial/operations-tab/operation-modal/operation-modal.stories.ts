import { Meta, StoryObj } from '@storybook/angular';
import { OperationModalComponent } from './operation-modal.component';

const meta: Meta<OperationModalComponent> = {
  title: 'Historial/OperationModal',
  component: OperationModalComponent,
  tags: ['autodocs'],
  argTypes: {
    dismiss: { action: 'dismiss' },
    save: { action: 'save' },
  },
};

export default meta;
type Story = StoryObj<OperationModalComponent>;

export const Default: Story = {
  args: {
    isOpen: true,
    isSaving: false,
  },
};
