import { Meta, StoryObj, applicationConfig } from '@storybook/angular';
import { VencimientosModalComponent } from './vencimientos-modal.component';

const meta: Meta<VencimientosModalComponent> = {
  title: 'Dashboard/VencimientosModal',
  component: VencimientosModalComponent,
  tags: ['autodocs'],
  argTypes: {
    dismiss: { action: 'dismiss' },
    pay: { action: 'pay' },
    viewAll: { action: 'viewAll' },
  },
  decorators: [
    applicationConfig({
      providers: [
        { provide: 'ClientService', useValue: { getClientById: () => ({}) } },
        { provide: 'OperationService', useValue: { payCuota: () => {} } }
      ],
    }),
  ],
};

export default meta;
type Story = StoryObj<VencimientosModalComponent>;

export const Default: Story = {
  args: {
    isOpen: true,
    selectedDate: '2023-10-15',
    cuotas: []
  },
};
