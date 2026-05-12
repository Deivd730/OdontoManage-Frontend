import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { buildApiUrl } from '../utils/url';
import { Odontogram } from '@models/odontogram';

@Injectable({
  providedIn: 'root'
})
export class OdontogramService {
  private http = inject(HttpClient);
  private apiUrl = buildApiUrl('/api/odontograms');

  getOdontograms(): Observable<Odontogram[]> {
    return this.http.get<Odontogram[]>(this.apiUrl);
  }

  getOdontogram(id: number): Observable<Odontogram> {
    return this.http.get<Odontogram>(`${this.apiUrl}/${id}`);
  }

  getOdontogramByPatient(patientId: number): Observable<Odontogram[]> {
    return this.http.get<Odontogram[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  create(odontogram: Odontogram): Observable<Odontogram> {
    return this.http.post<Odontogram>(this.apiUrl, odontogram);
  }

  update(id: number, odontogram: Odontogram): Observable<Odontogram> {
    return this.http.put<Odontogram>(`${this.apiUrl}/${id}`, odontogram);
  }

  save(odontogram: Odontogram): Observable<Odontogram> {
    if (odontogram.id) {
      return this.update(odontogram.id, odontogram);
    }
    return this.create(odontogram);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
