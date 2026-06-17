import { Meta, StoryObj } from '@storybook/angular';
import { ArticleModalComponent } from './article-modal.component';

const meta: Meta<ArticleModalComponent> = {
  title: 'Historial/ArticleModal',
  component: ArticleModalComponent,
  tags: ['autodocs'],
  argTypes: {
    dismiss: { action: 'dismiss' },
    save: { action: 'save' },
  },
};

export default meta;
type Story = StoryObj<ArticleModalComponent>;

export const Default: Story = {
  args: {
    isOpen: true,
    isSaving: false,
  },
};
