import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { buildApiUrl } from '../utils/url';

export interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = buildApiUrl('/api/users');

  constructor(private http: HttpClient) { }

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  updateUser(id: number, data: { name: string; email: string }): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}`, data);
  }

  changePassword(id: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/password`, data);
  }
}