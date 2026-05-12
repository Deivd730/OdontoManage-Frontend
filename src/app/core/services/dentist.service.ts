import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { buildApiUrl } from '../utils/url';

export interface DentistTreatment {
  id: number;
  name: string;
  durationMinutes?: number;
}

export interface DentistResponse {
  id: number;
  firstName?: string;
  lastName?: string;
  name?: string;
  treatment?: {
    id: number;
    name: string;
  } | null;
  treatments?: DentistTreatment[];
  availableDays?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class DentistService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = buildApiUrl('/api/dentists');

  getDentists(): Observable<DentistResponse[]> {
    return this.http.get<DentistResponse[]>(this.apiUrl);
  }
}