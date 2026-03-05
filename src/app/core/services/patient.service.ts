import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment.development';
export interface Patient {
  firstName: string;
  lastName: string;
  nationalId: string;
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
}

export interface PatientResponse extends Patient {
  id: number;
}

@Injectable({
  providedIn: 'root'
})
export class PatientService {

  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/patients`;

  getPatients(): Observable<PatientResponse[]> {
    return this.http.get<PatientResponse[]>(this.apiUrl);
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

  deletePatient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}