# OdontoManage Frontend

**Modern Angular application for comprehensive dental management** - Appointments, patients, documents and odontograms.

## 🚀 Quick Start

### 1. Installation
```bash
git clone https://github.com/Deivd730/OdontoManage-Frontend.git
cd OdontoManage-Frontend
npm install
```

### 2. Configuration
Edit the configuration file according to your environment:
```typescript
// src/environments/environment.development.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',  // Your Symfony backend URL
  tokenKey: 'auth_token',
  refreshTokenKey: 'refresh_token'
};
```

### 3. Run
```bash
ng serve
```
Open your browser at: **http://localhost:4200**

---

## 📦 Tech Stack

| Technology | Version | Purpose |
|-----------|---------|----------|
| Angular | 21.2.9 | Main framework |
| TypeScript | 5.9.2 | Typed language |
| RxJS | 7.8.0 | Reactive programming |
| Angular Material | 21.2.0 | UI components |
| @auth0/angular-jwt | 5.2.0 | JWT authentication |
| Flatpickr | 4.6.13 | Date picker |

---

## 🎯 Main Features

### 👥 Patient Management
- **Full listing** with search and filtering
- **Create/Edit** patients with validation
- **Detailed profile** and patient history
- **Associated documents** (X-rays, etc.)

### 📋 Medical Appointments
- **Schedule appointments** with dentist
- **Integrated calendar** of availability
- **History** of past appointments
- **Reminder notifications**

### 🦷 Digital Odontogram
- **2D visualization** of dental pieces
- **Record of treatments and pathologies**
- **Visual history** of changes

### 🔐 Secure Authentication
- **Login/Registration** with JWT
- **Route protection** based on roles
- **Auto-renewal** of tokens
- **Secure logout**

---

## 📁 Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── guards/
│   │   │   ├── auth.guard.ts         # Protects authenticated routes
│   │   │   └── guest.guard.ts        # Protects public routes
│   │   ├── interceptors/
│   │   │   ├── jwt.interceptor.ts    # Injects JWT token automatically
│   │   │   └── mock.interceptor.ts   # Mock for development
│   │   └── services/
│   │       ├── auth.service.ts       # Authentication management
│   │       ├── patient.service.ts    # Patient CRUD
│   │       ├── appointment.service.ts # Appointment management
│   │       ├── odontogram.service.ts # Odontogram data
│   │       ├── document.service.ts   # Document management
│   │       └── notification.service.ts # Notification system
│   │
│   ├── features/
│   │   ├── login/                    # Authentication page
│   │   ├── register/                 # Registration page
│   │   ├── home/                     # Main dashboard
│   │   ├── mainlayout/               # Layout with navbar
│   │   ├── navbar/                   # Navigation bar
│   │   ├── patient-list/             # Patient listing
│   │   ├── patient-read/             # Patient profile
│   │   ├── patient-create/           # Create patient
│   │   ├── appointment/              # Appointment management
│   │   ├── odontogram/               # Odontogram viewer
│   │   ├── document/                 # Document management
│   │   └── profile/                  # User profile
│   │
│   ├── models/
│   │   └── odontogram.ts             # Data models
│   │
│   ├── app.routes.ts                 # Routes configuration
│   ├── app.config.ts                 # Global configuration
│   └── app.ts                        # Root component
│
├── environments/
│   ├── environment.ts                # Production
│   └── environment.development.ts    # Development
│
├── index.html
├── main.ts
├── styles.css
└── material-theme.scss
```

---

## 🛣️ Application Routes

### Public (no authentication required)
- `/login` - Login form
- `/register` - Registration form

### Protected (authentication required)
- `/home` - Main dashboard
- `/patients` - Patient listing
- `/patients/create` - Create new patient
- `/patients/:id` - Patient profile
- `/appointments` - Appointment management
- `/odontogram` - Digital odontogram
- `/documents` - Document manager
- `/profile` - Logged-in user profile

---

## 💻 Available Commands

```bash
# Development
ng serve               # Starts development server (port 4200)
ng build --watch       # Build in watch mode
ng test                # Runs tests with Vitest

# Production
ng build --prod        # Build for production (dist/)
```

---

## 🔧 Advanced Configuration

### Environment Variables
```typescript
// src/environments/environment.development.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',      // Backend URL
  tokenKey: 'auth_token',                   // localStorage key for token
  refreshTokenKey: 'refresh_token'          // Key for refresh token
};
```

### JWT Interceptor
Automatically adds the JWT token to all HTTP requests:
```typescript
// src/app/core/interceptors/jwt.interceptor.ts
```

---

## 🚨 Troubleshooting

### Module errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Port 4200 in use
```bash
npm start -- --port 4201
```

### Clear npm cache
```bash
npm cache clean --force
npm install
```

### Expired token
Tokens are automatically renewed. If problems persist:
- Verify that the backend is running on `http://localhost:8000`
- Clear localStorage and login again

---

## 🔐 System Requirements

- **Node.js** 20+
- **npm** 10+
- **Backend API** (Symfony) on `http://localhost:8000`
- **Modern browser** (Chrome, Firefox, Safari, Edge)

---

## 📝 Important Notes

- The frontend assumes the Symfony backend is running on `http://localhost:8000`
- JWT tokens are stored in `localStorage`
- Protected routes redirect to login if there's no authentication
- Unauthenticated users cannot access private routes

---

## 🤝 Contributing

To contribute to the project:
1. Create a branch for your feature: `git checkout -b feature/name`
2. Commit your changes: `git commit -am 'Add feature'`
3. Push to the branch: `git push origin feature/name`
4. Open a Pull Request
