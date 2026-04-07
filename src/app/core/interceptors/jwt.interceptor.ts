import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const JwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  const isLoginRequest = req.url.includes('/api/login');
  const isRegisterRequest = req.url.includes('/api/users/register');
  const isPublicAuthRequest = isLoginRequest || isRegisterRequest;

  if (token && !isPublicAuthRequest) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isPublicAuthRequest) {
        authService.logout('unauthorized');
      }

      return throwError(() => error);
    })
  );
};
