import { Router, RouterOutlet, ActivatedRoute, NavigationEnd } from '@angular/router';
import { PatientService, PatientResponse } from '@services/patient.service';
import { PatientListComponent } from '@features/patient-list/patient-list.component';
import { filter } from 'rxjs';
import { Component, OnInit, inject, signal, computed } from '@angular/core';

@Component({
  selector: 'app-odontogram-layout',
  standalone: true,
  // Importamos RouterOutlet para que funcionen las rutas hijas y PatientListComponent para la lista
  imports: [RouterOutlet, PatientListComponent],
  templateUrl: './odontogram-layout.component.html',
  styleUrl: './odontogram-layout.component.css'
})
export class OdontogramLayoutComponent implements OnInit {
  private patientService = inject(PatientService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Estados
  allPatients = signal<PatientResponse[]>([]);
  searchTerm = signal('');
  isLoading = signal(false);
  selectedPatientId = signal<number | null>(null);

  // Filtro inteligente de pacientes
  filteredPatients = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.allPatients();
    return this.allPatients().filter(p =>
      `${p.firstName} ${p.lastName} ${p.nationalId}`.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.loadPatients();
    this.syncIdFromUrl();
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

  // Detecta qué paciente está en la URL para marcarlo como "activo" en la lista lateral
  private syncIdFromUrl(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      const child = this.route.firstChild;
      if (child) {
        const id = child.snapshot.paramMap.get('id');
        this.selectedPatientId.set(id ? Number(id) : null);
      }
    });
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
  }

  onPatientSelected(patient: PatientResponse) {
    this.router.navigate(['/odontogram', patient.id]);
  }
}