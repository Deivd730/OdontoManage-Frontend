import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Patient, PatientResponse, PatientService } from '../../core/services/patient.service';

@Component({
  selector: 'app-patient-read',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './patient-read.html',
  styleUrls: ['./patient-read.css']
})
export class PatientRead implements OnInit {
  patients = signal<PatientResponse[]>([]);
  selectedPatient = signal<PatientResponse | null>(null);
  searchTerm = signal('');
  isLoading = signal(false);
  isEditing = signal(false);
  errorMessage = signal<string | null>(null);
  deleteConfirm = signal(false);

  editForm: FormGroup;

  filteredPatients = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) {
      return this.patients();
    }
    return this.patients().filter(patient => {
      const haystack = `${patient.firstName} ${patient.lastName} ${patient.nationalId}`.toLowerCase();
      return haystack.includes(term);
    });
  });

  constructor(
    private patientService: PatientService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.editForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      nationalId: ['', [Validators.required, Validators.minLength(5)]],
      socialSecurityNumber: [''],
      phone: ['', [Validators.pattern(/^\d{9,}$/)]],
      email: ['', [Validators.email]],
      address: [''],
      billingData: [''],
      healthStatus: [''],
      familyHistory: [''],
      lifestyleHabits: [''],
      medicationAllergies: [''],
      profile_image_name: ['']
    });
  }

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.patientService.getPatients().subscribe({
      next: (patients) => {
        this.patients.set(patients);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        if (error.status === 0) {
          this.errorMessage.set('No se puede conectar al servidor');
        } else {
          this.errorMessage.set('No se pudieron cargar los pacientes');
        }
        console.error('Patients load error:', error);
      }
    });
  }

  selectPatient(patient: PatientResponse): void {
    this.selectedPatient.set(patient);
    this.isEditing.set(false);
    this.deleteConfirm.set(false);
    this.editForm.reset();
    this.editForm.patchValue({
      firstName: patient.firstName,
      lastName: patient.lastName,
      nationalId: patient.nationalId,
      socialSecurityNumber: patient.socialSecurityNumber ?? '',
      phone: patient.phone ?? '',
      email: patient.email ?? '',
      address: patient.address ?? '',
      billingData: patient.billingData ?? '',
      healthStatus: patient.healthStatus ?? '',
      familyHistory: patient.familyHistory ?? '',
      lifestyleHabits: patient.lifestyleHabits ?? '',
      medicationAllergies: patient.medicationAllergies ?? '',
      profile_image_name: patient.profile_image_name ?? ''
    });
  }

  startEdit(): void {
    if (!this.selectedPatient()) {
      return;
    }
    this.isEditing.set(true);
  }

  cancelEdit(): void {
    const selected = this.selectedPatient();
    if (selected) {
      this.selectPatient(selected);
    }
    this.isEditing.set(false);
  }

  requestDelete(): void {
    if (!this.selectedPatient()) {
      return;
    }
    this.deleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.deleteConfirm.set(false);
  }

  confirmDelete(): void {
    this.deleteConfirm.set(false);
    this.deletePatient();
  }

  saveEdit(): void {
    const selected = this.selectedPatient();
    if (!selected) {
      return;
    }
    if (this.editForm.invalid) {
      this.markFormGroupTouched(this.editForm);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const payload: Patient = {
      ...this.editForm.value,
      registrationDate: selected.registrationDate
    };

    this.patientService.updatePatient(selected.id, payload).subscribe({
      next: (updatedPatient) => {
        this.patients.set(
          this.patients().map(patient => patient.id === updatedPatient.id ? updatedPatient : patient)
        );
        this.selectedPatient.set(updatedPatient);
        this.isEditing.set(false);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        if (error.status === 400) {
          this.errorMessage.set('Datos del paciente invalidos. Verifica la informacion.');
        } else if (error.status === 409) {
          this.errorMessage.set('El paciente ya existe en el sistema.');
        } else if (error.status === 0) {
          this.errorMessage.set('No se puede conectar al servidor');
        } else {
          this.errorMessage.set('Error al actualizar el paciente');
        }
        console.error('Patient update error:', error);
      }
    });
  }

  deletePatient(): void {
    const selected = this.selectedPatient();
    if (!selected) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.patientService.deletePatient(selected.id).subscribe({
      next: () => {
        this.patients.set(this.patients().filter(patient => patient.id !== selected.id));
        this.selectedPatient.set(null);
        this.isEditing.set(false);
        this.deleteConfirm.set(false);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        if (error.status === 0) {
          this.errorMessage.set('No se puede conectar al servidor');
        } else {
          this.errorMessage.set('Error al eliminar el paciente');
        }
        console.error('Patient delete error:', error);
      }
    });
  }

  goToCreate(): void {
    this.router.navigate(['/patients/create']);
  }

  updateSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  getPatientImageSrc(patient: PatientResponse): string | null {
    return this.normalizeBase64Image(patient.profile_image_name);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.editForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  hasError(field: string, error: string): boolean {
    const control = this.editForm.get(field);
    return !!(control && control.hasError(error) && control.touched);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }

  private normalizeBase64Image(imageData?: string): string | null {
    if (!imageData) {
      return null;
    }

    const normalized = imageData
      .trim()
      .replace(/^['"]|['"]$/g, '')
      .replace(/\s+/g, '');

    if (!normalized) {
      return null;
    }

    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
      return normalized;
    }

    if (normalized.startsWith('data:')) {
      return normalized;
    }

    const mimeType = normalized.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
    return `data:${mimeType};base64,${normalized}`;
  }
}
