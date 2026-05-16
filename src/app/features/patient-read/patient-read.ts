import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import flatpickr from 'flatpickr';
import { Catalan } from 'flatpickr/dist/l10n/cat';
import { Patient, PatientResponse, PatientService } from '../../core/services/patient.service';
import { buildApiUrl } from '../../core/utils/url';
import {
  PROFILE_IMAGE_ALLOWED_MIME_TYPES,
  PROFILE_IMAGE_MAX_SIZE_BYTES,
  formatAllowedImageFormats,
  validateImageFile,
} from './image-file.validator';

@Component({
  selector: 'app-patient-read',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './patient-read.html',
  styleUrls: ['./patient-read.css'],
})
export class PatientRead implements OnInit, OnDestroy {
  @ViewChild('birthDateShell') private readonly birthDateShell?: ElementRef<HTMLDivElement>;

  private readonly allowedImageMimeTypes = [...PROFILE_IMAGE_ALLOWED_MIME_TYPES];
  private readonly maxProfileImageSizeBytes = PROFILE_IMAGE_MAX_SIZE_BYTES;
  private readonly defaultProfileImage = 'assets/default-profile.svg';
  private readonly profileImageBaseUrl = buildApiUrl('/images/profiles');

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

  private birthDatePickerInstance?: flatpickr.Instance;

