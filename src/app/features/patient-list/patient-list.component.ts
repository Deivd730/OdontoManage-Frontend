import { Component, OnInit, inject, signal, computed, output, input } from '@angular/core';
import { PatientService, PatientResponse } from '@services/patient.service';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  templateUrl: './patient-list.component.html',
  styleUrl: './patient-list.component.css'
})
export class PatientListComponent implements OnInit {
  private patientService = inject(PatientService);
  private readonly defaultProfileImage = 'assets/default-profile.svg';
  private readonly profileImageBaseUrl = `${environment.apiUrl}/images/profiles`;

  selectedPatientId = input<number | null>(null);
  selectPatient = output<PatientResponse>();

  allPatients = signal<PatientResponse[]>([]);
  searchTerm = signal('');
  isLoading = signal(false);

  filteredPatients = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.allPatients();
    return this.allPatients().filter(p =>
      `${p.firstName} ${p.lastName} ${p.nationalId}`.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.isLoading.set(true);
    this.patientService.getPatients().subscribe({
      next: (data) => {
        this.allPatients.set(data);
        this.ensureSelectedPatient(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  updateSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  getPatientImageSrc(patient: PatientResponse): string | null {
    const raw = patient as PatientResponse & {
      profile_image_name?: string;
      profile_image?: string;
      profileImage?: string;
      profileImageName?: string;
    };

    const value =
      patient.profileImageName ??
      raw.profile_image_name ??
      raw.profile_image ??
      raw.profileImageName ??
      raw.profileImage ??
      '';

    if (!value || value.trim() === '') return null;
    const normalizedValue = value.trim();

    const escaped = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      .map((mime) => mime.replace('/', '\\/'));
    const base64Regex = new RegExp(`^data:(?:${escaped.join('|')});base64,[A-Za-z0-9+/]+=*$`);
    if (base64Regex.test(normalizedValue)) {
      return normalizedValue;
    }

    if (/^https?:\/\//i.test(normalizedValue)) {
      return normalizedValue;
    }

    if (normalizedValue.startsWith('/images/profiles/')) {
      return `${environment.apiUrl}${normalizedValue}`;
    }

    if (normalizedValue.startsWith('images/profiles/')) {
      return `${environment.apiUrl}/${normalizedValue}`;
    }

    return `${this.profileImageBaseUrl}/${encodeURIComponent(normalizedValue)}`;
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

  private ensureSelectedPatient(patients: PatientResponse[]): void {
    if (!patients.length) {
      return;
    }

    const selectedId = this.selectedPatientId();
    const hasValidSelection = selectedId !== null && patients.some(patient => patient.id === selectedId);
    if (!hasValidSelection) {
      this.selectPatient.emit(patients[0]);
    }
  }
}
