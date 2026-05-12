import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { buildApiUrl } from '../utils/url';
import { Pathology } from '@models/odontogram';

@Injectable({
  providedIn: 'root'
})
export class PathologyService {
  private http = inject(HttpClient);
  private apiUrl = buildApiUrl('/api/pathologies');

  getPathologies(): Observable<Pathology[]> {
    return this.http.get<Pathology[]>(this.apiUrl);
  }

  getPathology(id: number): Observable<Pathology> {
    return this.http.get<Pathology>(`${this.apiUrl}/${id}`);
  }

  create(pathology: Pathology): Observable<Pathology> {
    return this.http.post<Pathology>(this.apiUrl, pathology);
  }

  update(id: number, pathology: Pathology): Observable<Pathology> {
    return this.http.put<Pathology>(`${this.apiUrl}/${id}`, pathology);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
