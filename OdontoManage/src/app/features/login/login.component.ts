import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage = signal<string | null>(null);
  isLoading = signal<boolean>(false);
  returnUrl: string = '/';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Si ya está autenticado, redirigir al dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }

    // Obtener la URL de retorno de los query params
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    // Crear el formulario de login
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const credentials = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.authService.login(credentials).subscribe({
      next: () => {
        // Login exitoso, redirigir a la URL de retorno
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        this.isLoading.set(false);
        
        // Manejar diferentes tipos de errores
        if (error.status === 401) {
          this.errorMessage.set('Email o contraseña incorrectos');
        } else if (error.status === 0) {
          this.errorMessage.set('No se puede conectar al servidor');
        } else {
          this.errorMessage.set('Error al iniciar sesión. Por favor, intenta nuevamente.');
        }
        
        console.error('Login error:', error);
      }
    });
  }

  // Marcar todos los campos como tocados para mostrar errores de validación
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // Helpers para mostrar errores en el template
  hasError(field: string, error: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.hasError(error) && control.touched);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && control.touched);
  }
}