import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home';
import { CustomerComponent } from './features/customer/customer';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: HomeComponent,
    title: 'Car Rental - Inicio'
  },
  {
    path: 'customer',
    component: CustomerComponent,
    title: 'Car Rental - Registro de Cliente'
  },
  {
    path: 'rental',
    loadComponent: () => import('./features/rental/rental').then(m => m.RentalComponent),
    title: 'Car Rental - Nueva Reserva'
  },
  {
    path: 'statistics',
    loadComponent: () => import('./features/statistics/statistics').then(m => m.StatisticsComponent),
    title: 'Car Rental - Estadísticas'
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];
