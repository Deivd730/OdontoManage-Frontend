import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Patient, PatientResponse, PatientService } from '../../core/services/patient.service';
import { catchError, forkJoin, map, of } from 'rxjs';
import {
  PROFILE_IMAGE_ALLOWED_MIME_TYPES,
  PROFILE_IMAGE_MAX_SIZE_BYTES,
  formatAllowedImageFormats,
  validateImageFile
} from './image-file.validator';

@Component({
  selector: 'app-patient-read',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './patient-read.html',
  styleUrls: ['./patient-read.css']
})
export class PatientRead implements OnInit {
  private readonly allowedImageMimeTypes = [...PROFILE_IMAGE_ALLOWED_MIME_TYPES];
  private readonly maxProfileImageSizeBytes = PROFILE_IMAGE_MAX_SIZE_BYTES;

  patients = signal<PatientResponse[]>([]);
  selectedPatient = signal<PatientResponse | null>(null);
  searchTerm = signal('');
  isLoading = signal(false);
  isEditing = signal(false);
  errorMessage = signal<string | null>(null);
  deleteConfirm = signal(false);
  imageValidationError = signal<string | null>(null);

  selectedImageFile: File | null = null;

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
        const normalizedPatients = patients.map(patient => ({
          ...patient,
          profile_image_name: this.getPatientProfileImageValue(patient)
        }));

        this.patients.set(normalizedPatients);
        this.hydrateMissingProfileImages(normalizedPatients);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        if (error.status === 0) {
          this.errorMessage.set('No es pot connectar amb el servidor');
        } else {
          this.errorMessage.set('No s\'han pogut carregar els pacients');
        }
      }
    });
  }

  selectPatient(patient: PatientResponse): void {
    this.selectedPatient.set(patient);
    this.isEditing.set(false);
    this.deleteConfirm.set(false);
    this.selectedImageFile = null;
    this.imageValidationError.set(null);
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
      medicationAllergies: patient.medicationAllergies ?? ''
    });
  }

  startEdit(): void {
    if (!this.selectedPatient()) {
      return;
    }
    this.selectedImageFile = null;
    this.imageValidationError.set(null);
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
      profile_image_name: this.getPatientProfileImageValue(selected),
      registrationDate: selected.registrationDate
    };

    const updateRequest = this.selectedImageFile
      ? this.patientService.updatePatientWithProfileImage(selected.id, payload, this.selectedImageFile)
      : this.patientService.updatePatient(selected.id, payload);

    updateRequest.subscribe({
      next: (updatedPatient) => {
        this.patients.set(
          this.patients().map(patient => patient.id === updatedPatient.id ? updatedPatient : patient)
        );
        this.selectedPatient.set(updatedPatient);
        this.selectedImageFile = null;
        this.imageValidationError.set(null);
        this.isEditing.set(false);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        if (error.status === 400) {
          this.errorMessage.set('Dades del pacient invalides. Revisa la informacio.');
        } else if (error.status === 409) {
          this.errorMessage.set('El pacient ja existeix al sistema.');
        } else if (error.status === 0) {
          this.errorMessage.set('No es pot connectar amb el servidor');
        } else {
          this.errorMessage.set('Error en actualitzar el pacient');
        }
      }
    });
  }

  onImageSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const selectedFile = target.files?.item(0) ?? null;

    this.selectedImageFile = null;
    this.imageValidationError.set(null);

    if (!selectedFile) {
      return;
    }

    const validationError = validateImageFile(selectedFile, {
      allowedMimeTypes: this.allowedImageMimeTypes,
      maxSizeBytes: this.maxProfileImageSizeBytes
    });

    if (validationError) {
      this.imageValidationError.set(validationError);
      target.value = '';
      return;
    }

    this.selectedImageFile = selectedFile;
  }

  getSelectedImageFileName(): string {
    return this.selectedImageFile?.name ?? '';
  }

  getAllowedImageFormatsLabel(): string {
    return formatAllowedImageFormats(this.allowedImageMimeTypes);
  }

  getMaxProfileImageSizeInMb(): number {
    return Math.round(this.maxProfileImageSizeBytes / (1024 * 1024));
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
          this.errorMessage.set('No es pot connectar amb el servidor');
        } else {
          this.errorMessage.set('Error en eliminar el pacient');
        }
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

  getPatientImageSrc(patient: PatientResponse): string | null {
    const profileImage = this.getPatientProfileImageValue(patient);
    if (!profileImage) {
      return null;
    }

    if (!this.isValidBase64DataUrl(profileImage)) {
      return null;
    }

    return profileImage;
  }

  private getPatientProfileImageValue(patient: PatientResponse): string {
    const rawPatient = patient as PatientResponse & {
      profile_image?: string;
      profileImage?: string;
      profileImageName?: string;
    };

    const candidateValues = [
      patient.profile_image_name,
      rawPatient.profile_image,
      rawPatient.profileImageName,
      rawPatient.profileImage
    ];

    const firstAvailable = candidateValues.find(
      value => typeof value === 'string' && value.trim().length > 0
    );

    return firstAvailable ? firstAvailable.trim() : '';
  }

  private isValidBase64DataUrl(value: string): boolean {
    const escapedMimeTypes = this.allowedImageMimeTypes.map(mimeType => mimeType.replace('/', '\\/'));
    const mimeTypesPattern = escapedMimeTypes.join('|');
    const regex = new RegExp(`^data:(?:${mimeTypesPattern});base64,[A-Za-z0-9+/]+={0,2}$`);
    return regex.test(value);
  }

  private hydrateMissingProfileImages(patients: PatientResponse[]): void {
    const patientsWithoutImage = patients.filter(patient => !this.getPatientProfileImageValue(patient));
    if (!patientsWithoutImage.length) {
      return;
    }

    const detailRequests = patientsWithoutImage.map(patient =>
      this.patientService.getPatient(patient.id).pipe(
        map(fullPatient => ({
          id: patient.id,
          imageValue: this.getPatientProfileImageValue(fullPatient)
        })),
        catchError(() => of({ id: patient.id, imageValue: '' }))
      )
    );

    forkJoin(detailRequests).subscribe(results => {
      const imageById = new Map(
        results
          .filter(result => result.imageValue && this.isValidBase64DataUrl(result.imageValue))
          .map(result => [result.id, result.imageValue])
      );

      if (!imageById.size) {
        return;
      }

      this.patients.update(currentPatients =>
        currentPatients.map(patient => {
          const hydratedImage = imageById.get(patient.id);
          if (!hydratedImage) {
            return patient;
          }

          return {
            ...patient,
            profile_image_name: hydratedImage
          };
        })
      );

      const selected = this.selectedPatient();
      if (selected) {
        const selectedImage = imageById.get(selected.id);
        if (selectedImage) {
          this.selectedPatient.set({
            ...selected,
            profile_image_name: selectedImage
          });
        }
      }
    });
  }

}
