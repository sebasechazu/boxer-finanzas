import { Meta, StoryObj, applicationConfig } from '@storybook/angular';
import { NotificationBellComponent } from './notification-bell.component';

const meta: Meta<NotificationBellComponent> = {
  title: 'Shared/NotificationBell',
  component: NotificationBellComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [
        { provide: 'NotificationService', useValue: { unreadCount: () => 3 } },
        { provide: 'Router', useValue: { navigate: () => {} } }
      ],
    }),
  ],
};

export default meta;
type Story = StoryObj<NotificationBellComponent>;

export const Default: Story = {
  args: {},
};
