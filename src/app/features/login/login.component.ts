import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { OdontoLoader } from '../../core/services/odonto-loader';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  showReadOnlyNotice = false;
  loginForm: FormGroup;
  errorMessage = signal<string | null>(null);
  isLoading = signal<boolean>(false);
  returnUrl: string = '/';
  private loader = new OdontoLoader();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    if (this.route.snapshot.queryParams['sessionExpired'] === '1') {
      this.errorMessage.set('La sessió ha expirat. Inicia la sessió de nou.');
    }

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    try {
      if (!localStorage.getItem('seen_readonly_notice')) {
        this.showReadOnlyNotice = true;
      }
    } catch (error) {
      console.warn('No es pot llegir localStorage per al missatge de només lectura', error);
    }
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
        this.loader.hide();
        this.isLoading.set(false);
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        this.loader.hide();
        this.isLoading.set(false);

        if (error.status === 401) {
          this.errorMessage.set('El correu electrònic o la contrasenya no són correctes.');
        } else if (error.status === 0) {
          this.errorMessage.set('No es pot connectar amb el servidor');
        } else {
          this.errorMessage.set('S\'ha produït un error en iniciar la sessió. Si us plau, torna-ho a provar.');
        }

        console.error('Login error:', error);
      }
    });

    this.loader.show();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  hasError(field: string, error: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.hasError(error) && control.touched);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  acceptReadOnlyNotice(): void {
    try {
      localStorage.setItem('seen_readonly_notice', '1');
    } catch (error) {
      console.warn('No es pot desar el missatge de només lectura a localStorage', error);
    }

    this.showReadOnlyNotice = false;
  }
}
