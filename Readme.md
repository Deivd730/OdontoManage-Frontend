# OdontoManage Frontend

**Aplicación Angular moderna para gestión dental integral** - Citas, pacientes, documentos y odontogramas.

## 🚀 Quick Start

### 1. Instalación
```bash
git clone https://github.com/Deivd730/OdontoManage-Frontend.git
cd OdontoManage-Frontend
npm install
```

### 2. Configuración
Edita el archivo de configuración según tu entorno:
```typescript
// src/environments/environment.development.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',  // URL de tu backend Symfony
  tokenKey: 'auth_token',
  refreshTokenKey: 'refresh_token'
};
```

### 3. Ejecutar
```bash
ng serve
```
Abre tu navegador en: **http://localhost:4200**

---

## 📦 Stack Tecnológico

| Tecnología | Versión | Propósito |
|-----------|---------|----------|
| Angular | 21.2.9 | Framework principal |
| TypeScript | 5.9.2 | Lenguaje tipado |
| RxJS | 7.8.0 | Programación reactiva |
| Angular Material | 21.2.0 | Componentes UI |
| @auth0/angular-jwt | 5.2.0 | Autenticación JWT |
| Flatpickr | 4.6.13 | Date picker |

---

## 🎯 Funcionalidades Principales

### 👥 Gestión de Pacientes
- **Listado completo** con búsqueda y filtrado
- **Crear/Editar** pacientes con validación
- **Perfil detallado** del paciente y su historial
- **Documentos** asociados (radiografías, etc.)

### 📋 Citas Médicas
- **Agendar citas** con dentista
- **Calendario integrado** de disponibilidad
- **Historial** de citas pasadas
- **Notificaciones** de recordatorios

### 🦷 Odontograma Digital
- **Visualización 2D** de piezas dentales
- **Registro de tratamientos y patologías**
- **Historial visual** de cambios

### 🔐 Autenticación Segura
- **Login/Registro** con JWT
- **Protección de rutas** basada en roles
- **Auto-renovación** de tokens
- **Cierre de sesión** seguro

---

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── core/
│   │   ├── guards/
│   │   │   ├── auth.guard.ts         # Protege rutas autenticadas
│   │   │   └── guest.guard.ts        # Protege rutas públicas
│   │   ├── interceptors/
│   │   │   ├── jwt.interceptor.ts    # Inyecta token JWT automáticamente
│   │   │   └── mock.interceptor.ts   # Mock para desarrollo
│   │   └── services/
│   │       ├── auth.service.ts       # Gestión de autenticación
│   │       ├── patient.service.ts    # CRUD de pacientes
│   │       ├── appointment.service.ts # Gestión de citas
│   │       ├── odontogram.service.ts # Datos odontograma
│   │       ├── document.service.ts   # Gestión de documentos
│   │       └── notification.service.ts # Sistema de notificaciones
│   │
│   ├── features/
│   │   ├── login/                    # Página de autenticación
│   │   ├── register/                 # Página de registro
│   │   ├── home/                     # Dashboard principal
│   │   ├── mainlayout/               # Layout con navbar
│   │   ├── navbar/                   # Barra de navegación
│   │   ├── patient-list/             # Listado de pacientes
│   │   ├── patient-read/             # Perfil del paciente
│   │   ├── patient-create/           # Crear paciente
│   │   ├── appointment/              # Gestión de citas
│   │   ├── odontogram/               # Visualizador odontograma
│   │   ├── document/                 # Gestión de documentos
│   │   └── profile/                  # Perfil del usuario
│   │
│   ├── models/
│   │   └── odontogram.ts             # Modelos de datos
│   │
│   ├── app.routes.ts                 # Configuración de rutas
│   ├── app.config.ts                 # Configuración global
│   └── app.ts                        # Componente raíz
│
├── environments/
│   ├── environment.ts                # Producción
│   └── environment.development.ts    # Desarrollo
│
├── index.html
├── main.ts
├── styles.css
└── material-theme.scss
```

---

## 🛣️ Rutas de la Aplicación

### Públicas (sin autenticación requerida)
- `/login` - Formulario de login
- `/register` - Formulario de registro

### Protegidas (requieren autenticación)
- `/home` - Dashboard principal
- `/patients` - Listado de pacientes
- `/patients/create` - Crear nuevo paciente
- `/patients/:id` - Perfil del paciente
- `/appointments` - Gestión de citas
- `/odontogram` - Odontograma digital
- `/documents` - Gestor de documentos
- `/profile` - Perfil del usuario logueado

---

## 💻 Comandos Disponibles

```bash
# Desarrollo
ng serve               # Inicia servidor de desarrollo (puerto 4200)
ng build --watch       # Build en modo watch
ng test                # Ejecuta tests con Vitest

# Producción
ng build --prod        # Build para producción (dist/)
```

---

## 🔧 Configuración Avanzada

### Variables de Entorno
```typescript
// src/environments/environment.development.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',      // URL del backend
  tokenKey: 'auth_token',                   // Clave localStorage para token
  refreshTokenKey: 'refresh_token'          // Clave para refresh token
};
```

### JWT Interceptor
Automáticamente agrega el token JWT a todas las peticiones HTTP:
```typescript
// src/app/core/interceptors/jwt.interceptor.ts
```

---

## 🚨 Troubleshooting

### Error de módulos
```bash
rm -rf node_modules package-lock.json
npm install
```

### Puerto 4200 en uso
```bash
npm start -- --port 4201
```

### Limpiar caché de npm
```bash
npm cache clean --force
npm install
```

### Token expirado
Los tokens se renuevan automáticamente. Si persisten problemas:
- Verifica que el backend esté corriendo en `http://localhost:8000`
- Limpia localStorage y vuelve a hacer login

---

## 🔐 Requisitos del Sistema

- **Node.js** 20+
- **npm** 10+
- **Backend API** (Symfony) en `http://localhost:8000`
- **Navegador moderno** (Chrome, Firefox, Safari, Edge)

---

## 📝 Notas Importantes

- El frontend asume que el backend Symfony está ejecutándose en `http://localhost:8000`
- Los tokens JWT se almacenan en `localStorage`
- Las rutas protegidas redirigen a login si no hay autenticación
- Los usuarios no autenticados no pueden acceder a rutas privadas

---

## 🤝 Contribuyendo

Para contribuir al proyecto:
1. Crea una rama con tu feature: `git checkout -b feature/nombre`
2. Commit tus cambios: `git commit -am 'Add feature'`
3. Push a la rama: `git push origin feature/nombre`
4. Abre un Pull Request
