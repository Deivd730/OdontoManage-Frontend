import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

// Flag para activar/desactivar el mock (cambiar a false cuando el backend funcione)
export const MOCK_ENABLED = false;

// Datos mock
let mockPatients = [
  {
    id: 1,
    firstName: 'Carlos',
    lastName: 'García Martínez',
    nationalId: '12345678A',
    socialSecurityNumber: '281234567890',
    phone: '+34 612 345 678',
    email: 'carlos.garcia@email.com',
    address: 'Calle Mayor 15, 28001 Madrid',
    billingData: 'NIF: 12345678A - Pago: Tarjeta',
    healthStatus: 'Buena salud general. Diabetes tipo 2 controlada.',
    familyHistory: 'Padre con enfermedad periodontal',
    lifestyleHabits: 'No fumador, ejercicio regular',
    medicationAllergies: 'Alergia a la penicilina',
    registrationDate: '2024-01-15'
  },
  {
    id: 2,
    firstName: 'María',
    lastName: 'López Fernández',
    nationalId: '87654321B',
    socialSecurityNumber: '281987654321',
    phone: '+34 623 456 789',
    email: 'maria.lopez@email.com',
    address: 'Avenida de la Constitución 42, 41001 Sevilla',
    billingData: 'NIF: 87654321B - Pago: Transferencia',
    healthStatus: 'Hipertensión controlada con medicación',
    familyHistory: 'Madre con osteoporosis',
    lifestyleHabits: 'Fumadora ocasional',
    medicationAllergies: 'Ninguna conocida',
    registrationDate: '2024-03-22'
  },
  {
    id: 3,
    firstName: 'Juan',
    lastName: 'Rodríguez Sánchez',
    nationalId: '45678912C',
    socialSecurityNumber: '281456789123',
    phone: '+34 634 567 890',
    email: 'juan.rodriguez@email.com',
    address: 'Plaza Catalunya 8, 3º A, 08002 Barcelona',
    billingData: 'NIF: 45678912C - Pago: Efectivo',
    healthStatus: 'Buen estado general',
    familyHistory: 'Sin antecedentes relevantes',
    lifestyleHabits: 'No fumador, deportista',
    medicationAllergies: 'Alergia al ibuprofeno',
    registrationDate: '2024-06-10'
  }
];

let nextPatientId = 4;

// Token JWT mock (puedes decodificarlo en jwt.io para ver el payload)
const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkB0ZXN0LmNvbSIsInVzZXJuYW1lIjoiQWRtaW4iLCJyb2xlcyI6WyJST0xFX0FETUlOIl0sImlhdCI6MTcwOTk5OTk5OSwiZXhwIjoyMDAwMDAwMDAwfQ.6X8VxH_qL3K9Z2YvH4jN8pT5qR3wE1mL7sF9dA2nC8k';

export const MockInterceptor: HttpInterceptorFn = (req, next) => {
  // Si el mock está desactivado, pasar la petición normal
  if (!MOCK_ENABLED) {
    return next(req);
  }

  const { url, method } = req;

  // LOGIN
  if (url.includes('/api/login') && method === 'POST') {
    const body = req.body as { email: string; password: string };
    
    // Simular delay de red
    if (body.email === 'admin@test.com' && body.password === 'password123') {
      return of(new HttpResponse({
        status: 200,
        body: { token: MOCK_TOKEN }
      })).pipe(delay(500));
    } else {
      return throwError(() => new HttpErrorResponse({
        error: { message: 'Credenciales inválidas' },
        status: 401,
        statusText: 'Unauthorized'
      })).pipe(delay(500));
    }
  }

  // GET /api/patients - Listar todos los pacientes
  if (url.includes('/api/patients') && method === 'GET' && !url.match(/\/api\/patients\/\d+$/)) {
    return of(new HttpResponse({
      status: 200,
      body: mockPatients
    })).pipe(delay(300));
  }

  // GET /api/patients/:id - Obtener un paciente
  if (url.match(/\/api\/patients\/\d+$/) && method === 'GET') {
    const id = parseInt(url.split('/').pop() || '0');
    const patient = mockPatients.find(p => p.id === id);
    
    if (patient) {
      return of(new HttpResponse({
        status: 200,
        body: patient
      })).pipe(delay(300));
    } else {
      return throwError(() => new HttpErrorResponse({
        error: { message: 'Paciente no encontrado' },
        status: 404,
        statusText: 'Not Found'
      })).pipe(delay(300));
    }
  }

  // POST /api/patients - Crear paciente
  if (url.includes('/api/patients') && method === 'POST') {
    const newPatient = {
      id: nextPatientId++,
      ...(req.body as any)
    };
    mockPatients.push(newPatient);
    
    return of(new HttpResponse({
      status: 201,
      body: newPatient
    })).pipe(delay(500));
  }

  // PUT /api/patients/:id - Actualizar paciente
  if (url.match(/\/api\/patients\/\d+$/) && method === 'PUT') {
    const id = parseInt(url.split('/').pop() || '0');
    const index = mockPatients.findIndex(p => p.id === id);
    
    if (index !== -1) {
      mockPatients[index] = {
        id,
        ...(req.body as any)
      };
      
      return of(new HttpResponse({
        status: 200,
        body: mockPatients[index]
      })).pipe(delay(500));
    } else {
      return throwError(() => new HttpErrorResponse({
        error: { message: 'Paciente no encontrado' },
        status: 404,
        statusText: 'Not Found'
      })).pipe(delay(500));
    }
  }

  // DELETE /api/patients/:id - Eliminar paciente
  if (url.match(/\/api\/patients\/\d+$/) && method === 'DELETE') {
    const id = parseInt(url.split('/').pop() || '0');
    const index = mockPatients.findIndex(p => p.id === id);
    
    if (index !== -1) {
      mockPatients.splice(index, 1);
      
      return of(new HttpResponse({
        status: 204,
        body: null
      })).pipe(delay(500));
    } else {
      return throwError(() => new HttpErrorResponse({
        error: { message: 'Paciente no encontrado' },
        status: 404,
        statusText: 'Not Found'
      })).pipe(delay(500));
    }
  }

  // Si no coincide con ninguna ruta mock, pasar al siguiente interceptor
  return next(req);
};
