import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register').then(m => m.RegisterComponent)
  },
  {
    path: '',
    loadComponent: () => import('./components/layout/layout').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./components/dashboard/dashboard').then(m => m.DashboardComponent) },
      { path: 'transactions', loadComponent: () => import('./components/transactions/transactions').then(m => m.TransactionsComponent) },
      { path: 'budgets', loadComponent: () => import('./components/budgets/budgets').then(m => m.BudgetsComponent) },
      { path: 'analytics', loadComponent: () => import('./components/analytics/analytics').then(m => m.AnalyticsComponent) },
      { path: 'import', loadComponent: () => import('./components/import/import').then(m => m.ImportComponent) },
      { path: 'profile', loadComponent: () => import('./components/profile/profile').then(m => m.ProfileComponent) },
    ]
  },
  { path: '**', redirectTo: 'login' }
];