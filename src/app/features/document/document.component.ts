import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { PatientResponse } from '@services/patient.service';
import { PatientListComponent } from '@features/patient-list/patient-list.component';
import { DocumentListComponent } from './document-list.component';
import { filter } from 'rxjs';

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
    this.syncIdFromUrl();
  }

  private syncIdFromUrl(): void {
    // Captura el patientId de la URL si existe
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

  onPatientSelected(patient: PatientResponse) {
    this.selectedPatientId.set(patient.id);
  }
}
