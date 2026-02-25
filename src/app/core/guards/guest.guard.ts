import { inject } from '@angular/core';
import { 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  UrlTree,
  Router,
  CanActivateFn
} from '@angular/router';
import { AuthService } from '../services/auth.service';

export const GuestGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // LÓGICA INVERSA:
  if (authService.isAuthenticated()) {
    // Si YA está autenticado, no lo dejamos estar en login/register
    // Lo mandamos al home
    return router.createUrlTree(['/home']);
  }

  // Si NO está autenticado, lo dejamos pasar (para que se loguee o registre)
  return true;
};