import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

export interface Patient {
  id?: number;
  first_name: string;
  last_name: string;
  national_id: string;
  social_security_number: string;
  phone: string;
  email: string;
  address: string;
  billing_data: string;
  health_status: string;
  family_history: string;
  lifestyle_habits: string;
  medication_allergies: string;
  registration_date?: string;
}

export interface PatientResponse {
  id: number;
  first_name: string;
  last_name: string;
  national_id: string;
  social_security_number: string;
  phone: string;
  email: string;
  address: string;
  billing_data: string;
  health_status: string;
  family_history: string;
  lifestyle_habits: string;
  medication_allergies: string;
  registration_date: string;
}

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Crear un nuevo paciente
   */
  createPatient(patient: Patient): Observable<PatientResponse> {
    return this.http.post<PatientResponse>(`${this.apiUrl}/api/patients`, patient);
  }

  /**
   * Obtener un paciente por ID
   */
  getPatient(id: number): Observable<PatientResponse> {
    return this.http.get<PatientResponse>(`${this.apiUrl}/api/patients/${id}`);
  }

  /**
   * Obtener todos los pacientes
   */
  getPatients(): Observable<PatientResponse[]> {
    return this.http.get<PatientResponse[]>(`${this.apiUrl}/api/patients`);
  }

  /**
   * Actualizar un paciente
   */
  updatePatient(id: number, patient: Patient): Observable<PatientResponse> {
    return this.http.put<PatientResponse>(`${this.apiUrl}/api/patients/${id}`, patient);
  }

  /**
   * Eliminar un paciente
   */
  deletePatient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/patients/${id}`);
  }
}
