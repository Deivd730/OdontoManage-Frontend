import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { GuestGuard } from './core/guards/guest.guard';
import { MainlayoutComponent } from './features/mainlayout/mainlayout.component';
import { ProfileComponent } from './features/profile/profile.component';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent), canActivate: [GuestGuard] },
  { path: 'register', loadComponent: () => import('./features/register/register.component').then(m => m.RegisterComponent), canActivate: [GuestGuard] },
  {
    path: '',
    component: MainlayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'home', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'patients/create', loadComponent: () => import('./features/patient-create/patient-create').then(m => m.PatientCreate) },
      { path: 'profile', component: ProfileComponent },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: '**', redirectTo: 'home' },

    ]
  },
  { path: '**', redirectTo: 'login' }
];