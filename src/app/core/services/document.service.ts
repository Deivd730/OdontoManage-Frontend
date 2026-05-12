import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { buildApiUrl } from '../utils/url';

export interface PatientDocument {
  id: number;
  patient: unknown;
  type: string;
  name: string;
  fileUrl: string | null;
  captureDate: string;
}

export interface CreatePatientDocumentPayload {
  patientId: number;
  type: string;
  name: string;
  captureDate: string;
  file: File;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private http = inject(HttpClient);
  private readonly apiUrl = buildApiUrl('/api/documents');

  getByPatient(patientId: number): Observable<PatientDocument[]> {
    return this.http.get<PatientDocument[]>(this.apiUrl + '/patient/' + patientId);
  }

  create(payload: CreatePatientDocumentPayload): Observable<PatientDocument> {
    const formData = new FormData();
    formData.append('patient', String(payload.patientId));
    formData.append('type', payload.type);
    formData.append('name', payload.name);
    formData.append('captureDate', payload.captureDate);
    formData.append('documentFile', payload.file);

    return this.http.post<PatientDocument>(this.apiUrl, formData);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(this.apiUrl + '/' + id);
  }
}