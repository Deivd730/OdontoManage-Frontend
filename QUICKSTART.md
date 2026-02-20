# 🚀 Quick Start Guide - OdontoManage Authentication

## ✅ Lo que se ha implementado

### Frontend (Angular)
- ✅ **Login Page** con diseño moderno y responsive
- ✅ **Auth Service** completo con métodos para JWT y roles
- ✅ **Auth Guard** para proteger rutas autenticadas
- ✅ **Role Guard** para proteger rutas por roles de Symfony
- ✅ **JWT Interceptor** que añade el token automáticamente
- ✅ **Dashboard** con información de usuario y roles
- ✅ **Unauthorized Page** para accesos denegados
- ✅ Configuración de environments
- ✅ Documentación completa

## 📁 Archivos creados/modificados

```
OdontoManage/
├── AUTH_README.md                          # Documentación completa
├── SYMFONY_BACKEND_SETUP.md                # Guía de configuración backend
├── src/
│   ├── environments/
│   │   ├── environment.ts                  # Config producción
│   │   └── environment.development.ts      # Config desarrollo
│   └── app/
│       ├── core/
│       │   ├── guards/
│       │   │   ├── auth.guard.ts          # ✅ Guard de autenticación
│       │   │   └── role.guard.ts          # ✨ NUEVO - Guard de roles
│       │   ├── interceptors/
│       │   │   └── jwt.interceptor.ts     # ✅ Interceptor JWT
│       │   └── services/
│       │       └── auth.service.ts        # ✅ Servicio mejorado con roles
│       ├── features/
│       │   ├── login/                     # ✨ NUEVO
│       │   │   ├── login.component.ts
│       │   │   ├── login.component.html
│       │   │   └── login.component.css
│       │   ├── dashboard/                 # ✨ NUEVO
│       │   │   └── dashboard.component.ts
│       │   └── unauthorized/              # ✨ NUEVO
│       │       └── unauthorized.component.ts
│       └── app.routes.ts                  # ✅ Rutas configuradas
```

## 🏃‍♂️ Pasos para iniciar

### 1. Configurar el Backend (Symfony)

```bash
# En tu proyecto Symfony (backend)
cd /path/to/your/symfony/project

# Generar claves JWT
php bin/console lexik:jwt:generate-keypair

# Crear/actualizar base de datos
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate

# Cargar usuarios de prueba
php bin/console doctrine:fixtures:load

# Iniciar servidor
symfony serve
# Debe estar corriendo en http://localhost:8000
```

Ver **SYMFONY_BACKEND_SETUP.md** para configuración completa.

### 2. Configurar el Frontend (Angular)

```bash
# En tu proyecto Angular
cd /Users/soren/Documents/ProyectoFinal/OdontoManage-Frontend/OdontoManage

# Instalar dependencias (si no están instaladas)
npm install

# Verificar que @auth0/angular-jwt esté instalado
npm list @auth0/angular-jwt
# Si no está: npm install @auth0/angular-jwt

# Iniciar servidor de desarrollo
npm start
# Debe estar corriendo en http://localhost:4200
```

### 3. Ajustar la URL de la API

Edita el archivo:
```typescript
// src/environments/environment.development.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',  // ← Verifica esta URL
  tokenKey: 'auth_token',
  refreshTokenKey: 'refresh_token'
};
```

### 4. Probar el sistema

1. Abre tu navegador en `http://localhost:4200`
2. Deberías ver la página de login
3. Usa las credenciales de prueba:

   **Dentista:**
   - Usuario: `dentist`
   - Contraseña: `dentist123`
   - Rol: ROLE_DENTIST

4. Después del login exitoso, serás redirigido al dashboard

## 🎯 Próximos pasos

### Crear una ruta protegida

```typescript
// app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // ... rutas existentes
  {
    path: 'patients',
    loadComponent: () => import('./features/patients/patients.component')
      .then(m => m.PatientsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'appointments',
    loadComponent: () => import('./features/appointments/appointments.component')
      .then(m => m.AppointmentsComponent),
    canActivate: [AuthGuard]
  }
];
```

### Usar el AuthService en componentes

```typescript
import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

export class MyComponent {
  constructor(private authService: AuthService) {}

  checkPermissions() {
    // Verificar si está autenticado
    if (this.authService.isAuthenticated()) {
      console.log('Usuario autenticado');
    }

    // Obtener usuario actual
    const user = this.authService.getCurrentUser();
    console.log('Usuario:', user?.username);
    console.log('Roles:', user?.roles);
  }

  logout() {
    this.authService.logout();
  }
}
```

## 🐛 Troubleshooting

### Error: "Cannot connect to server"
- ✅ Verifica que Symfony esté corriendo en http://localhost:8000
- ✅ Verifica la configuración de CORS en Symfony

### Error: "401 Unauthorized"
- ✅ Verifica las credenciales
- ✅ Asegúrate de que los usuarios existan en la BD
- ✅ Revisa la configuración de security.yaml

### Error: Token no se envía
- ✅ Verifica que el interceptor esté en app.config.ts
- ✅ Abre DevTools → Application → Local Storage
- ✅ Debe aparecer "auth_token" después del login

### La página está en blanco
- ✅ Abre la consola del navegador (F12)
- ✅ Revisa errores en la pestaña Console
- ✅ Verifica que todas las dependencias estén instaladas

## 📚 Documentación

- **AUTH_README.md**: Documentación completa del sistema de autenticación
- **SYMFONY_BACKEND_SETUP.md**: Guía paso a paso para configurar Symfony

## 🎨 Personalización

### Cambiar colores
```css
/* En los archivos .css de los componentes */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Cambia a tus colores */
background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
```

### Cambiar logo
Reemplaza el texto "OdontoManage" en:
- `login.component.html`
- `dashboard.component.ts`

### Añadir más validaciones
Edita `login.component.ts` en el FormBuilder

## ✨ Features implementadas

- 🔐 Login con JWT
- 👤 Gestión de autenticación
- 🛡️ Guard de autenticación
- 🔄 Interceptor automático de JWT
- 📱 Diseño responsive
- ⚡ Lazy loading de componentes
- 🎨 UI moderna con animaciones
- 🚀 Standalone components (Angular moderno)
- 📝 TypeScript con tipos seguros
- 🔔 Manejo de errores completo

## 💡 Tips

1. El token JWT se almacena en `localStorage`
2. El token incluye los roles del usuario
3. Los guards verifican automáticamente la expiración del token
4. Si el token expira, el usuario es redirigido al login
5. Usa `AuthService.isAuthenticated$` como Observable para reactivity

## 🎓 Recursos adicionales

- [Angular Docs](https://angular.dev)
- [Symfony Security](https://symfony.com/doc/current/security.html)
- [JWT.io](https://jwt.io) - Decodificar tokens JWT
- [LexikJWTBundle](https://github.com/lexik/LexikJWTAuthenticationBundle)

---

**¿Necesitas ayuda?** Revisa los archivos de documentación o la consola del navegador para mensajes de error.