  filteredPatients = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) {
      return this.patients();
    }

    return this.patients().filter((patient) => {
      const haystack = `${patient.firstName} ${patient.lastName} ${patient.nationalId}`.toLowerCase();
      return haystack.includes(term);
    });
  });

  constructor(
    private patientService: PatientService,
    private fb: FormBuilder,
    private router: Router,
  ) {
    this.editForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      nationalId: ['', [Validators.required, Validators.minLength(5)]],
      birthDate: ['', [Validators.required, this.noFutureDateValidator()]],
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

  ngOnDestroy(): void {
    this.destroyBirthDatePicker();
  }

  loadPatients(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.patientService.getPatients().subscribe({
      next: (patients) => {
        const normalizedPatients = patients.map((patient) => ({
          ...patient,
          profileImageName: this.getPatientProfileImageValue(patient),
        }));

        this.patients.set(normalizedPatients);
        this.ensureSelectedPatient(normalizedPatients);
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
      },
    });
  }

  selectPatient(patient: PatientResponse): void {
    this.selectedPatient.set(patient);
    this.isEditing.set(false);
    this.deleteConfirm.set(false);
    this.destroyBirthDatePicker();
    this.selectedImageFile = null;
    this.imageValidationError.set(null);
    this.editForm.reset();
    this.editForm.patchValue({
      firstName: patient.firstName,
      lastName: patient.lastName,
      nationalId: patient.nationalId,
      birthDate: this.toBirthDateInput(patient.birthDate),
      socialSecurityNumber: patient.socialSecurityNumber ?? '',
      phone: patient.phone ?? '',
      email: patient.email ?? '',
      address: patient.address ?? '',
      billingData: patient.billingData ?? '',
      healthStatus: patient.healthStatus ?? '',
      familyHistory: patient.familyHistory ?? '',
      lifestyleHabits: patient.lifestyleHabits ?? '',
      medicationAllergies: patient.medicationAllergies ?? '',
    });
  }

  startEdit(): void {
    if (!this.selectedPatient()) {
      return;
    }

    this.selectedImageFile = null;
    this.imageValidationError.set(null);
    this.isEditing.set(true);
    queueMicrotask(() => this.initBirthDatePicker());
  }

  cancelEdit(): void {
    const selected = this.selectedPatient();
    if (selected) {
      this.selectPatient(selected);
    }
    this.isEditing.set(false);
    this.destroyBirthDatePicker();
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

    const hasInfectiousDiseases = selected.hasInfectiousDiseases ?? false;
    const infectiousDiseases = selected.infectiousDiseases?.trim() || 'None';

    const payload: Patient = {
      ...this.editForm.value,
      birthDate: this.toApiBirthDate(this.editForm.value.birthDate),
      medicalTreatmentConsent: selected.medicalTreatmentConsent ?? false,
      anesthesiaConsent: selected.anesthesiaConsent ?? false,
      hasInfectiousDiseases,
      infectiousDiseases,
      registrationDate: selected.registrationDate,
    };

    const updateRequest = this.selectedImageFile
      ? this.patientService.updatePatientWithProfileImage(selected.id, payload, this.selectedImageFile)
      : this.patientService.updatePatient(selected.id, payload);

    updateRequest.subscribe({
      next: (updatedPatient) => {
        this.patients.set(
          this.patients().map((patient) => (patient.id === updatedPatient.id ? updatedPatient : patient)),
        );
        this.selectedPatient.set(updatedPatient);
        this.selectedImageFile = null;
        this.imageValidationError.set(null);
        this.isEditing.set(false);
        this.destroyBirthDatePicker();
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        if (error.status === 400) {
          this.errorMessage.set('Dades del pacient invalides. Revisa la informació.');
        } else if (error.status === 409) {
          this.errorMessage.set('El pacient ja existeix al sistema.');
        } else if (error.status === 0) {
          this.errorMessage.set('No es pot connectar amb el servidor');
        } else {
          this.errorMessage.set('Error en actualitzar el pacient');
        }
      },
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
      maxSizeBytes: this.maxProfileImageSizeBytes,
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
        const remainingPatients = this.patients().filter((patient) => patient.id !== selected.id);
        this.patients.set(remainingPatients);
        this.ensureSelectedPatient(remainingPatients);
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
      },
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

  formatBirthDateDisplay(value?: string): string {
    const parsedDate = this.parseApiBirthDate(value);
    return parsedDate
      ? parsedDate.toLocaleDateString('ca-ES', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'No registrada';
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      formGroup.get(key)?.markAsTouched();
    });
  }

  getPatientImageSrc(patient: PatientResponse): string | null {
    const profileImageValue = this.getPatientProfileImageValue(patient);
    if (!profileImageValue) {
      return null;
    }

    if (this.isValidBase64DataUrl(profileImageValue)) {
      return profileImageValue;
    }

    if (/^https?:\/\//i.test(profileImageValue)) {
      return profileImageValue;
    }

    if (profileImageValue.startsWith('/images/profiles/')) {
      return buildApiUrl(profileImageValue);
    }

    if (profileImageValue.startsWith('images/profiles/')) {
      return buildApiUrl(profileImageValue);
    }

    return `${this.profileImageBaseUrl}/${encodeURIComponent(profileImageValue)}`;
  }

  getPatientAvatarSrc(patient: PatientResponse): string {
    return this.getPatientImageSrc(patient) ?? this.defaultProfileImage;
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (!img) return;
    img.onerror = null;
    img.src = this.defaultProfileImage;
  }

  private getPatientProfileImageValue(patient: PatientResponse): string {
    const rawPatient = patient as PatientResponse & {
      profile_image_name?: string;
      profile_image?: string;
      profileImage?: string;
      profileImageName?: string;
    };

    const candidateValues = [
      patient.profileImageName,
      rawPatient.profile_image_name,
      rawPatient.profile_image,
      rawPatient.profileImageName,
      rawPatient.profileImage,
    ];

    const firstAvailable = candidateValues.find((value) => typeof value === 'string' && value.trim().length > 0);

    return firstAvailable ? firstAvailable.trim() : '';
  }

  private isValidBase64DataUrl(value: string): boolean {
    const escapedMimeTypes = this.allowedImageMimeTypes.map((mimeType) => mimeType.replace('/', '\\/'));
    const mimeTypesPattern = escapedMimeTypes.join('|');
    const regex = new RegExp(`^data:(?:${mimeTypesPattern});base64,[A-Za-z0-9+/]+={0,2}$`);
    return regex.test(value);
  }

  private hydrateMissingProfileImages(patients: PatientResponse[]): void {
    const patientsWithoutImage = patients.filter((patient) => !this.getPatientProfileImageValue(patient));
    if (!patientsWithoutImage.length) {
      return;
    }

    const detailRequests = patientsWithoutImage.map((patient) =>
      this.patientService.getPatient(patient.id).pipe(
        map((fullPatient) => ({
          id: patient.id,
          imageValue: this.getPatientProfileImageValue(fullPatient),
        })),
        catchError(() => of({ id: patient.id, imageValue: '' })),
      ),
    );

    forkJoin(detailRequests).subscribe((results) => {
      const imageById = new Map(
        results
          .filter((result) => result.imageValue && this.isValidBase64DataUrl(result.imageValue))
          .map((result) => [result.id, result.imageValue]),
      );

      if (!imageById.size) {
        return;
      }

      this.patients.update((currentPatients) =>
        currentPatients.map((patient) => {
          const hydratedImage = imageById.get(patient.id);
          if (!hydratedImage) {
            return patient;
          }

          return {
            ...patient,
            profileImageName: hydratedImage,
          };
        }),
      );

      const selected = this.selectedPatient();
      if (selected) {
        const selectedImage = imageById.get(selected.id);
        if (selectedImage) {
          this.selectedPatient.set({
            ...selected,
            profileImageName: selectedImage,
          });
        }
      }
    });
  }

  private initBirthDatePicker(): void {
    if (!this.birthDateShell) {
      return;
    }

    this.destroyBirthDatePicker();

    this.birthDatePickerInstance = flatpickr(this.birthDateShell.nativeElement, {
      wrap: true,
      dateFormat: 'd/m/Y',
      allowInput: true,
      clickOpens: true,
      disableMobile: true,
      locale: Catalan,
      defaultDate: this.editForm.controls['birthDate'].value || undefined,
      onChange: (_, selectedDateString, instance) => {
        if (!selectedDateString) {
          return;
        }

        const parsedDate = instance.parseDate(selectedDateString, 'd/m/Y');
        if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
          return;
        }

        this.editForm.controls['birthDate'].setValue(this.formatBirthDateForForm(parsedDate));
      },
      onClose: (_, dateStr, instance) => {
        if (!dateStr) {
          return;
        }

        const parsedDate = instance.parseDate(dateStr, 'd/m/Y');
        if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
          return;
        }

        this.editForm.controls['birthDate'].setValue(this.formatBirthDateForForm(parsedDate));
      },
    });
  }

  private destroyBirthDatePicker(): void {
    this.birthDatePickerInstance?.destroy();
    this.birthDatePickerInstance = undefined;
  }

  private noFutureDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const parsedDate = this.parseBirthDate(control.value);
      if (!parsedDate) {
        return null;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      parsedDate.setHours(0, 0, 0, 0);

      if (parsedDate > today) {
        return { futureDate: true };
      }

      return null;
    };
  }

  private parseBirthDate(value?: string): Date | null {
    if (!value) {
      return null;
    }

    const parts = value.split('/').map((part) => Number(part));
    if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
      return null;
    }

    const [day, month, year] = parts;
    const parsedDate = new Date(year, month - 1, day);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  private formatBirthDateForForm(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  private toBirthDateInput(value?: string): string {
    const parsedDate = this.parseApiBirthDate(value);
    if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
      return '';
    }

    return this.formatBirthDateForForm(parsedDate);
  }

  private parseApiBirthDate(value?: string): Date | null {
    if (!value) {
      return null;
    }

    const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateOnlyMatch) {
      const [, yearString, monthString, dayString] = dateOnlyMatch;
      const parsedDate = new Date(Number(yearString), Number(monthString) - 1, Number(dayString));
      return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
    }

    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  private toApiBirthDate(value?: string): string | undefined {
    const parsedDate = this.parseBirthDate(value);
    if (!parsedDate) {
      return value;
    }

    return parsedDate.toISOString().split('T')[0];
  }

  private ensureSelectedPatient(patients: PatientResponse[]): void {
    if (!patients.length) {
      this.selectedPatient.set(null);
      return;
    }

    const currentSelectedId = this.selectedPatient()?.id;
    const currentSelectedPatient = currentSelectedId
      ? patients.find((patient) => patient.id === currentSelectedId)
      : null;

    this.selectPatient(currentSelectedPatient ?? patients[0]);
  }
}
