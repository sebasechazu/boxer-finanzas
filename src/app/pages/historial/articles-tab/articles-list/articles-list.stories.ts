import { Meta, StoryObj } from '@storybook/angular';
import { ArticlesListComponent } from './articles-list.component';

const meta: Meta<ArticlesListComponent> = {
  title: 'Historial/ArticlesList',
  component: ArticlesListComponent,
  tags: ['autodocs'],
  argTypes: {
    edit: { action: 'edit' },
    delete: { action: 'delete' },
  },
};

export default meta;
type Story = StoryObj<ArticlesListComponent>;

export const Default: Story = {
  args: {
    articles: [
      {
        id: '1',
        usuarioId: 'u1',
        nombre: 'Zapatillas Deportivas',
        precioCompra: 15000,
        precioVentaContado: 25000
      },
      {
        id: '2',
        usuarioId: 'u1',
        nombre: 'Pantalón Jean',
        precioCompra: 8000,
        precioVentaContado: 14000
      },
      {
        id: '3',
        usuarioId: 'u1',
        nombre: 'Remera Lisa',
        precioCompra: 3000,
        precioVentaContado: 6000
      }
    ]
  },
};

export const Empty: Story = {
  args: {
    articles: []
  },
};
