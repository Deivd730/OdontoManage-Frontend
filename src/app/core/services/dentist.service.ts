import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

export interface DentistResponse {
  id: number;
  firstName?: string;
  lastName?: string;
  name?: string;
  treatment?: {
    id: number;
    name: string;
  } | null;
  availableDays?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class DentistService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/dentists`;

  getDentists(): Observable<DentistResponse[]> {
    return this.http.get<DentistResponse[]>(this.apiUrl);
  }
}