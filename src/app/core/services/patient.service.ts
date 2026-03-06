import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
  profile_image_name?: string;
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
  profile_image_name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createPatient(patient: Patient): Observable<PatientResponse> {
    return this.http.post<unknown>(`${this.apiUrl}/api/patients`, patient).pipe(
      map(response => this.mapPatientResponse(response))
    );
  }

  getPatient(id: number): Observable<PatientResponse> {
    return this.http.get<unknown>(`${this.apiUrl}/api/patients/${id}`).pipe(
      map(response => this.mapPatientResponse(response))
    );
  }

  getPatients(): Observable<PatientResponse[]> {
    return this.http.get<unknown[]>(`${this.apiUrl}/api/patients`).pipe(
      map(patients => patients.map(patient => this.mapPatientResponse(patient)))
    );
  }

  updatePatient(id: number, patient: Patient): Observable<PatientResponse> {
    return this.http.put<unknown>(`${this.apiUrl}/api/patients/${id}`, patient).pipe(
      map(response => this.mapPatientResponse(response))
    );
  }

  deletePatient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/patients/${id}`);
  }

  private mapPatientResponse(response: unknown): PatientResponse {
    const patient = response as Record<string, unknown>;

    return {
      id: patient['id'] as number,
      firstName: (patient['firstName'] as string) ?? '',
      lastName: (patient['lastName'] as string) ?? '',
      nationalId: (patient['nationalId'] as string) ?? '',
      socialSecurityNumber: patient['socialSecurityNumber'] as string | undefined,
      phone: patient['phone'] as string | undefined,
      email: patient['email'] as string | undefined,
      address: patient['address'] as string | undefined,
      billingData: patient['billingData'] as string | undefined,
      healthStatus: patient['healthStatus'] as string | undefined,
      familyHistory: patient['familyHistory'] as string | undefined,
      lifestyleHabits: patient['lifestyleHabits'] as string | undefined,
      medicationAllergies: patient['medicationAllergies'] as string | undefined,
      registrationDate: (patient['registrationDate'] as string) ?? new Date().toISOString(),
      profile_image_name: this.extractImageValue(patient)
    };
  }

  private extractImageValue(patient: Record<string, unknown>): string | undefined {
    const directValue =
      patient['profile_image_name'] ??
      patient['profileImageName'] ??
      patient['profileImage'] ??
      patient['profile_image'] ??
      patient['avatar'] ??
      patient['image'];

    if (typeof directValue === 'string' && directValue.trim()) {
      return directValue;
    }

    if (directValue && typeof directValue === 'object') {
      const objectValue = directValue as Record<string, unknown>;
      const nested = objectValue['data'] ?? objectValue['base64'] ?? objectValue['content'];
      if (typeof nested === 'string' && nested.trim()) {
        return nested;
      }
    }

    return undefined;
  }
}
