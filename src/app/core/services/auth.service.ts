import { Injectable, signal } from '@angular/core'; // Añadido signal
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment.development';

interface LoginResponse {
  token: string;
  refresh_token?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface UserData {
  id?: number;
  username?: string;
  email?: string;
  name?: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = environment.tokenKey;
  private refreshTokenKey = environment.refreshTokenKey;
  private jwtHelper = new JwtHelperService();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  public currentUser = signal<UserData | null>(this.getDecodedToken());

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  /**
   * Realiza el login del usuario con Symfony/Lexik JWT
   */
  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/api/login`, credentials).pipe(
      tap(response => {
        if (response.token) {
          this.setToken(response.token);
          if (response.refresh_token) {
            this.setRefreshToken(response.refresh_token);
          }

          // ACTUALIZACIÓN DE ESTADOS
          this.isAuthenticatedSubject.next(true);
          this.currentUser.set(this.getDecodedToken()); // Actualizamos el signal al loguear
        }
      })
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/users/register`, userData);
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): void {
    this.removeToken();
    this.removeRefreshToken();

    // ACTUALIZACIÓN DE ESTADOS
    this.isAuthenticatedSubject.next(false);
    this.currentUser.set(null); // Limpiamos el signal al cerrar sesión

    this.router.navigate(['/login']);
  }

  /**
   * Obtiene el token almacenado
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  private removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  private setRefreshToken(token: string): void {
    localStorage.setItem(this.refreshTokenKey, token);
  }

  private removeRefreshToken(): void {
    localStorage.removeItem(this.refreshTokenKey);
  }

  isAuthenticated(): boolean {
    return this.hasValidToken();
  }

  private hasValidToken(): boolean {
    const token = this.getToken();
    return token != null && !this.jwtHelper.isTokenExpired(token);
  }

  /**
   * Obtiene los datos decodificados del token
   */
  getDecodedToken(): UserData | null {
    const token = this.getToken();
    try {
      if (token && !this.jwtHelper.isTokenExpired(token)) {
        return this.jwtHelper.decodeToken(token) as UserData;
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  /**
   * Obtiene el usuario actual desde el token (Mantenido por compatibilidad)
   */


  getCurrentUser(): UserData | null {
    return this.getDecodedToken();
  }

  getUserId(): number | null {
    const user = this.getDecodedToken();
    return user?.id || null;
  }

  getUserRoles(): string[] {
    const user = this.getCurrentUser();
    return user?.roles || [];
  }

  hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    const userRoles = this.getUserRoles();
    return roles.some(role => userRoles.includes(role));
  }

  hasAllRoles(roles: string[]): boolean {
    const userRoles = this.getUserRoles();
    return roles.every(role => userRoles.includes(role));
  }

  getUsername(): string | null {
    const user = this.getCurrentUser();
    return user?.username || user?.email || null;
  }

  updateCurrentUser(data: Partial<UserData>): void {
    const current = this.currentUser();
    if (current) {
      this.currentUser.set({ ...current, ...data });
    }
  }

}