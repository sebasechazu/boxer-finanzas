import { Meta, StoryObj } from '@storybook/angular';
import { DashboardCardsComponent } from './dashboard-cards.component';

const meta: Meta<DashboardCardsComponent> = {
  title: 'Dashboard/DashboardCards',
  component: DashboardCardsComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<DashboardCardsComponent>;

export const Default: Story = {
  args: {
    totalPaid: 15000,
    moneyOnTheStreet: 45000,
    collectedToday: 5000,
    pendingCollectionsToday: 2000
  },
};
