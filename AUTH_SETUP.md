# Configuración de Autenticación con JWT

## 📦 Instalación completada
✅ `@auth0/angular-jwt` instalado correctamente

## 🏗️ Estructura creada

```
/src/app/core
   /services
      auth.service.ts       - Servicio principal de autenticación
   /guards
      auth.guard.ts         - Guard para proteger rutas
   /interceptors
      jwt.interceptor.ts    - Interceptor para agregar JWT a las peticiones
```

## ⚙️ Configuración en app.config.ts o app.module.ts

### Para Angular 17+ (Standalone con app.config.ts):

```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { JwtInterceptor } from './core/interceptors/jwt.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([JwtInterceptor])
    )
  ]
};
```

### Para Angular con módulos (app.module.ts):

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { JwtModule } from '@auth0/angular-jwt';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { JwtInterceptor } from './core/interceptors/jwt.interceptor';

export function tokenGetter() {
  return localStorage.getItem('auth_token');
}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    JwtModule.forRoot({
      config: {
        tokenGetter: tokenGetter,
        allowedDomains: ['localhost:3000', 'tu-api.com'], // Configura tus dominios
        disallowedRoutes: ['http://localhost:3000/auth/login']
      }
    })
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

## 🛡️ Uso del Guard en las rutas

```typescript
import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component')
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component'),
    canActivate: [AuthGuard] // Protege esta ruta
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.component'),
    canActivate: [AuthGuard] // Protege esta ruta
  }
];
```

## 💡 Uso del AuthService

### En un componente de login:

```typescript
import { Component } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  template: `...`
})
export class LoginComponent {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  login(username: string, password: string) {
    this.authService.login({ username, password }).subscribe({
      next: (response) => {
        console.log('Login exitoso', response);
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Error en login', error);
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
```

### Verificar autenticación:

```typescript
// En cualquier componente
constructor(private authService: AuthService) {
  // Método 1: Verificación directa
  if (this.authService.isAuthenticated()) {
    console.log('Usuario autenticado');
  }

  // Método 2: Suscribirse a cambios
  this.authService.isAuthenticated$.subscribe(isAuth => {
    console.log('Estado de autenticación:', isAuth);
  });

  // Obtener datos del usuario
  const user = this.authService.getCurrentUser();
  console.log('Usuario actual:', user);
}
```

## 🔧 Configuración adicional

### 1. Actualiza la URL de tu API en auth.service.ts:
```typescript
private apiUrl = 'http://localhost:3000/api'; // Tu URL de backend
```

### 2. Personaliza la clave del token si es necesario:
```typescript
private tokenKey = 'auth_token'; // Puedes cambiar esto
```

## 📝 Notas importantes

- El token se almacena en `localStorage`
- El interceptor agrega automáticamente el token a todas las peticiones HTTP
- Si el token expira o es inválido (error 401), el usuario es redirigido al login
- El guard protege las rutas y redirige al login si no está autenticado

## 🚀 Próximos pasos

1. Configura tu URL de API en `auth.service.ts`
2. Registra el interceptor en tu configuración de la app
3. Aplica el `AuthGuard` a las rutas que necesiten protección
4. Crea tu componente de login y usa el `AuthService`
