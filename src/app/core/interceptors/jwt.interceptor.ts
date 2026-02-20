import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const JwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Obtener el token del servicio de autenticación
  const token = authService.getToken();

  // No agregar el token a las peticiones de login
  const isLoginRequest = req.url.includes('/api/login');

  // Si existe el token y no es una petición de login, clonar la petición y agregar el header de autorización
  if (token && !isLoginRequest) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Continuar con la petición y manejar errores
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isLoginRequest) {
        // Token inválido o expirado
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
