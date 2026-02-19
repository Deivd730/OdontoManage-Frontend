# 🚀 Guía de Inicio Rápido - OdontoManage Frontend

## Instalación en 3 pasos

### 1️⃣ Clonar e instalar
```bash
git clone https://github.com/Deivd730/OdontoManage-Frontend.git
cd OdontoManage-Frontend
npm install --legacy-peer-deps
```

### 2️⃣ Configurar
Edita `src/app/core/services/auth.service.ts` y cambia la URL del backend:
```typescript
private apiUrl = 'http://localhost:3000/api'; // Tu URL aquí
```

### 3️⃣ Ejecutar
```bash
npm start
```

Abre tu navegador en: **http://localhost:4200** 🎉

---

## 📦 Dependencias instaladas

✅ Angular 19.2.18  
✅ Angular Router  
✅ Angular Forms  
✅ @auth0/angular-jwt (Autenticación JWT)  
✅ RxJS 7.8.2  

---

## 🔐 Sistema de Autenticación

Este proyecto incluye:
- ✅ `AuthService` - Manejo de login/logout
- ✅ `AuthGuard` - Protección de rutas
- ✅ `JwtInterceptor` - Inyección automática de tokens

Ver [AUTH_SETUP.md](./AUTH_SETUP.md) para más detalles.

---

## 📜 Comandos útiles

```bash
# Desarrollo
npm start                    # Inicia servidor de desarrollo

# Construcción
npm run build               # Build de desarrollo
npm run build:prod          # Build de producción

# Testing
npm test                    # Ejecuta tests
npm run lint                # Ejecuta linter

# Angular CLI
ng generate component nombre    # Nuevo componente
ng generate service nombre      # Nuevo servicio
ng generate guard nombre        # Nuevo guard
```

---

## 🔧 Solución rápida de problemas

### Error de módulos
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Puerto ocupado
```bash
npm start -- --port 4201
```

### Cache corrupto
```bash
npm cache clean --force
npm install --legacy-peer-deps
```

---


