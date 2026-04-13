import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
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
  readonly today = new Date().toISOString().split('T')[0];

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService,
    private router: Router
  ) {
    // Crear el formulario de crear paciente
    this.patientForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      nationalId: ['', [Validators.required, Validators.minLength(5)]],
      socialSecurityNumber: ['', [Validators.minLength(5), Validators.maxLength(20)]],
      birthDate: ['', [Validators.required, this.noPastDateValidator()]],
      phone: ['', [Validators.pattern(/^\d{9,}$/), Validators.maxLength(20)]],
      email: ['', [Validators.email, Validators.minLength(5)]],
      address: ['', [Validators.minLength(5)]],
      billingData: ['', [Validators.minLength(5)]],
      healthStatus: ['', [Validators.minLength(3)]],
      familyHistory: ['', [Validators.minLength(3)]],
      lifestyleHabits: ['', [Validators.minLength(3)]],
      medicationAllergies: ['', [Validators.minLength(3)]],
      medicalTreatmentConsent: [false, [Validators.requiredTrue]],
      anesthesiaConsent: [false, [Validators.requiredTrue]],
      hasInfectiousDiseases: [false],
      infectiousDiseases: ['', [Validators.minLength(3)]]
    }, {
      validators: [this.infectiousDiseasesRequiredWhenCheckedValidator()]
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

    const hasInfectiousDiseases = !!this.patientForm.value.hasInfectiousDiseases;
    const infectiousDiseases = (this.patientForm.value.infectiousDiseases ?? '').trim();

    const patientData = {
      ...this.patientForm.value,
      birthDate: this.patientForm.value.birthDate,
      infectiousDiseases: hasInfectiousDiseases ? infectiousDiseases : (infectiousDiseases || 'None'),
      registrationDate: new Date().toISOString()
    };

    this.patientService.createPatient(patientData).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.successMessage.set('Pacient creat correctament');

        // Limpiar el formulario
        this.patientForm.reset();

        // Redirigir al dashboard después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/patients']);
        }, 1500);
      },
      error: (error) => {
        this.isLoading.set(false);

        // Manejar diferentes tipos de errores
        if (error.status === 400) {
          this.errorMessage.set('Dades del pacient invalides. Si us plau, revisa la informacio.');
        } else if (error.status === 409) {
          this.errorMessage.set('El pacient ja existeix al sistema.');
        } else if (error.status === 0) {
          this.errorMessage.set('No es pot connectar amb el servidor');
        } else {
          this.errorMessage.set('Error en crear el pacient. Si us plau, torna-ho a provar.');
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

  hasFormError(error: string): boolean {
    return !!(this.patientForm.hasError(error) && this.patientForm.touched);
  }

  private infectiousDiseasesRequiredWhenCheckedValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const hasInfectiousDiseases = control.get('hasInfectiousDiseases')?.value;
      const infectiousDiseases = control.get('infectiousDiseases')?.value;

      if (hasInfectiousDiseases && !String(infectiousDiseases ?? '').trim()) {
        return { infectiousDiseasesRequired: true };
      }

      return null;
    };
  }

  private noPastDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const selectedDate = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate > today) {
        return { futureDate: true };
      }

      return null;
    };
  }
}
