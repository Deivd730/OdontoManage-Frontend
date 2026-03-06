import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const JwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  console.log('--- Interceptando Petición ---');
  console.log('URL:', req.url);
  console.log('Token encontrado:', !!token); // Debería salir 'true'

  const isLoginRequest = req.url.includes('/api/login');

  if (token && !isLoginRequest) {
    console.log('Añadiendo cabecera Authorization...');
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  return next(req).pipe( /* ... resto del código ... */);
}
