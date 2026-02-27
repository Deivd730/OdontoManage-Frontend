# Project Documentation - OdontoManage Frontend

## 1. Overview

OdontoManage Frontend is an Angular application for dental management workflows.
It currently includes JWT authentication, user registration, protected pages, and basic patient operations.

## 2. Tech Stack

- Angular 21.1.x (standalone components)
- TypeScript 5.9.x
- RxJS 7.8.x
- Angular Router
- Angular Reactive Forms
- `@auth0/angular-jwt` for token handling

## 3. Requirements

- Node.js 20+
- npm 10+
- Backend API available (Symfony), reachable from the frontend

## 4. Installation and Run

```bash
git clone https://github.com/Deivd730/OdontoManage-Frontend.git
cd OdontoManage-Frontend
npm install
npm start
```

Default app URL: `http://localhost:4200`

## 5. Configuration

Development environment file:

- `src/environments/environment.development.ts`

Relevant variables:

- `apiUrl`: backend base URL (default: `http://localhost:8000`)
- `tokenKey`: JWT storage key (`auth_token`)
- `refreshTokenKey`: refresh token storage key (`refresh_token`)

Production environment file:

- `src/environments/environment.ts`

## 6. Available Scripts

From `package.json`:

- `npm start`: runs `ng serve`
- `npm run build`: creates production build
- `npm test`: runs unit tests

## 7. Main Structure

```text
src/
  app/
    core/
      guards/
      interceptors/
      services/
    features/
      dashboard/
      home/
      login/
      mainlayout/
      navbar/
      patient-create/
      profile/
      register/
    app.config.ts
    app.routes.ts
  environments/
```

## 8. Application Routes

Defined in `src/app/app.routes.ts`.

Public routes:

- `/login` (protected by `GuestGuard`)
- `/register` (protected by `GuestGuard`)

Private routes (inside `MainlayoutComponent`, protected by `AuthGuard`):

- `/home`
- `/dashboard`
- `/patients/create`
- `/profile`

Redirect behavior:

- If a non-authenticated user accesses a private route, they are redirected to `/login` with `returnUrl`.
- If an authenticated user accesses `/login` or `/register`, they are redirected to `/home`.

## 9. Authentication Module

Main service:

- `src/app/core/services/auth.service.ts`

Responsibilities:

- Login (`POST /api/login`)
- Registration (`POST /api/users/register`)
- Token persistence in `localStorage`
- JWT decoding and validation
- Reactive auth state with `isAuthenticated$`
- Logout with token cleanup and redirect to `/login`

JWT Interceptor:

- `src/app/core/interceptors/jwt.interceptor.ts`

Behavior:

- Adds `Authorization: Bearer <token>` to HTTP requests (except login).
- On `401` for authenticated routes, logs out and redirects to `/login`.

Guards:

- `AuthGuard`: allows access only with a valid token.
- `GuestGuard`: blocks login/register when user is already authenticated.

## 10. Patient Module

Service:

- `src/app/core/services/patient.service.ts`

Operations:

- `createPatient` -> `POST /api/patients`
- `getPatient` -> `GET /api/patients/{id}`
- `getPatients` -> `GET /api/patients`
- `updatePatient` -> `PUT /api/patients/{id}`
- `deletePatient` -> `DELETE /api/patients/{id}`

Create page:

- `src/app/features/patient-create/patient-create.ts`

Includes reactive form, validations, and success/error handling.

## 11. User Profile

Service:

- `src/app/core/services/user.service.ts`

Used endpoints:

- `GET /api/user/profile`
- `PUT /api/user/profile/update`

Page:

- `src/app/features/profile/profile.component.ts`

Allows loading and updating authenticated user profile data.

## 12. Functional Flow

1. User opens `/login` or `/register`.
2. Successful login stores JWT in `localStorage`.
3. `JwtInterceptor` attaches token to subsequent requests.
4. User accesses protected routes inside the main layout.
5. If token expires or is invalid, app redirects to login.

## 13. Testing

There are unit test files (`*.spec.ts`) across multiple components and `app`.

Command:

```bash
npm test
```

## 14. Common Issues

Backend connection error:

- Ensure backend API is running.
- Verify `apiUrl` in `environment.development.ts`.
- Verify backend CORS configuration.

401 error:

- Verify credentials and backend JWT setup.
- Clear `localStorage` and login again.

Port 4200 already in use:

```bash
npm start -- --port 4201
```

## 15. Current Scope and Suggested Improvements

Implemented scope:

- JWT authentication
- Registration/login
- Protected routes
- User profile
- Patient creation

Suggested improvements:

- Standardize environment usage (development vs production) across all services.
- Add centralized HTTP error handling.
- Add stricter form validations and backend-driven error messages.
- Expand unit tests for services and guards.
