import { Component, OnInit, inject, signal, computed, output, input } from '@angular/core';
import { PatientService, PatientResponse } from '@services/patient.service';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  templateUrl: './patient-list.component.html',
  styleUrl: './patient-list.component.css'
})
export class PatientListComponent implements OnInit {
  private patientService = inject(PatientService);
  private readonly defaultProfileImage = 'assets/default-profile.svg';

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

  // ✅ NUEVO: mismo método que usa patient-read
  getPatientImageSrc(patient: PatientResponse): string | null {
    const raw = patient as PatientResponse & {
      profile_image?: string;
      profileImage?: string;
      profileImageName?: string;
    };

    const value =
      patient.profile_image_name ??
      raw.profile_image ??
      raw.profileImageName ??
      raw.profileImage ??
      '';

    if (!value || value.trim() === '') return null;

    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const escaped = allowedMimes.map(m => m.replace('/', '\\/'));
    const regex = new RegExp(`^data:(?:${escaped.join('|')});base64,[A-Za-z0-9+/]+=*$`);

    return regex.test(value.trim()) ? value.trim() : null;
  }

  getPatientAvatarSrc(patient: PatientResponse): string {
    return this.getPatientImageSrc(patient) ?? this.defaultProfileImage;
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
