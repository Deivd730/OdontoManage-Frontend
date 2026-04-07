import { Component, input, output } from '@angular/core';
import { PatientResponse } from '@services/patient.service';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  template: `
    <aside class="patients-list">    
      <div class="list-body">
        @if (isLoading()) {
          <div class="empty-state">Cargando pacientes...</div>
        } @else if (patients().length === 0) {
          <div class="empty-state h2 ">Selecciona un paciente</div>
        } @else {
          <div class="patients-items">
            @for (patient of patients(); track patient.id) {
              <button
                class="patient-item"
                [class.active]="selectedPatientId() === patient.id"
                (click)="selectPatient.emit(patient)"
              >
                <div class="patient-avatar">
                  {{ patient.firstName.charAt(0) }}{{ patient.lastName.charAt(0) }}
                </div>
                <div class="patient-summary">
                  <div class="patient-name">{{ patient.firstName }} {{ patient.lastName }}</div>
                  <div class="patient-meta">DNI {{ patient.nationalId }}</div>
                </div>
              </button>
            }
          </div>
        }
      </div>
    </aside>
  `
})
export class PatientListComponent {

  patients = input<PatientResponse[]>([]);
  selectedPatientId = input<number | null>(null);
  isLoading = input(false);
  searchTerm = input('');

  selectPatient = output<PatientResponse>();
  searchChange = output<string>();

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchChange.emit(target.value);
  }
}