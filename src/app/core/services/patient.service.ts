import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';

export interface Patient {
  firstName: string;
  lastName: string;
  nationalId: string;
  birthDate?: string;
  socialSecurityNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  billingData?: string;
  healthStatus?: string;
  familyHistory?: string;
  lifestyleHabits?: string;
  medicationAllergies?: string;
  medicalTreatmentConsent?: boolean;
  anesthesiaConsent?: boolean;
  hasInfectiousDiseases?: boolean;
  infectiousDiseases?: string;
  registrationDate?: string;
  profileImageName?: string;
}

export interface PatientResponse extends Patient {
  id: number;
  firstName: string;
  lastName: string;
  nationalId: string;
  birthDate?: string;
  socialSecurityNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  billingData?: string;
  healthStatus?: string;
  familyHistory?: string;
  lifestyleHabits?: string;
  medicationAllergies?: string;
  registrationDate: string;
  profileImageName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PatientService {

  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/patients`;
  private patientsCache$?: Observable<PatientResponse[]>;

  getPatients(): Observable<PatientResponse[]> {
    if (!this.patientsCache$) {
      this.patientsCache$ = this.http.get<PatientResponse[]>(this.apiUrl).pipe(
        map((patients) => this.sortPatientsByNewest(patients)),
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }

    return this.patientsCache$;
  }

  getPatient(id: number): Observable<PatientResponse> {
    return this.http.get<PatientResponse>(`${this.apiUrl}/${id}`);
  }

  createPatient(patient: Patient): Observable<PatientResponse> {
    return this.http.post<PatientResponse>(this.apiUrl, patient).pipe(
      tap(() => this.clearPatientsCache())
    );
  }

  updatePatient(id: number, patient: Patient): Observable<PatientResponse> {
    return this.http.put<PatientResponse>(`${this.apiUrl}/${id}`, patient).pipe(
      tap(() => this.clearPatientsCache())
    );
  }

  uploadPatientProfileImage(id: number, imageFile: File): Observable<PatientResponse> {
    const formData = new FormData();
    formData.append('profileImageFile', imageFile, imageFile.name);

    return this.http.post<PatientResponse>(`${this.apiUrl}/${id}/profile-image`, formData).pipe(
      tap(() => this.clearPatientsCache())
    );
  }

  updatePatientWithProfileImage(id: number, patient: Patient, imageFile: File): Observable<PatientResponse> {
    return this.updatePatient(id, patient).pipe(
      switchMap(() => this.uploadPatientProfileImage(id, imageFile)),
      switchMap(() => this.getPatient(id)),
      tap(() => this.clearPatientsCache())
    );
  }

  deletePatient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.clearPatientsCache())
    );
  }

  private sortPatientsByNewest(patients: PatientResponse[]): PatientResponse[] {
    return [...patients].sort((a, b) => {
      const byRegistrationDate = this.toTimestamp(b.registrationDate) - this.toTimestamp(a.registrationDate);
      if (byRegistrationDate !== 0) {
        return byRegistrationDate;
      }

      return b.id - a.id;
    });
  }

  private toTimestamp(dateValue?: string): number {
    if (!dateValue) {
      return 0;
    }

    const parsed = Date.parse(dateValue);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private clearPatientsCache(): void {
    this.patientsCache$ = undefined;
  }

}
