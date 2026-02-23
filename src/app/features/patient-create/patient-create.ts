import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PatientService } from '../../core/services/patient.service';

@Component({
  selector: 'app-patient-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './patient-create.html',
  styleUrls: ['./patient-create.css']
})
export class PatientCreate {
  patientForm: FormGroup;
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  isLoading = signal<boolean>(false);

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService,
    private router: Router
  ) {
    // Crear el formulario de crear paciente
    this.patientForm = this.fb.group({
      first_name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required, Validators.minLength(2)]],
      national_id: ['', [Validators.required]],
      social_security_number: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{9,}$/)]],
      email: ['', [Validators.required, Validators.email]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      billing_data: ['', [Validators.required]],
      health_status: ['', [Validators.required]],
      family_history: [''],
      lifestyle_habits: [''],
      medication_allergies: ['']
    });
  }

  onSubmit(): void {
    if (this.patientForm.invalid) {
      this.markFormGroupTouched(this.patientForm);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const patientData = {
      ...this.patientForm.value,
      registration_date: new Date().toISOString().split('T')[0]
    };

    this.patientService.createPatient(patientData).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.successMessage.set('Paciente creado exitosamente');
        
        // Limpiar el formulario
        this.patientForm.reset();
        
        // Redirigir al dashboard después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading.set(false);
        
        // Manejar diferentes tipos de errores
        if (error.status === 400) {
          this.errorMessage.set('Datos del paciente inválidos. Por favor, verifica la información.');
        } else if (error.status === 409) {
          this.errorMessage.set('El paciente ya existe en el sistema.');
        } else if (error.status === 0) {
          this.errorMessage.set('No se puede conectar al servidor');
        } else {
          this.errorMessage.set('Error al crear el paciente. Por favor, intenta nuevamente.');
        }
        
        console.error('Patient creation error:', error);
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
    const control = this.patientForm.get(field);
    return !!(control && control.hasError(error) && control.touched);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.patientForm.get(field);
    return !!(control && control.invalid && control.touched);
  }
}
