import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { buildApiUrl } from '../utils/url';
import { Treatment } from '@models/odontogram';

@Injectable({
  providedIn: 'root'
})
export class TreatmentService {
  private http = inject(HttpClient);
  private apiUrl = buildApiUrl('/api/treatments');

  getTreatments(): Observable<Treatment[]> {
    return this.http.get<Treatment[]>(this.apiUrl);
  }

  getTreatment(id: number): Observable<Treatment> {
    return this.http.get<Treatment>(`${this.apiUrl}/${id}`);
  }

  create(treatment: Treatment): Observable<Treatment> {
    return this.http.post<Treatment>(this.apiUrl, treatment);
  }

  update(id: number, treatment: Treatment): Observable<Treatment> {
    return this.http.put<Treatment>(`${this.apiUrl}/${id}`, treatment);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
