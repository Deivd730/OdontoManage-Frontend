import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

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

export interface PatientResponse {
  id: number;
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

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createPatient(patient: Patient): Observable<PatientResponse> {
    return this.http.post<PatientResponse>(`${this.apiUrl}/api/patients`, patient);
  }

  getPatient(id: number): Observable<PatientResponse> {
    return this.http.get<PatientResponse>(`${this.apiUrl}/api/patients/${id}`);
  }

  getPatients(): Observable<PatientResponse[]> {
    return this.http.get<PatientResponse[]>(`${this.apiUrl}/api/patients`);
  }

  updatePatient(id: number, patient: Patient): Observable<PatientResponse> {
    return this.http.put<PatientResponse>(`${this.apiUrl}/api/patients/${id}`, patient);
  }

  deletePatient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/patients/${id}`);
  }
}
