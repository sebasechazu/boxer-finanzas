import { Routes } from '@angular/router';
import { authGuard } from './core/services/auth.service';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
        canActivate: [authGuard]
      },

      {
        path: 'clients',
        loadComponent: () => import('./pages/clients/clients.page').then((m) => m.ClientsPage),
        canActivate: [authGuard]
      },
      {
        path: 'historial',
        loadComponent: () => import('./pages/historial/historial.component').then((m) => m.HistorialComponent),
        canActivate: [authGuard]
      },
      {
        path: 'articles',
        loadComponent: () => import('./pages/articles/articles.page').then((m) => m.ArticlesPage),
        canActivate: [authGuard]
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.page').then((m) => m.ProfilePage),
        canActivate: [authGuard]
      },
      {
        path: '',
        redirectTo: '/tabs/dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: 'login', // Redirigir a login por defecto si no está autenticado
    pathMatch: 'full',
  },
];
