import { Meta, StoryObj } from '@storybook/angular';
import { LoanModalComponent } from './loan-modal.component';

const meta: Meta<LoanModalComponent> = {
  title: 'Historial/LoanModal',
  component: LoanModalComponent,
  tags: ['autodocs'],
  argTypes: {
    dismiss: { action: 'dismiss' },
    save: { action: 'save' },
  },
};

export default meta;
type Story = StoryObj<LoanModalComponent>;

export const Default: Story = {
  args: {
    isOpen: true,
    isSaving: false,
  },
};
