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
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  updateSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }
}
