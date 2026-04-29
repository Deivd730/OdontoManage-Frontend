import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { PatientResponse } from '@services/patient.service';
import { PatientListComponent } from '@features/patient-list/patient-list.component';
import { DocumentListComponent } from './document-list.component';

@Component({
  selector: 'app-document',
  standalone: true,
  imports: [PatientListComponent, DocumentListComponent],
  templateUrl: './document.component.html',
  styleUrl: './document.component.css',
})
export class DocumentComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  selectedPatientId = signal<number | null>(null);

  ngOnInit(): void {
    const paramId = this.route.snapshot.queryParamMap.get('patientId');
    if (paramId) {
      this.selectedPatientId.set(Number(paramId));
    }
  }

  onPatientSelected(patient: PatientResponse): void {
    this.selectedPatientId.set(patient.id);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { patientId: patient.id },
      queryParamsHandling: 'merge'
    });
  }
}