import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { GuestGuard } from './core/guards/guest.guard';
import { MainlayoutComponent } from './features/mainlayout/mainlayout.component';
import { DocumentCreate } from '@features/document-create/document-create.component';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent), canActivate: [GuestGuard] },
  { path: 'register', loadComponent: () => import('./features/register/register.component').then(m => m.RegisterComponent), canActivate: [GuestGuard] },
  {
    path: '',
    component: MainlayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
      { path: 'profile', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'patients', loadComponent: () => import('./features/patient-read/patient-read').then(m => m.PatientRead) },
      { path: 'patients/create', loadComponent: () => import('./features/patient-create/patient-create').then(m => m.PatientCreate) },
      { path: 'documents', loadComponent: () => import('./features/document/document.component').then(m => m.DocumentComponent) },
      { path: 'documents/create', loadComponent: () => import('./features/document-create/document-create.component').then(m => m.DocumentCreate) },
      { path: 'appointments', loadComponent: () => import('./features/appointment/appointment').then(m => m.Appointment) },
      {
        path: 'odontogram',
        loadComponent: () => import('@features/odontogram/odontogram-layout/odontogram-layout.component').then(m => m.OdontogramLayoutComponent),
        children: [
          {
            path: '',
            loadComponent: () => import('@features/patient-read/patient-list/patient-list.component').then(m => m.PatientListComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('@features/odontogram/odontogram-editor/odontogram-editor.component').then(m => m.OdontogramEditorComponent)
          }
        ]
      },
      { path: 'documents/create', loadComponent: () => import('@features/document-create/document-create.component').then(m => m.DocumentCreate) },
    ]
  },
  { path: '**', redirectTo: 'login' }
];