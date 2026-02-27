# Quick Start Guide - OdontoManage Frontend

## Installation in 3 steps

### 1) Clone and install
```bash
git clone https://github.com/Deivd730/OdontoManage-Frontend.git
cd OdontoManage-Frontend
npm install --legacy-peer-deps
```

### 2) Configure
Edit `src/app/core/services/auth.service.ts` and change the backend URL:
```typescript
private apiUrl = 'http://localhost:3000/api'; // Your URL here
```

### 3) Run
```bash
npm start
```

Open your browser at: **http://localhost:4200**

---

## Installed dependencies

- Angular 19.2.18
- Angular Router
- Angular Forms
- @auth0/angular-jwt (JWT Authentication)
- RxJS 7.8.2

---

## Authentication system

This project includes:
- `AuthService` - Handles login/logout
- `AuthGuard` - Route protection
- `JwtInterceptor` - Automatic token injection

See [AUTH_SETUP.md](./AUTH_SETUP.md) for more details.

---

## Useful commands

```bash
# Development
npm start                    # Starts development server

# Build
npm run build               # Development build
npm run build:prod          # Production build

# Testing
npm test                    # Runs tests
npm run lint                # Runs linter

# Angular CLI
ng generate component name    # New component
ng generate service name      # New service
ng generate guard name        # New guard
```

---

## Quick troubleshooting

### Module error
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Port already in use
```bash
npm start -- --port 4201
```

### Corrupted cache
```bash
npm cache clean --force
npm install --legacy-peer-deps
```

---

## Documentation

For full technical documentation, see [DOCUMENTATION.md](./DOCUMENTATION.md).
