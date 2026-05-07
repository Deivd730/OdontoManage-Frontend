import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
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

  getPatients(): Observable<PatientResponse[]> {
    return this.http.get<PatientResponse[]>(this.apiUrl).pipe(
      map((patients) => this.sortPatientsByNewest(patients))
    );
  }

  getPatient(id: number): Observable<PatientResponse> {
    return this.http.get<PatientResponse>(`${this.apiUrl}/${id}`);
  }

  createPatient(patient: Patient): Observable<PatientResponse> {
    return this.http.post<PatientResponse>(this.apiUrl, patient);
  }

  updatePatient(id: number, patient: Patient): Observable<PatientResponse> {
    return this.http.put<PatientResponse>(`${this.apiUrl}/${id}`, patient);
  }

  uploadPatientProfileImage(id: number, imageFile: File): Observable<PatientResponse> {
    const formData = new FormData();
    formData.append('profileImageFile', imageFile, imageFile.name);

    return this.http.post<PatientResponse>(`${this.apiUrl}/${id}/profile-image`, formData);
  }

  updatePatientWithProfileImage(id: number, patient: Patient, imageFile: File): Observable<PatientResponse> {
    return this.updatePatient(id, patient).pipe(
      switchMap(() => this.uploadPatientProfileImage(id, imageFile)),
      switchMap(() => this.getPatient(id))
    );
  }

  deletePatient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
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

}
