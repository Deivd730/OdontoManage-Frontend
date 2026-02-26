import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientResponse } from '../../../core/services/patient.service';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="patients-list">
      <div class="search-box">
        <input
          type="text"
          placeholder="Buscar por nombre o DNI"
          [value]="searchTerm"
          (input)="onSearchInput($event)"
        />
      </div>

      <div class="list-body">
        @if (isLoading) {
          <div class="empty-state">Cargando pacientes...</div>
        } @else if (patients.length === 0) {
          <div class="empty-state">No hay pacientes para mostrar.</div>
        } @else {
          <div class="patients-items">
            @for (patient of patients; track patient.id) {
              <button
                class="patient-item"
                [class.active]="selectedPatientId === patient.id"
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
  @Input() patients: PatientResponse[] = [];
  @Input() selectedPatientId: number | null = null;
  @Input() isLoading = false;
  @Input() searchTerm = '';

  @Output() selectPatient = new EventEmitter<PatientResponse>();
  @Output() searchChange = new EventEmitter<string>();

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchChange.emit(target.value);
  }
}
